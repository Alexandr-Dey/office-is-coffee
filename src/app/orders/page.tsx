"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, orderBy, where as fbWhere, limit, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import type { CartItem } from "@/lib/types";

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

const statusLabel: Record<string, { text: string; color: string; icon: string }> = {
  new: { text: "Отправлен", color: "text-purple-600", icon: "📨" },
  pending: { text: "Ожидает", color: "text-yellow-600", icon: "⏳" },
  accepted: { text: "Готовится", color: "text-blue-600", icon: "☕" },
  ready: { text: "Готов", color: "text-green-600", icon: "🎉" },
  paid: { text: "Завершён", color: "text-emerald-600", icon: "✅" },
  cancelled: { text: "Отменён", color: "text-red-500", icon: "✕" },
};

const ratingEmoji: Record<number, string> = { 3: "😍", 2: "👍", 1: "😕" };

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("oic_cart");
      if (raw) setCart(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(getFirebaseDb(), "orders"),
      fbWhere("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    getDocs(q).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }));
      setOrders(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, authLoading]);

  const repeatOrder = (items: OrderItem[]) => {
    sessionStorage.setItem("oic_cart", JSON.stringify(items));
    sessionStorage.setItem("oic_is_repeat", "true");
    router.push("/order");
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">📦 Мои заказы</h1>

        {/* Current cart */}
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-brand-dark to-brand-mid rounded-2xl p-4 mb-4 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm">🛒 Текущая корзина</p>
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{cartCount} шт</span>
            </div>
            <div className="space-y-1 mb-3">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-white/80">
                  <span>
                    {item.name}
                    {item.size !== "—" && ` (${item.size})`}
                    {item.qty > 1 && ` ×${item.qty}`}
                  </span>
                  <span className="font-medium">{item.price * item.qty}₸</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">{cartTotal}₸</span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/order")}
                className="px-5 py-2 bg-white text-brand-dark font-bold rounded-full text-sm"
              >
                Оформить →
              </motion.button>
            </div>
          </motion.div>
        )}

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
            <p className="text-4xl mb-3">☕</p>
            <p className="text-brand-text/60">Заказов пока нет</p>
            <a href="/menu" className="inline-block mt-4 px-6 py-2 bg-brand-dark text-white rounded-full text-sm font-semibold min-h-[44px] leading-[28px]">Заказать кофе</a>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const sl = statusLabel[order.status] ?? { text: order.status, color: "text-gray-500", icon: "•" };
              const isActive = ["new", "pending", "accepted", "ready"].includes(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={isActive ? () => router.push(`/order/${order.id}`) : undefined}
                  className={`bg-white rounded-2xl border border-[#d0f0e0] p-4 ${isActive ? "cursor-pointer" : ""}`}
                  style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-brand-text text-sm">
                        {order.items.map((i) => i.name).join(", ")}
                      </p>
                      <p className="text-xs text-brand-text/40">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {order.rating && <span className="text-lg">{ratingEmoji[order.rating]}</span>}
                      <span className={`text-xs font-bold ${sl.color}`}>{sl.icon} {sl.text}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-dark text-sm">
                      {order.isFreeByLoyalty ? "Бесплатно 🎉" : `${order.total}₸`}
                    </span>
                    <div className="flex gap-2">
                      {isActive && (
                        <span className="text-xs text-brand-dark font-medium">Открыть →</span>
                      )}
                      {order.status === "paid" && (
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); repeatOrder(order.items); }}
                          className="px-3 py-1.5 bg-brand-mint/20 text-brand-dark rounded-full text-xs font-bold min-h-[44px]">
                          Повторить
                        </motion.button>
                      )}
                    </div>
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
