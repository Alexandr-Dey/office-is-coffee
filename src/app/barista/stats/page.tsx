"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRequireBarista } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, doc, onSnapshot } from "firebase/firestore";

function getAlmatyToday(): string {
  const d = new Date();
  const utc5 = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return utc5.toISOString().slice(0, 10);
}

function getAlmatyHour(): number {
  const d = new Date();
  return (d.getUTCHours() + 5) % 24;
}

export default function BaristaStatsPage() {
  const { user, loading } = useRequireBarista();
  const [cafeOpen, setCafeOpen] = useState(false);
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayTips, setTodayTips] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Cafe status
  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) setCafeOpen(snap.data().isOpen ?? false);
    }, () => {});
    return () => unsub();
  }, []);

  // Load today's stats
  useEffect(() => {
    async function load() {
      const db = getFirebaseDb();
      const ordersSnap = await getDocs(collection(db, "orders"));
      const today = getAlmatyToday();

      let orders = 0;
      let revenue = 0;
      let active = 0;
      let ratingSum = 0;
      let ratingCount = 0;

      for (const d of ordersSnap.docs) {
        const o = d.data();

        // Count active orders
        if (["new", "pending", "accepted"].includes(o.status)) {
          active++;
        }

        // Today's stats
        if (o.createdAt) {
          let orderDate = "";
          if (o.createdAt.toMillis) {
            const dt = new Date(o.createdAt.toMillis() + 5 * 60 * 60 * 1000);
            orderDate = dt.toISOString().slice(0, 10);
          }
          if (orderDate === today) {
            orders++;
            revenue += o.total ?? 0;
            if (o.rating) {
              ratingSum += o.rating;
              ratingCount++;
            }
          }
        }
      }

      // Today's bonuses
      if (user) {
        const bonusSnap = await getDocs(query(collection(db, "barista_bonuses")));
        for (const d of bonusSnap.docs) {
          if (d.id === user.uid && d.data().history) {
            const todayBonuses = (d.data().history as Array<{ amount: number; date: string }>)
              .filter(h => h.date && h.date.startsWith(today));
            setTodayTips(todayBonuses.reduce((s, h) => s + h.amount, 0));
          }
        }
      }

      setTodayOrders(orders);
      setTodayRevenue(revenue);
      setActiveOrders(active);
      setAvgRating(ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null);
      setDataLoading(false);
    }
    load().catch(() => setDataLoading(false));
  }, [user]);

  const hour = getAlmatyHour();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const shiftEmoji = hour < 12 ? "🌅" : hour < 18 ? "☀️" : "🌙";

  if (loading || dataLoading) {
    return (
      <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="h-8 bg-[#d0f0e0] rounded-lg w-2/3 animate-pulse" />
          <div className="h-32 bg-[#d0f0e0] rounded-2xl animate-pulse" />
          <div className="h-48 bg-[#d0f0e0] rounded-2xl animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">

        {/* Greeting */}
        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold text-brand-dark">
            {shiftEmoji} {greeting}, {user?.displayName?.split(" ")[0] ?? "бариста"}!
          </h1>
          <p className="text-sm text-brand-text/50 mt-1">
            {cafeOpen ? "🟢 Кофейня открыта" : "🔴 Кофейня закрыта"}
            {activeOrders > 0 && ` · ${activeOrders} активных заказов`}
          </p>
        </div>

        {/* Today's stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-4 text-white">
            <p className="text-xs text-white/70">Заказов сегодня</p>
            <p className="text-3xl font-bold">{todayOrders}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <p className="text-xs text-brand-text/50">Выручка сегодня</p>
            <p className="text-2xl font-bold text-brand-dark">{todayRevenue.toLocaleString("ru-RU")}₸</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <p className="text-xs text-brand-text/50">Бонусы сегодня</p>
            <p className="text-2xl font-bold text-green-600">+{todayTips}₸</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <p className="text-xs text-brand-text/50">Средняя оценка</p>
            <p className="text-2xl font-bold text-brand-dark">{avgRating !== null ? `${avgRating} ⭐` : "—"}</p>
          </motion.div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <a href="/admin" className="block">
            <motion.div whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl border border-[#d0f0e0] p-4 flex items-center justify-between" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-bold text-brand-text text-sm">Управление заказами</p>
                  <p className="text-xs text-brand-text/50">Принимай, готовь, выдавай</p>
                </div>
              </div>
              {activeOrders > 0 && (
                <span className="bg-brand-dark text-white text-xs font-bold px-2.5 py-1 rounded-full">{activeOrders}</span>
              )}
            </motion.div>
          </a>

          <a href="/barista/bonuses" className="block">
            <motion.div whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl border border-[#d0f0e0] p-4 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-bold text-brand-text text-sm">Мои бонусы</p>
                <p className="text-xs text-brand-text/50">Заработок и история</p>
              </div>
            </motion.div>
          </a>
        </div>

        {/* Motivational */}
        <div className="mt-6 text-center">
          {todayOrders >= 20 ? (
            <p className="text-sm text-brand-text/50">🏆 Огонь! {todayOrders} заказов — рекорд дня?</p>
          ) : todayOrders >= 10 ? (
            <p className="text-sm text-brand-text/50">🔥 Отличная смена! Продолжай в том же духе</p>
          ) : todayOrders > 0 ? (
            <p className="text-sm text-brand-text/50">☕ Хороший старт! Каждый заказ — +5₸ к бонусу</p>
          ) : (
            <p className="text-sm text-brand-text/50">✨ Новый день — новые возможности!</p>
          )}
        </div>
      </motion.div>
    </main>
  );
}
