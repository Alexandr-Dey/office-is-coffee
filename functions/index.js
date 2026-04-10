const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

/* ═══ HELPERS ═══ */
function getAlmatyDate(date) {
  const d = date || new Date();
  return d.toLocaleString("sv", { timeZone: "Asia/Almaty" }).split(" ")[0];
}

async function sendPush(uid, title, body, data) {
  const tokenSnap = await db.collection("push_tokens").doc(uid).get();
  if (!tokenSnap.exists || !tokenSnap.data().token) return;
  await getMessaging().send({
    token: tokenSnap.data().token,
    notification: { title, body },
    data: data || {},
    webpush: {
      notification: { icon: "/icon-192.png", badge: "/icon-192.png" },
    },
  }).catch((err) => console.warn("Push failed for", uid, err.message));
}

async function sendPushMulti(tokens, title, body, data) {
  if (tokens.length === 0) return;
  await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: data || {},
    webpush: {
      notification: { icon: "/icon-192.png", badge: "/icon-192.png" },
    },
  }).catch((err) => console.warn("Multi push failed:", err.message));
}

async function getBaristaTokens() {
  const baristasSnap = await db.collection("users").where("role", "in", ["barista", "ceo"]).get();
  const tokens = [];
  for (const d of baristasSnap.docs) {
    const tokenSnap = await db.collection("push_tokens").doc(d.id).get();
    if (tokenSnap.exists && tokenSnap.data().token) tokens.push(tokenSnap.data().token);
  }
  return tokens;
}

/* ═══ 1. ON ORDER CREATE — set pending + push baristas + deposit deduction + loyalty ═══ */
exports.onOrderCreate = onDocumentCreated("orders/{orderId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;
  const orderId = event.params.orderId;
  const orderRef = event.data.ref;
  const userId = data.userId;

  // Auto-transition new → pending
  await orderRef.update({ status: "pending" });

  // Push to all baristas
  const tokens = await getBaristaTokens();
  const itemNames = (data.items || []).map((i) => i.name).join(", ");
  await sendPushMulti(tokens, "Новый заказ!", `${itemNames} от ${data.name || "Клиент"}`);

  // Deposit payment: deduct balance atomically
  if (data.paymentMethod === "deposit" && !data.isFreeByLoyalty && data.total > 0 && userId) {
    const depRef = db.collection("deposits").doc(userId);
    await db.runTransaction(async (tx) => {
      const depSnap = await tx.get(depRef);
      if (!depSnap.exists) throw new Error("No deposit account");
      const bal = depSnap.data().balance || 0;
      if (bal < data.total) throw new Error("Insufficient balance");
      tx.update(depRef, {
        balance: bal - data.total,
        totalSpent: (depSnap.data().totalSpent || 0) + data.total,
        history: FieldValue.arrayUnion({
          type: "payment", amount: data.total, date: new Date().toISOString(), orderId,
        }),
      });
    });
  }

  // Update loyalty count + streak
  if (userId && userId !== "anonymous") {
    const userRef = db.collection("users").doc(userId);
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) return;
      const userData = userSnap.data();

      // Loyalty
      let lc = (userData.loyaltyCount || 0) + 1;
      let isFree = false;
      if (lc >= 8) {
        isFree = true;
        lc = 0;
      }

      // Streak
      const today = getAlmatyDate();
      const lastOrder = userData.lastOrderDate;
      const yesterday = getAlmatyDate(new Date(Date.now() - 86400000));
      let newStreak = 1;
      if (lastOrder === yesterday) newStreak = (userData.streak || 0) + 1;
      else if (lastOrder === today) newStreak = userData.streak || 1;

      tx.update(userRef, {
        loyaltyCount: lc,
        streak: newStreak,
        lastOrderDate: today,
      });

      // Mark order as free if loyalty triggered
      if (isFree) {
        tx.update(orderRef, { isFreeByLoyalty: true, total: 0 });
      }
    });
  }
});

