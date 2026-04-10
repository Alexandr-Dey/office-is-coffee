import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export async function saveGameScore(uid: string, score: number, game: "match3"): Promise<void> {
  const userRef = doc(getFirebaseDb(), "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const current = snap.data()?.gameScores?.[game] ?? 0;
  if (score > current) {
    await updateDoc(userRef, {
      [`gameScores.${game}`]: score,
    });
  }
}

export async function getGameHighScore(uid: string, game: "match3"): Promise<number> {
  const snap = await getDoc(doc(getFirebaseDb(), "users", uid));
  if (!snap.exists()) return 0;
  return snap.data()?.gameScores?.[game] ?? 0;
}
