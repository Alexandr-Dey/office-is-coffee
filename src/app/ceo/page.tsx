"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { useRequireCEO } from "@/lib/auth";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

interface BaristaBonus {
  id: string;
  totalBonus: number;
  pendingPayout: number;
  payoutRequested?: boolean;
  history: { orderId: string; amount: number; date: string }[];
}

export default function CEOPage() {
  const { user, loading } = useRequireCEO();
  const [bonuses, setBonuses] = useState<BaristaBonus[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getDocs(collection(getFirebaseDb(), "barista_bonuses")).then((snap) => {
      setBonuses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BaristaBonus, "id">) })));
    }).catch(() => {});
  }, [refreshKey]);

  const markPaid = async (baristaId: string) => {
    await updateDoc(doc(getFirebaseDb(), "barista_bonuses", baristaId), {
      pendingPayout: 0,
      payoutRequested: false,
    }).catch(() => {});
    setRefreshKey((k) => k + 1);
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-bg">
        <p className="text-brand-text/50">Загрузка...</p>
      </main>
    );
  }

  const totalPending = bonuses.reduce((s, b) => s + b.pendingPayout, 0);

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">\uD83D\uDC51</span>
            <span className="font-display text-xl font-bold text-brand-text">CEO Дашборд</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/ceo/menu" className="text-sm text-brand-dark font-semibold hover:underline">{"\uD83D\uDCDD Меню"}</a>
            <a href="/menu" className="text-sm text-brand-text/50 hover:text-brand-dark">{"\u2190 Клиент"}</a>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-6 text-white text-center mb-6">
            <p className="text-sm text-white/70 mb-1">Общая сумма к выплате</p>
            <p className="text-4xl font-bold">{totalPending}\u20B8</p>
          </motion.div>

          {/* Baristas */}
          <h2 className="font-bold text-brand-text mb-4">Баристы</h2>
          <div className="space-y-4">
            {bonuses.length === 0 ? (
              <p className="text-center text-brand-text/40 py-8">Нет данных о бонусах</p>
            ) : (
              bonuses.map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-[#d0f0e0] p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-brand-text">{b.id}</p>
                      <p className="text-xs text-brand-text/40">Всего: {b.totalBonus}\u20B8</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-dark text-lg">{b.pendingPayout}\u20B8</p>
                      <p className="text-xs text-brand-text/40">к выплате</p>
                    </div>
                  </div>
                  {b.payoutRequested && (
                    <div className="bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-full mb-3 inline-block">
                      Запрошена выплата
                    </div>
                  )}
                  {b.pendingPayout > 0 && (
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => markPaid(b.id)}
                      className="w-full py-2.5 bg-brand-dark text-white rounded-xl text-sm font-bold">
                      Выплачено \u2713
                    </motion.button>
                  )}
                  {b.history && b.history.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-brand-text/40 cursor-pointer">История ({b.history.length})</summary>
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {b.history.slice(-5).reverse().map((h, i) => (
                          <div key={i} className="flex justify-between text-xs text-brand-text/50">
                            <span>{new Date(h.date).toLocaleDateString("ru")}</span>
                            <span>+{h.amount}\u20B8</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
