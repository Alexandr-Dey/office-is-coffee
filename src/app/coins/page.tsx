"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function CoinsPage() {
  const { user } = useAuth();
  const [loyaltyCount, setLoyaltyCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(getFirebaseDb(), "users", user.uid), (snap) => {
      if (snap.exists()) {
        setLoyaltyCount(snap.data().loyaltyCount ?? 0);
        setStreak(snap.data().streak ?? 0);
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  const cups = Array.from({ length: 8 }, (_, i) => i < loyaltyCount);
  const nextFree = 8 - loyaltyCount;

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">\u2B50 Монеты</h1>

        {/* Loyalty card */}
        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-6 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <p className="text-sm text-brand-text/60 mb-3">Каждый 8-й кофе бесплатный</p>
          <div className="flex justify-center gap-2">
            {cups.map((filled, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring" }}
                className="text-2xl"
              >
                {filled ? "\u2615" : "\u25CB"}
              </motion.span>
            ))}
          </div>
          <p className="text-center text-xs text-brand-text/40 mt-2">{loyaltyCount} / 8</p>
          {loyaltyCount >= 7 ? (
            <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="text-center mt-3 text-brand-dark font-bold bg-brand-mint/20 rounded-full py-2">
              \uD83C\uDF89 Следующий кофе бесплатный!
            </motion.p>
          ) : (
            <p className="text-center text-xs text-brand-text/50 mt-3">
              Ещё {nextFree} до бесплатного кофе
            </p>
          )}
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-6 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-text/60 mb-1">Твой стрик</p>
              <p className="text-3xl font-bold text-brand-dark">{streak > 0 ? `\uD83D\uDD25 ${streak}` : "0"}</p>
              <p className="text-xs text-brand-text/40">{streak > 0 ? `${streak} дней подряд` : "Закажи кофе сегодня!"}</p>
            </div>
            <div className="text-5xl">{streak >= 7 ? "\uD83C\uDFC6" : streak >= 3 ? "\uD83D\uDD25" : "\u2615"}</div>
          </div>
        </div>

        {user && (
          <p className="text-sm text-brand-text/50 text-center">Привет, {user.displayName}!</p>
        )}
      </motion.div>
    </main>
  );
}
