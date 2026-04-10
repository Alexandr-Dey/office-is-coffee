"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { useRequireCEO } from "@/lib/auth";
import { collection, getDocs, doc, updateDoc, query, where, orderBy, limit, Timestamp } from "firebase/firestore";

interface BaristaBonus {
  id: string;
  name?: string;
  totalBonus: number;
  pendingPayout: number;
  payoutRequested?: boolean;
  history: { orderId: string; amount: number; date: string }[];
}

interface OrderStats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  avgCheck: number;
}

function getAlmatyToday(): string {
  const d = new Date();
  const utc5 = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return utc5.toISOString().slice(0, 10);
}

export default function CEOPage() {
  const { user, loading } = useRequireCEO();
  const [bonuses, setBonuses] = useState<BaristaBonus[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load bonuses + resolve barista names
  useEffect(() => {
    async function loadBonuses() {
      const db = getFirebaseDb();
      const bonusSnap = await getDocs(collection(db, "barista_bonuses"));
      const raw = bonusSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BaristaBonus, "id">) }));

      // Resolve names
      const withNames = await Promise.all(
        raw.map(async (b) => {
          try {
            const userSnap = await getDocs(
              query(collection(db, "users"), where("__name__", "==", b.id), limit(1))
            );
            // Try direct doc read
            const userDoc = await import("firebase/firestore").then(({ getDoc, doc: docRef }) =>
              getDoc(docRef(db, "users", b.id))
            );
            return { ...b, name: userDoc.exists() ? userDoc.data().displayName : b.id };
          } catch {
            return b;
          }
        })
      );

      setBonuses(withNames);
    }
    loadBonuses().catch(() => {});
  }, [refreshKey]);

  // Load order stats
  useEffect(() => {
    async function loadStats() {
      const db = getFirebaseDb();
      const ordersSnap = await getDocs(collection(db, "orders"));
      const orders = ordersSnap.docs.map((d) => d.data());

      const today = getAlmatyToday();
      let totalRevenue = 0;
      let todayRevenue = 0;
      let totalOrders = 0;
      let todayOrders = 0;

      for (const o of orders) {
        if (o.status === "paid" || o.status === "ready" || o.status === "accepted" || o.status === "new" || o.status === "pending") {
          const amount = o.total ?? 0;
          totalRevenue += amount;
          totalOrders++;

          if (o.createdAt) {
            let orderDate: string;
            if (o.createdAt instanceof Timestamp) {
              const d = new Date(o.createdAt.toMillis() + 5 * 60 * 60 * 1000);
              orderDate = d.toISOString().slice(0, 10);
            } else if (typeof o.createdAt === "string") {
              orderDate = o.createdAt.slice(0, 10);
            } else {
              orderDate = "";
            }
            if (orderDate === today) {
              todayRevenue += amount;
              todayOrders++;
            }
          }
        }
      }

      setStats({
        totalRevenue,
        todayRevenue,
        totalOrders,
        todayOrders,
        avgCheck: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      });
    }
    loadStats().catch(() => {});
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

  const totalPending = bonuses.reduce((s, b) => s + (b.pendingPayout ?? 0), 0);

  function fmt(n: number): string {
    return n.toLocaleString("ru-RU").replace(/,/g, " ");
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <h1 className="font-display text-xl font-bold text-brand-text">CEO Дашборд</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/ceo/menu" className="text-sm text-brand-dark font-semibold hover:underline min-h-[44px] flex items-center">📝 Меню</a>
            <a href="/menu" className="text-sm text-brand-text/50 hover:text-brand-dark min-h-[44px] flex items-center">← Клиент</a>
          </div>
        </div>
      </nav>

      <div className="pt-4 pb-12 px-4">
        <div className="max-w-[480px] mx-auto">

          {/* Stats grid */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                <p className="text-xs text-brand-text/50">Сегодня</p>
                <p className="text-2xl font-bold text-brand-dark">{fmt(stats.todayRevenue)}₸</p>
                <p className="text-xs text-brand-text/40">{stats.todayOrders} заказов</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                <p className="text-xs text-brand-text/50">Всего</p>
                <p className="text-2xl font-bold text-brand-dark">{fmt(stats.totalRevenue)}₸</p>
                <p className="text-xs text-brand-text/40">{stats.totalOrders} заказов</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                <p className="text-xs text-brand-text/50">Средний чек</p>
                <p className="text-2xl font-bold text-brand-dark">{fmt(stats.avgCheck)}₸</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-4 text-white">
                <p className="text-xs text-white/70">К выплате</p>
                <p className="text-2xl font-bold">{fmt(totalPending)}₸</p>
                <p className="text-xs text-white/60">баристам</p>
              </motion.div>
            </div>
          )}

          {/* Baristas */}
          <h2 className="font-bold text-brand-text mb-4">Баристы — бонусы</h2>
          <div className="space-y-4">
            {bonuses.length === 0 ? (
              <p className="text-center text-brand-text/40 py-8">Нет данных о бонусах</p>
            ) : (
              bonuses.map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-[#d0f0e0] p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-brand-text">{b.name ?? b.id}</p>
                      <p className="text-xs text-brand-text/40">Всего заработано: {fmt(b.totalBonus ?? 0)}₸</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-dark text-lg">{fmt(b.pendingPayout ?? 0)}₸</p>
                      <p className="text-xs text-brand-text/40">к выплате</p>
                    </div>
                  </div>
                  {b.payoutRequested && (
                    <div className="bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-full mb-3 inline-block">
                      Запрошена выплата
                    </div>
                  )}
                  {(b.pendingPayout ?? 0) > 0 && (
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => markPaid(b.id)}
                      className="w-full py-2.5 bg-brand-dark text-white rounded-xl text-sm font-bold min-h-[44px]">
                      Выплачено ✓
                    </motion.button>
                  )}
                  {b.history && b.history.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-brand-text/40 cursor-pointer">История ({b.history.length})</summary>
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {b.history.slice(-5).reverse().map((h, i) => (
                          <div key={i} className="flex justify-between text-xs text-brand-text/50">
                            <span>{new Date(h.date).toLocaleDateString("ru")}</span>
                            <span className="text-green-600 font-medium">+{h.amount}₸</span>
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
