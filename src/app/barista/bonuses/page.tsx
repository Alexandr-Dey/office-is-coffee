"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRequireBarista } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

interface BonusHistory {
  orderId: string;
  amount: number;
  date: string;
}

export default function BaristaBonusesPage() {
  const { user, loading } = useRequireBarista();
  const [totalBonus, setTotalBonus] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [history, setHistory] = useState<BonusHistory[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(getFirebaseDb(), "barista_bonuses", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setTotalBonus(d.totalBonus ?? 0);
        setPendingPayout(d.pendingPayout ?? 0);
        setPayoutRequested(d.payoutRequested ?? false);
        setHistory((d.history ?? []) as BonusHistory[]);
      }
      setDataLoading(false);
    }, () => setDataLoading(false));
    return () => unsub();
  }, [user]);

  const requestPayout = async () => {
    if (!user || pendingPayout === 0) return;
    await updateDoc(doc(getFirebaseDb(), "barista_bonuses", user.uid), {
      payoutRequested: true,
    }).catch(() => {});
  };

  if (loading || dataLoading) {
    return (
      <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="h-8 bg-[#d0f0e0] rounded-lg w-1/3 animate-pulse" />
          <div className="h-32 bg-[#d0f0e0] rounded-2xl animate-pulse" />
          <div className="h-48 bg-[#d0f0e0] rounded-2xl animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">💰 Мои бонусы</h1>

        {/* Balance cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-4 text-white">
            <p className="text-xs text-white/70">К выплате</p>
            <p className="text-2xl font-bold">{pendingPayout.toLocaleString("ru-RU")}₸</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <p className="text-xs text-brand-text/50">Всего заработано</p>
            <p className="text-2xl font-bold text-brand-dark">{totalBonus.toLocaleString("ru-RU")}₸</p>
          </div>
        </div>

        {/* Payout button */}
        {pendingPayout > 0 && (
          <div className="mb-4">
            {payoutRequested ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                <p className="text-yellow-700 font-semibold">⏳ Запрос на выплату отправлен</p>
                <p className="text-xs text-yellow-600 mt-1">CEO увидит запрос в дашборде</p>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={requestPayout}
                className="w-full py-3 bg-brand-dark text-white font-bold rounded-xl min-h-[44px]"
              >
                Запросить выплату {pendingPayout.toLocaleString("ru-RU")}₸
              </motion.button>
            )}
          </div>
        )}

        {/* How bonuses work */}
        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <h2 className="font-bold text-brand-text text-sm mb-2">Как это работает</h2>
          <div className="space-y-2 text-xs text-brand-text/60">
            <p>☕ +5₸ за каждый выданный заказ</p>
            <p>🎁 Бесплатные заказы (лояльность) не дают бонус</p>
            <p>💳 Запроси выплату → CEO одобрит</p>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <h2 className="font-bold text-brand-text text-sm mb-3">История начислений</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.slice().reverse().slice(0, 20).map((h, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-brand-text/50">{new Date(h.date).toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-green-600 font-bold">+{h.amount}₸</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </main>
  );
}
