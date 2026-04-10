import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";
import { getApps } from "firebase/app";

interface ClientSegment {
  id: string;
  name: string;
  token: string;
  loyaltyCount: number;
  streak: number;
  lastOrderDate: string | null;
}

export interface SegmentCounts {
  sleeping: ClientSegment[];
  streakRisk: ClientSegment[];
  almostFree: ClientSegment[];
  vip: ClientSegment[];
  all: ClientSegment[];
}

function getAlmatyDate(offset = 0): string {
  const d = new Date(Date.now() + (5 * 3600000) + (offset * 86400000));
  return d.toISOString().slice(0, 10);
}

export async function getClientSegments(): Promise<SegmentCounts> {
  const db = getFirebaseDb();
  const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "client")));
  const tokensSnap = await getDocs(collection(db, "push_tokens"));

  const tokenMap = new Map<string, string>();
  tokensSnap.docs.forEach(d => {
    if (d.data().token) tokenMap.set(d.id, d.data().token);
  });

  // Count orders per user
  const ordersSnap = await getDocs(query(collection(db, "orders"), where("status", "==", "paid")));
  const orderCounts = new Map<string, number>();
  ordersSnap.docs.forEach(d => {
    const uid = d.data().userId;
    if (uid) orderCounts.set(uid, (orderCounts.get(uid) ?? 0) + 1);
  });

  const today = getAlmatyDate();
  const yesterday = getAlmatyDate(-1);
  const weekAgo = getAlmatyDate(-7);

  const all: ClientSegment[] = [];
  const sleeping: ClientSegment[] = [];
  const streakRisk: ClientSegment[] = [];
  const almostFree: ClientSegment[] = [];
  const vip: ClientSegment[] = [];

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const token = tokenMap.get(doc.id);
    if (!token) continue;

    const client: ClientSegment = {
      id: doc.id,
      name: data.displayName ?? "Клиент",
      token,
      loyaltyCount: data.loyaltyCount ?? 0,
      streak: data.streak ?? 0,
      lastOrderDate: data.lastOrderDate ?? null,
    };

    all.push(client);

    // Sleeping: no order in 7+ days
    if (client.lastOrderDate && client.lastOrderDate < weekAgo) {
      sleeping.push(client);
    }

    // Streak risk: ordered yesterday, streak > 2, hasn't ordered today
    if (client.lastOrderDate === yesterday && client.streak > 2) {
      streakRisk.push(client);
    }

    // Almost free: 7/8 loyalty
    if (client.loyaltyCount === 7) {
      almostFree.push(client);
    }

    // VIP: 10+ orders
    if ((orderCounts.get(doc.id) ?? 0) >= 10) {
      vip.push(client);
    }
  }

  return { sleeping, streakRisk, almostFree, vip, all };
}

export async function sendManualPush(tokens: string[], title: string, body: string): Promise<number> {
  const app = getApps()[0];
  if (!app) throw new Error("Firebase not initialized");
  const functions = getFunctions(app);
  const fn = httpsCallable<{ tokens: string[]; title: string; body: string }, { sent: number }>(functions, "sendManualPush");

  // FCM limit: 500 per batch
  let totalSent = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const result = await fn({ tokens: batch, title, body });
    totalSent += result.data.sent;
  }
  return totalSent;
}
