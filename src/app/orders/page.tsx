"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, orderBy, where as fbWhere, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

interface OrderItem { name: string; size: string; price: number; qty: number; milk?: string; addons?: string[] }
interface Order {
  id: string; name: string; items: OrderItem[]; total: number;
  status: string; rating?: number; createdAt: Timestamp | null;
  isFreeByLoyalty?: boolean; cancelReason?: string;
}

function formatDate(ts: Timestamp | null): string {
  if (!ts) return "";
  const d = new Date(ts.toMillis());
  return d.toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG: Record<string, { text: string; color: string; icon: string; bg: string }> = {
  new: { text: "Отправлен", color: "text-purple-700", icon: "📨", bg: "bg-purple-50 border-purple-200" },
  pending: { text: "Принят", color: "text-yellow-700", icon: "⏳", bg: "bg-yellow-50 border-yellow-200" },
  accepted: { text: "Готовится", color: "text-blue-700", icon: "☕", bg: "bg-blue-50 border-blue-200" },
  ready: { text: "Забери!", color: "text-green-700", icon: "🎉", bg: "bg-green-50 border-green-200" },
  paid: { text: "Завершён", color: "text-emerald-600", icon: "✅", bg: "bg-white border-[#d0f0e0]" },
  cancelled: { text: "Отменён", color: "text-red-600", icon: "✕", bg: "bg-red-50 border-red-200" },
};

const ratingEmoji: Record<number, string> = { 3: "😍", 2: "👍", 1: "😕" };

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { cart, removeItem, updateQty, clearCart, setItems, totalItems, totalPrice } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "history">("active");

  useEffect(() => {
    if (authLoading || !user) { setLoading(false); return; }
    const q = query(
      collection(getFirebaseDb(), "orders"),
      fbWhere("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(30),
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
      setLoading(false);
    }, (err) => {
      console.error("Orders query error:", err.message);
      // Fallback: if index missing, try without orderBy
      if (err.message.includes("index")) {
        import("firebase/firestore").then(({ getDocs }) => {
          const fallbackQ = query(
            collection(getFirebaseDb(), "orders"),
            fbWhere("userId", "==", user!.uid),
            limit(30),
          );
          getDocs(fallbackQ).then((snap) => {
            const list = snap.docs
              .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }))
              .sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() ?? 0;
                const tb = b.createdAt?.toMillis?.() ?? 0;
                return tb - ta;
              });
            setOrders(list);
            setLoading(false);
          }).catch(() => setLoading(false));
        });
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [user, authLoading]);

  const repeatOrder = (items: OrderItem[]) => {
    setItems(items.map(i => ({ name: i.name, size: i.size, price: i.price, qty: i.qty, milk: i.milk })));
    sessionStorage.setItem("oic_is_repeat", "true");
    router.push("/order");
  };

  const activeOrders = orders.filter(o => ["new", "pending", "accepted", "ready"].includes(o.status));
  const historyOrders = orders.filter(o => ["paid", "cancelled"].includes(o.status));

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">📦 Заказы</h1>

        {/* Current cart */}
        {totalItems > 0 && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm text-brand-dark">🛒 В корзине ({totalItems})</p>
              <button onClick={clearCart} className="text-xs text-red-400 font-medium min-h-[44px] flex items-center">Очистить</button>
            </div>
            <div className="space-y-2 mb-3">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-text truncate">
                      {item.name} {item.size !== "—" ? `(${item.size})` : ""}
                      {item.qty > 1 && ` ×${item.qty}`}
                    </p>
                    {(item.milk || item.syrup) && (
                      <p className="text-[10px] text-brand-text/40">
                        {item.milk && item.milk !== "Стандарт" && item.milk}
                        {item.syrup && ` · ${item.syrup}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(i, -1)}
                      className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-brand-text/60 font-bold text-xs">−</button>
                    <span className="w-5 text-center text-xs font-bold text-brand-dark">{item.qty}</span>
                    <button onClick={() => updateQty(i, 1)}
                      className="w-7 h-7 rounded-md bg-brand-mint/20 flex items-center justify-center text-brand-dark font-bold text-xs">+</button>
                  </div>
                  <span className="text-sm font-bold text-brand-dark flex-shrink-0">{item.price * item.qty}₸</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#d0f0e0] pt-3">
              <span className="font-bold text-brand-dark">{totalPrice}₸</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push("/order")}
                className="px-5 py-2.5 bg-brand-dark text-white font-bold rounded-xl text-sm min-h-[44px]">
                Оформить →
              </motion.button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("active")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-all ${
              tab === "active" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
            }`}>
            Активные {activeOrders.length > 0 && `(${activeOrders.length})`}
          </button>
          <button onClick={() => setTab("history")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-all ${
              tab === "history" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
            }`}>
            История {historyOrders.length > 0 && `(${historyOrders.length})`}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#d0f0e0] p-5 animate-pulse">
                <div className="h-4 bg-[#d0f0e0] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[#d0f0e0]/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {tab === "active" ? (
                activeOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-3">☕</p>
                    <p className="text-brand-text/50">Нет активных заказов</p>
                    <a href="/menu" className="inline-block mt-4 px-6 py-2.5 bg-brand-dark text-white rounded-full text-sm font-bold min-h-[44px]">Заказать кофе</a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.map((order, idx) => {
                      const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.new;
                      return (
                        <motion.div key={order.id}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                          onClick={() => router.push(`/order/${order.id}`)}
                          className={`rounded-2xl border p-4 cursor-pointer ${cfg.bg}`}
                          style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-bold ${cfg.color}`}>{cfg.icon} {cfg.text}</span>
                            <span className="text-xs text-brand-text/40">{formatDate(order.createdAt)}</span>
                          </div>
                          <p className="font-semibold text-sm text-brand-text mb-1">{order.items.map(i => i.name).join(", ")}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-brand-dark">{order.total}₸</span>
                            <span className="text-xs text-brand-dark font-medium">Подробнее →</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )
              ) : (
                historyOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="text-brand-text/50">История пуста</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyOrders.map((order, idx) => {
                      const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.paid;
                      const isCancelled = order.status === "cancelled";
                      return (
                        <motion.div key={order.id}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                          className={`rounded-2xl border p-4 ${cfg.bg}`}
                          style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm text-brand-text">{order.items.map(i => i.name).join(", ")}</p>
                              <p className="text-xs text-brand-text/40">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {order.rating && <span className="text-lg">{ratingEmoji[order.rating]}</span>}
                              <span className={`text-xs font-bold ${cfg.color}`}>{cfg.icon} {cfg.text}</span>
                            </div>
                          </div>
                          {isCancelled && order.cancelReason && (
                            <div className="bg-red-100 rounded-lg px-3 py-1.5 mb-2">
                              <p className="text-xs text-red-600">🚫 {order.cancelReason}</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-brand-dark text-sm">
                              {isCancelled ? "Отменён" : order.isFreeByLoyalty ? "Бесплатно 🎉" : `${order.total}₸`}
                            </span>
                            {!isCancelled && (
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => repeatOrder(order.items)}
                                className="px-4 py-2 bg-brand-mint/20 text-brand-dark rounded-full text-xs font-bold min-h-[44px]">
                                Повторить
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </main>
  );
}
