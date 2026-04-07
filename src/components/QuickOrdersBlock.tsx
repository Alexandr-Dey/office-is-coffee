"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import QuickOrderBottomSheet from "./QuickOrderBottomSheet";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  milk: string;
  addons: string[];
  price: number;
  qty: number;
}

interface QuickOrderItem {
  id: string;
  type: "last" | "frequent";
  title: string;
  subtitle: string;
  total: number;
  items: OrderItem[];
  count?: number;
}

function formatOrderTitle(items: OrderItem[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) {
    const item = items[0];
    return `${item.name} ${item.size}${item.milk && item.milk !== "standard" && item.milk !== "Стандарт" ? ", " + item.milk : ""}`;
  }
  return `${items[0].name} +${items.length - 1}`;
}

export default function QuickOrdersBlock() {
  const { user } = useAuth();
  const [quickOrders, setQuickOrders] = useState<QuickOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<QuickOrderItem | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function loadQuickOrders() {
      try {
        const db = getFirebaseDb();

        const q = query(
          collection(db, "orders"),
          where("userId", "==", user!.uid),
          where("status", "==", "paid"),
          orderBy("createdAt", "desc"),
          limit(30)
        );

        const snap = await getDocs(q);
        const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
          id: string;
          items: OrderItem[];
          total: number;
        }>;

        if (orders.length === 0) {
          setQuickOrders([]);
          setLoading(false);
          return;
        }

        const lastOrder: QuickOrderItem = {
          id: "last-" + orders[0].id,
          type: "last",
          title: formatOrderTitle(orders[0].items),
          subtitle: "Ваш последний заказ",
          total: orders[0].total,
          items: orders[0].items,
        };

        const frequencyMap = new Map<string, { order: typeof orders[0]; count: number }>();
        for (const order of orders) {
          const key = JSON.stringify(
            order.items.map((i) => ({
              id: i.id,
              size: i.size,
              milk: i.milk,
            }))
          );
          const existing = frequencyMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            frequencyMap.set(key, { order, count: 1 });
          }
        }

        const frequent = Array.from(frequencyMap.values())
          .filter((f) => f.count >= 2)
          .sort((a, b) => b.count - a.count)
          .slice(0, 2)
          .map(
            (f, idx): QuickOrderItem => ({
              id: `frequent-${idx}-${f.order.id}`,
              type: "frequent",
              title: formatOrderTitle(f.order.items),
              subtitle: `Вы брали ${f.count} раз`,
              total: f.order.total,
              items: f.order.items,
              count: f.count,
            })
          );

        setQuickOrders([lastOrder, ...frequent]);
      } catch {
        setQuickOrders([]);
      }
      setLoading(false);
    }

    loadQuickOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[200px] h-24 bg-[#e5e7eb] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (quickOrders.length === 0) return null;

  return (
    <>
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a7a44] mb-2 px-1">
          Быстрый заказ
        </h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {quickOrders.map((order) => (
            <motion.button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              whileTap={{ scale: 0.97 }}
              className="min-w-[200px] flex-shrink-0 bg-white border border-[#d0f0e0] rounded-xl p-3 text-left shadow-[0_2px_8px_rgba(30,120,70,0.06)]"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs text-[#2d9e5a] font-medium">
                  {order.type === "last" ? "🕐 Последний" : "⭐ Часто"}
                </span>
                {order.count && (
                  <span className="text-[10px] text-gray-500">×{order.count}</span>
                )}
              </div>
              <div className="font-semibold text-sm text-[#0f3a20] truncate">
                {order.title}
              </div>
              <div className="text-xs text-gray-500 mt-1">{order.subtitle}</div>
              <div className="text-[#1a7a44] font-bold text-base mt-2">
                {order.total.toLocaleString("ru-RU")}₸
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {selectedOrder && (
        <QuickOrderBottomSheet
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
