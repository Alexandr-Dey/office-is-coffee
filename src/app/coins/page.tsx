"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";

function pluralDays(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs >= 11 && abs <= 19) return `${n} дней`;
  if (last === 1) return `${n} день`;
  if (last >= 2 && last <= 4) return `${n} дня`;
  return `${n} дней`;
}

interface OrderHistory {
  name: string;
  date: string;
  total: number;
}

export default function CoinsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loyaltyCount, setLoyaltyCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [history, setHistory] = useState<OrderHistory[]>([]);

  useEffect(() => {
    if (!user) { setDataLoading(false); return; }
    const unsub = onSnapshot(doc(getFirebaseDb(), "users", user.uid), (snap) => {
      if (snap.exists()) {
        setLoyaltyCount(snap.data().loyaltyCount ?? 0);
        setStreak(snap.data().streak ?? 0);
      }
      setDataLoading(false);
    }, () => { setDataLoading(false); });

    // Load last orders for history
    const q = query(
      collection(getFirebaseDb(), "orders"),
      where("userId", "==", user.uid),
      where("status", "==", "paid"),
      limit(8)
    );
    getDocs(q).then((snap) => {
      setHistory(snap.docs.map(d => {
        const data = d.data();
        return {
          name: (data.items ?? []).map((i: { name: string }) => i.name).join(", "),
          date: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toLocaleDateString("ru", { day: "numeric", month: "short" })
            : "",
          total: data.total ?? 0,
        };
      }));
    }).catch(() => {});

    return () => unsub();
  }, [user]);

  const cups = Array.from({ length: 8 }, (_, i) => i < loyaltyCount);
  const nextFree = 8 - loyaltyCount;
  const progress = (loyaltyCount / 8) * 100;

  if (authLoading || dataLoading) {
    return (
      <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="h-8 bg-[#d0f0e0] rounded-lg w-1/3 animate-pulse" />
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-6 animate-pulse">
            <div className="h-4 bg-[#d0f0e0] rounded w-2/3 mb-4" />
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-[#d0f0e0]" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">⭐ Монеты</h1>

        {/* Loyalty card with progress */}
        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <div className="flex justify-center gap-2 mb-3">
            {cups.map((filled, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring" }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${filled ? "bg-brand-dark" : "bg-gray-100"}`}
              >
                {filled ? "☕" : <span className="text-gray-300 text-sm">{i + 1}</span>}
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-brand-dark to-brand-mint rounded-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-text/60">{loyaltyCount} / 8</p>
            {loyaltyCount === 7 ? (
              <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="text-sm font-bold text-brand-dark bg-brand-mint/20 px-3 py-1 rounded-full">
                🎉 Следующий бесплатный!
              </motion.p>
            ) : (
              <p className="text-sm text-brand-text/40">Ещё {nextFree} до бесплатного</p>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-text/50 mb-1">Твой стрик</p>
              <p className="text-3xl font-bold text-brand-dark">{streak > 0 ? `🔥 ${streak}` : "0"}</p>
              <p className="text-xs text-brand-text/40 mt-1">
                {streak > 0 ? `${pluralDays(streak)} подряд` : "Закажи кофе сегодня!"}
              </p>
            </div>
            <div className="text-5xl">{streak >= 7 ? "🏆" : streak >= 3 ? "🔥" : "☕"}</div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <h3 className="font-bold text-brand-text text-sm mb-3">Как это работает</h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="text-lg">☕</span>
              <div>
                <p className="text-sm font-medium text-brand-text">Каждый заказ = +1 монета</p>
                <p className="text-xs text-brand-text/40">Любой напиток любого размера</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">🎉</span>
              <div>
                <p className="text-sm font-medium text-brand-text">8 монет = бесплатный кофе</p>
                <p className="text-xs text-brand-text/40">Следующий заказ за счёт кофейни</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-sm font-medium text-brand-text">Стрик = ежедневные заказы</p>
                <p className="text-xs text-brand-text/40">Пропустил день — стрик сбрасывается</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders that earned coins */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <h3 className="font-bold text-brand-text text-sm mb-3">Последние начисления</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-text truncate">{h.name}</p>
                    <p className="text-[10px] text-brand-text/30">{h.date}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-brand-text/40">{h.total}₸</span>
                    <span className="text-xs font-bold text-brand-dark bg-brand-mint/15 px-2 py-0.5 rounded-full">+1 ☕</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && (
          <p className="text-sm text-brand-text/40 text-center mt-4">Привет, {user.displayName}!</p>
        )}
      </motion.div>
    </main>
  );
}
