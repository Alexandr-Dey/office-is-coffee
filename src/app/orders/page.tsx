"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, orderBy, where, limit, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth";

interface OrderItem { name: string; size: string; price: number; qty: number; milk?: string }
interface Order {
  id: string; name: string; items: OrderItem[]; total: number;
  status: string; rating?: number; createdAt: Timestamp | null;
  isFreeByLoyalty?: boolean;
}

function formatDate(ts: Timestamp | null): string {
  if (!ts) return "";
  const d = new Date(ts.toMillis());
  return d.toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const statusLabel: Record<string, { text: string; color: string }> = {
  pending: { text: "Ожидает", color: "text-yellow-600" },
  accepted: { text: "Готовится", color: "text-blue-600" },
  ready: { text: "Готов", color: "text-green-600" },
};

const ratingEmoji: Record<number, string> = { 3: "\uD83D\uDE0D", 2: "\uD83D\uDC4D", 1: "\uD83D\uDE15" };

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(getFirebaseDb(), "orders"),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    getDocs(q).then((snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }))
        .filter((o) => o.name === user.displayName || (o as any).userId === user.uid);
      setOrders(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const repeatOrder = (items: OrderItem[]) => {
    sessionStorage.setItem("oic_cart", JSON.stringify(items));
    sessionStorage.setItem("oic_is_repeat", "true");
    window.location.href = "/order";
  };

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">\uD83D\uDCE6 Мои заказы</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#d0f0e0] p-5 animate-pulse">
                <div className="h-4 bg-[#d0f0e0] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[#d0f0e0]/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-8 text-center" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <p className="text-4xl mb-3">\u2615</p>
            <p className="text-brand-text/60">Заказов пока нет</p>
            <a href="/menu" className="inline-block mt-4 px-6 py-2 bg-brand-dark text-white rounded-full text-sm font-semibold">Заказать кофе</a>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const sl = statusLabel[order.status] || statusLabel.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-[#d0f0e0] p-4"
                  style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-brand-text text-sm">
                        {order.items.map((i) => i.name).join(", ")}
                      </p>
                      <p className="text-xs text-brand-text/40">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.rating && <span className="text-lg">{ratingEmoji[order.rating]}</span>}
                      <span className={`text-xs font-bold ${sl.color}`}>{sl.text}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-dark text-sm">
                      {order.isFreeByLoyalty ? "Бесплатно \uD83C\uDF89" : `${order.total} \u20B8`}
                    </span>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => repeatOrder(order.items)}
                      className="px-3 py-1.5 bg-brand-mint/20 text-brand-dark rounded-full text-xs font-bold">
                      Повторить
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </main>
  );
}
