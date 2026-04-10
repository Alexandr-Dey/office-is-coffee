"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { useRequireBarista } from "@/lib/auth";
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDoc,
  Timestamp, increment, arrayUnion, limit, runTransaction,
} from "firebase/firestore";

interface OrderItem { name: string; size: string; price: number; qty: number; milk?: string; addons?: string[] }
interface Order {
  id: string; name: string; items: OrderItem[]; total: number;
  status: "new" | "pending" | "accepted" | "ready" | "paid"; comment?: string;
  createdAt: Timestamp | null; estimatedMinutes?: number; acceptedAt?: number;
  rating?: number; baristaid?: string; paymentMethod?: "deposit" | "cash";
  isFreeByLoyalty?: boolean;
}

function timeAgo(ts: Timestamp | null): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  return `${Math.floor(diff / 3600)} ч назад`;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "bg-purple-100 text-purple-800" },
  pending: { label: "Ожидает", color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Готовится", color: "bg-blue-100 text-blue-800" },
  ready: { label: "Готов", color: "bg-green-100 text-green-800" },
  paid: { label: "Оплачен", color: "bg-emerald-100 text-emerald-800" },
};

/* ═══ QUEUE VISUALIZATION ═══ */
function QueueScene({ activeCount, readyCount }: { activeCount: number; readyCount: number }) {
  const waiting = Math.min(activeCount, 8);
  const ready = Math.min(readyCount, 4);
  const colors = ["#2980b9", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#3498db", "#e91e63"];

  return (
    <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-brand-text">Очередь</span>
        <div className="flex gap-3 text-xs">
          <span className="text-brand-text/50">⏳ {activeCount} ждут</span>
          <span className="text-green-600 font-bold">✅ {readyCount} готовы</span>
        </div>
      </div>
      <svg viewBox="0 0 400 60" className="w-full" style={{ shapeRendering: "crispEdges" }}>
        {/* Counter line */}
        <rect x="0" y="50" width="400" height="4" fill="#1a7a44" rx="2" />
        <rect x="0" y="54" width="400" height="6" fill="#145a32" rx="1" />

        {/* Waiting people */}
        {Array.from({ length: waiting }).map((_, i) => {
          const x = 30 + i * 42;
          const c = colors[i % colors.length];
          return (
            <g key={`w-${i}`}>
              {/* Body */}
              <rect x={x - 6} y="28" width="12" height="22" fill={c} rx="3" />
              {/* Head */}
              <circle cx={x} cy="20" r="8" fill="#e8b88a" />
              <circle cx={x} cy="18" r="7" fill={c === "#f39c12" ? "#2c1810" : "#1a1a1a"} />
              <circle cx={x - 2} cy="20" r="1.5" fill="#222" />
              <circle cx={x + 2} cy="20" r="1.5" fill="#222" />
            </g>
          );
        })}

        {/* Ready cups on counter */}
        {Array.from({ length: ready }).map((_, i) => {
          const x = 350 - i * 24;
          return (
            <g key={`r-${i}`}>
              <rect x={x - 5} y="38" width="10" height="14" fill="#d42b4f" rx="2" />
              <rect x={x - 4} y="40" width="8" height="2" fill="#fff" opacity="0.5" />
              <rect x={x - 5} y="38" width="10" height="3" fill="#8b1a2e" rx="1" />
            </g>
          );
        })}

        {/* Empty state */}
        {waiting === 0 && ready === 0 && (
          <text x="200" y="38" textAnchor="middle" fill="#9ca3af" fontSize="12">Пока никого ☕</text>
        )}
      </svg>
    </div>
  );
}

/* ═══ ORDER CARD ═══ */
function OrderCard({ order, baristaId }: { order: Order; baristaId: string }) {
  const [updating, setUpdating] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const changeStatus = async (newStatus: "pending" | "accepted" | "ready" | "paid", minutes?: number) => {
    setUpdating(true);
    try {
      const orderRef = doc(getFirebaseDb(), "orders", order.id);
      await runTransaction(getFirebaseDb(), async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Order not found");
        const current = orderSnap.data().status;
        const allowed: Record<string, string[]> = {
          accepted: ["new", "pending"], ready: ["accepted"], paid: ["ready"],
        };
        if (allowed[newStatus] && !allowed[newStatus].includes(current)) {
          throw new Error(`Cannot transition ${current} → ${newStatus}`);
        }
        const updates: Record<string, unknown> = { status: newStatus };
        if (newStatus === "accepted" && minutes) {
          updates.estimatedMinutes = minutes;
          updates.acceptedAt = Date.now();
          updates.baristaid = baristaId;
        }
        if (newStatus === "paid") updates.paidAt = new Date().toISOString();
        tx.update(orderRef, updates);
      });

      if (newStatus === "ready" && !order.isFreeByLoyalty) {
        const bonusBarista = order.baristaid || baristaId;
        const bonusRef = doc(getFirebaseDb(), "barista_bonuses", bonusBarista);
        await runTransaction(getFirebaseDb(), async (tx) => {
          const bonusSnap = await tx.get(bonusRef);
          if (bonusSnap.exists()) {
            const hist = bonusSnap.data().history || [];
            if (hist.some((h: { orderId: string }) => h.orderId === order.id)) return;
            tx.update(bonusRef, {
              totalBonus: increment(5), pendingPayout: increment(5),
              history: arrayUnion({ orderId: order.id, amount: 5, date: new Date().toISOString() }),
            });
          } else {
            tx.set(bonusRef, {
              totalBonus: 5, pendingPayout: 5,
              history: [{ orderId: order.id, amount: 5, date: new Date().toISOString() }],
            });
          }
        });
        await updateDoc(doc(getFirebaseDb(), "orders", order.id), { baristaBonus: 5 });
      }
    } catch { /* ignore */ }
    setUpdating(false);
    setShowTimePicker(false);
  };

  const sl = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
  const ratingEmoji = order.rating === 3 ? "😍" : order.rating === 2 ? "👍" : order.rating === 1 ? "😕" : null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 100 }}
      className="bg-white rounded-2xl border border-[#d0f0e0] shadow-sm p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-brand-text text-lg">{order.name}</h3>
          <p className="text-xs text-brand-text/40">{timeAgo(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {ratingEmoji && <span className="text-lg">{ratingEmoji}</span>}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${sl.color}`}>{sl.label}</span>
        </div>
      </div>
      <div className="space-y-1 mb-3">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-brand-text/70">
              {it.name}{it.size !== "—" && ` (${it.size})`}
              {it.milk && ` · ${it.milk}`}
              {it.addons && it.addons.length > 0 && ` · ${it.addons.join(", ")}`}
              {it.qty > 1 && ` ×${it.qty}`}
            </span>
            <span className="font-medium text-brand-text">{it.price * it.qty}₸</span>
          </div>
        ))}
      </div>
      {order.comment && (
        <div className="bg-brand-bg rounded-xl px-3 py-2 text-xs text-brand-text/60 mb-3">💬 {order.comment}</div>
      )}
      {order.paymentMethod === "cash" && order.status !== "paid" && (
        <div className="mb-2"><span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">💵 НАЛИЧНЫЕ</span></div>
      )}
      <div className="flex items-center justify-between border-t border-[#d0f0e0] pt-3">
        <span className="font-bold text-brand-dark">{order.total}₸</span>
        <div className="flex gap-2">
          {(order.status === "new" || order.status === "pending") && !showTimePicker && (
            <motion.button whileTap={{ scale: 0.95 }} disabled={updating} onClick={() => setShowTimePicker(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-50">
              ✅ Принять
            </motion.button>
          )}
          {showTimePicker && (
            <div className="flex gap-1.5">
              {[5, 10, 15, 20].map((m) => (
                <motion.button key={m} whileTap={{ scale: 0.9 }} onClick={() => changeStatus("accepted", m)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold min-h-[44px]">
                  {m} мин
                </motion.button>
              ))}
            </div>
          )}
          {order.status === "accepted" && (
            <motion.button whileTap={{ scale: 0.95 }} disabled={updating} onClick={() => changeStatus("ready")}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-50">
              ☕ Готово
            </motion.button>
          )}
          {order.status === "ready" && (
            <motion.button whileTap={{ scale: 0.95 }} disabled={updating} onClick={() => changeStatus("paid")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-50">
              {order.paymentMethod === "cash" ? "💵 Получил оплату" : "✓ Выдано"}
            </motion.button>
          )}
          {order.status === "paid" && (
            <span className="px-4 py-2 text-emerald-600 text-sm font-bold">✓ Завершён</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══ PAGE ═══ */
export default function AdminPage() {
  const { user, loading: authLoading } = useRequireBarista();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"active" | "paid">("active");
  const [cafeOpen, setCafeOpen] = useState(true);

  useEffect(() => {
    const q = query(collection(getFirebaseDb(), "orders"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) setCafeOpen(snap.data().isOpen ?? true);
    }, () => {});
    return () => unsub();
  }, []);

  const toggleCafe = async () => {
    const newOpen = !cafeOpen;
    setCafeOpen(newOpen);
    await setDoc(doc(getFirebaseDb(), "cafe_status", "aksay_main"), {
      isOpen: newOpen, [newOpen ? "openedAt" : "closedAt"]: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
  };

  const activeOrders = orders.filter((o) => ["new", "pending", "accepted", "ready"].includes(o.status));
  const readyOrders = orders.filter((o) => o.status === "ready");
  const waitingOrders = orders.filter((o) => ["new", "pending", "accepted"].includes(o.status));
  const paidOrders = orders.filter((o) => o.status === "paid");
  const displayed = filter === "active" ? activeOrders : paidOrders;

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="animate-pulse space-y-4 w-full max-w-md px-4">
          <div className="h-8 bg-[#d0f0e0] rounded-lg w-1/2" />
          <div className="h-32 bg-[#d0f0e0] rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <div className="sticky top-0 z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-brand-text">📋 Заказы</h1>
          <motion.button whileTap={{ scale: 0.95 }} onClick={toggleCafe}
            className={`px-4 py-2 rounded-full text-sm font-bold min-h-[44px] ${cafeOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {cafeOpen ? "🟢 Открыто" : "🔴 Закрыто"}
          </motion.button>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-[480px] mx-auto">
        {/* Queue visualization */}
        <QueueScene activeCount={waitingOrders.length} readyCount={readyOrders.length} />

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setFilter("active")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-all ${
              filter === "active" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
            }`}>
            Активные ({activeOrders.length})
          </button>
          <button onClick={() => setFilter("paid")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-all ${
              filter === "paid" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
            }`}>
            Завершённые ({paidOrders.length})
          </button>
        </div>

        {displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-5xl mb-3">😴</p>
            <p className="text-brand-text/40">{filter === "active" ? "Нет активных заказов" : "Нет завершённых заказов"}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {displayed.map((order) => (
                <OrderCard key={order.id} order={order} baristaId={user.uid} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