/* ═══ 2. ON ORDER STATUS CHANGE — push + bonus ═══ */
exports.onOrderReady = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;
  if (before.status === after.status) return;

  const orderId = event.params.orderId;
  const userId = after.userId;
  const clientName = after.name || "Клиент";

  /* ── accepted → push client ── */
  if (after.status === "accepted") {
    if (userId && userId !== "anonymous") {
      const mins = after.estimatedMinutes ? ` (~${after.estimatedMinutes} мин)` : "";
      await sendPush(userId, "Ваш кофе готовится! ☕", `Бариста принял заказ${mins}`);
    }
  }

  /* ── ready → bonus + push client ── */
  if (after.status === "ready") {
    // Barista bonus (+5₸) only if not free
    if (!after.isFreeByLoyalty) {
      const baristaId = after.baristaid;
      if (baristaId) {
        const bonusRef = db.collection("barista_bonuses").doc(baristaId);
        await db.runTransaction(async (tx) => {
          const bonusSnap = await tx.get(bonusRef);
          if (bonusSnap.exists) {
            const history = bonusSnap.data().history || [];
            if (history.some((h) => h.orderId === orderId)) return;
            tx.update(bonusRef, {
              totalBonus: FieldValue.increment(5),
              pendingPayout: FieldValue.increment(5),
              history: FieldValue.arrayUnion({ orderId, amount: 5, date: new Date().toISOString() }),
            });
          } else {
            tx.set(bonusRef, {
              totalBonus: 5, pendingPayout: 5,
              history: [{ orderId, amount: 5, date: new Date().toISOString() }],
            });
          }
        });
        await event.data.after.ref.update({ baristaBonus: 5 });
      }
    }

    if (userId && userId !== "anonymous") {
      await sendPush(userId, "Твой кофе готов! 🎉", "Забирай у стойки");
    }

    // Push baristas that order is ready for pickup
    const tokens = await getBaristaTokens();
    await sendPushMulti(tokens, "Заказ готов к выдаче", `${clientName} — можно выдавать`);
  }

  /* ── cancelled → push client ── */
  if (after.status === "cancelled") {
    if (userId && userId !== "anonymous") {
      const reason = after.cancelReason || "Нет в наличии";
      await sendPush(userId, "Заказ отменён 😔", reason);
    }
  }

  /* ── paid → push barista confirmation ── */
  if (after.status === "paid") {
    const baristaId = after.baristaid;
    if (baristaId) {
      await sendPush(baristaId, "Заказ завершён ✅", `${clientName} — оплачен`);
    }
  }
});

/* ═══ 3. DEPOSIT TOPUP — callable by barista/ceo ═══ */
exports.onDepositTopup = onCall(async (request) => {
  const { uid: callerUid } = request.auth || {};
  if (!callerUid) throw new HttpsError("unauthenticated", "Not authenticated");

  // Check role via Custom Claims
  const callerRole = request.auth.token.role;
  if (callerRole !== "barista" && callerRole !== "ceo") {
    throw new HttpsError("permission-denied", "Only barista/ceo");
  }

  const { targetUid, amount } = request.data;
  if (!targetUid || !amount || amount <= 0) throw new HttpsError("invalid-argument", "Bad args");

  const depRef = db.collection("deposits").doc(targetUid);
  await db.runTransaction(async (tx) => {
    const depSnap = await tx.get(depRef);
    if (depSnap.exists) {
      tx.update(depRef, {
        balance: FieldValue.increment(amount),
        totalTopup: FieldValue.increment(amount),
        lastTopupAt: new Date().toISOString(),
        history: FieldValue.arrayUnion({
          type: "topup", amount, date: new Date().toISOString(), baristaid: callerUid,
        }),
      });
    } else {
      tx.set(depRef, {
        balance: amount, totalTopup: amount, totalSpent: 0,
        lastTopupAt: new Date().toISOString(),
        history: [{ type: "topup", amount, date: new Date().toISOString(), baristaid: callerUid }],
      });
    }
  });

  // Push to client
  await sendPush(targetUid, "Депозит пополнен!", `+${amount}₸ 🎉`);

  return { success: true };
});

/* ═══ 4. STREAK CHECK — daily at 17:00 UTC+5 (12:00 UTC) ═══ */
exports.scheduledStreakCheck = onSchedule("every day 12:00", async () => {
  const today = getAlmatyDate();
  const yesterday = getAlmatyDate(new Date(Date.now() - 86400000));
  const usersSnap = await db.collection("users").where("role", "==", "client").get();

  const batch = db.batch();
  let pushCount = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();

    // Reset streak if lastOrderDate is older than yesterday
    if (data.lastOrderDate && data.lastOrderDate < yesterday && (data.streak || 0) > 0) {
      batch.update(userDoc.ref, { streak: 0 });
    }

    // Send reminder if they haven't ordered today and have a streak to lose
    if (data.lastOrderDate !== today && (data.streak || 0) > 0) {
      await sendPush(userDoc.id, "Стрик под угрозой! 🔥", "Зайди за кофе чтобы сохранить стрик");
      pushCount++;
    }
  }

  await batch.commit();
  console.log(`Streak check: sent ${pushCount} reminders`);
});

/* ═══ 5. ON CAFE OPEN — push all clients ═══ */
exports.onCafeOpen = onDocumentUpdated("cafe_status/aksay_main", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;

  // Only trigger when isOpen changes from false to true
  if (before.isOpen === true || after.isOpen !== true) return;

  const clientsSnap = await db.collection("users").where("role", "==", "client").get();
  const tokens = [];
  for (const d of clientsSnap.docs) {
    const tokenSnap = await db.collection("push_tokens").doc(d.id).get();
    if (tokenSnap.exists && tokenSnap.data().token) tokens.push(tokenSnap.data().token);
  }

  await sendPushMulti(tokens, "Кофейня открыта! ☕", "Love is Coffee ждёт тебя. Заходи за кофе!");
});
