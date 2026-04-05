"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { useRequireBarista } from "@/lib/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

interface OrderItem {
  name: string;
  size: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  name: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "accepted" | "ready";
  comment?: string;
  createdAt: Timestamp | null;
}

function timeAgo(ts: Timestamp | null): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60) return `${diff} \u0441\u0435\u043A \u043D\u0430\u0437\u0430\u0434`;
  if (diff < 3600) return `${Math.floor(diff / 60)} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434`;
  return `${Math.floor(diff / 3600)} \u0447 \u043D\u0430\u0437\u0430\u0434`;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "\u041D\u043E\u0432\u044B\u0439", color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "\u0413\u043E\u0442\u043E\u0432\u0438\u0442\u0441\u044F", color: "bg-blue-100 text-blue-800" },
  ready: { label: "\u0413\u043E\u0442\u043E\u0432", color: "bg-green-100 text-green-800" },
};

/* ═══════════════════════════════════════════
   КАРТОЧКА ЗАКАЗА
   ═══════════════════════════════════════════ */
function OrderCard({ order }: { order: Order }) {
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (newStatus: "accepted" | "ready") => {
    setUpdating(true);
    try {
      await updateDoc(doc(getFirebaseDb(), "orders", order.id), { status: newStatus });
    } catch (err) {
      console.error("Update error:", err);
    }
    setUpdating(false);
  };

  const sl = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="bg-white rounded-2xl border border-coffee-100 shadow-sm p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-coffee-900 text-lg">{order.name}</h3>
          <p className="text-xs text-coffee-400">{timeAgo(order.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${sl.color}`}>
          {sl.label}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-coffee-700">
              {it.name}
              {it.size !== "\u2014" && ` (${it.size})`}
              {it.qty > 1 && ` \u00D7${it.qty}`}
            </span>
            <span className="font-medium text-coffee-800">{it.price * it.qty} {"\u20B8"}</span>
          </div>
        ))}
      </div>

      {order.comment && (
        <div className="bg-cream-50 rounded-xl px-3 py-2 text-xs text-coffee-600 mb-3">
          {"\uD83D\uDCAC"} {order.comment}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-coffee-50 pt-3">
        <span className="font-bold text-red-600">{order.total} {"\u20B8"}</span>
        <div className="flex gap-2">
          {order.status === "pending" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={updating}
              onClick={() => changeStatus("accepted")}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {"\u2705 \u041F\u0440\u0438\u043D\u044F\u0442\u044C"}
            </motion.button>
          )}
          {order.status === "accepted" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={updating}
              onClick={() => changeStatus("ready")}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {"\u2615 \u0413\u043E\u0442\u043E\u0432\u043E"}
            </motion.button>
          )}
          {order.status === "ready" && (
            <span className="px-4 py-2 text-green-600 text-sm font-bold">
              {"\u2713 \u0412\u044B\u0434\u0430\u043D"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   СТРАНИЦА АДМИНКИ КОФЕЙНИ
   ═══════════════════════════════════════════ */
export default function AdminPage() {
  const { user, loading: authLoading } = useRequireBarista();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "ready">("all");
  const [now, setNow] = useState(Date.now());

  /* обновляем "время назад" каждые 30 сек */
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  /* слушаем Firestore в реальном времени */
  useEffect(() => {
    const q = query(collection(getFirebaseDb(), "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, "id">),
      }));
      setOrders(list);
    });
    return () => unsub();
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    ready: orders.filter((o) => o.status === "ready").length,
  };

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream-50 to-cream-100">
        <p className="text-coffee-600 text-lg">{"\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..."}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      {/* навбар */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{"\u2615"}</span>
            <span className="font-display text-xl font-bold text-coffee-900">
              Love is Coffee
            </span>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
              {"\u0410\u0434\u043C\u0438\u043D"}
            </span>
          </div>
          <a href="/office" className="text-sm text-coffee-500 hover:text-coffee-700">
            {"\u2190 \u0412 \u043E\u0444\u0438\u0441"}
          </a>
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="font-display text-2xl font-bold text-coffee-900 mb-1">
              {"\u0417\u0430\u043A\u0430\u0437\u044B"}
            </h1>
            <p className="text-coffee-500 text-sm">
              {"\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u0437\u0430\u043A\u0430\u0437\u044B \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438"}
            </p>
          </motion.div>

          {/* Фильтры */}
          <div className="flex justify-center gap-2 mb-6" key={now}>
            {(
              [
                { key: "all", label: "\u0412\u0441\u0435" },
                { key: "pending", label: "\u041D\u043E\u0432\u044B\u0435" },
                { key: "accepted", label: "\u0413\u043E\u0442\u043E\u0432\u044F\u0442\u0441\u044F" },
                { key: "ready", label: "\u0413\u043E\u0442\u043E\u0432\u044B" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.key
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-white text-coffee-700 border border-coffee-200 hover:border-red-300"
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-xs opacity-70">
                  ({counts[f.key]})
                </span>
              </button>
            ))}
          </div>

          {/* Список заказов */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-5xl mb-3">{"\uD83D\uDE34"}</p>
              <p className="text-coffee-400">{"\u0417\u0430\u043A\u0430\u0437\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442"}</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filtered.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
