"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

interface PushLogEntry {
  id: string;
  sentAt: string;
  title: string;
  body: string;
  segment: string;
  recipientCount: number;
  deliveredCount: number;
  openedCount: number;
  ordersAfterCount: number;
  deadTokensFound: number;
}

export default function PushAnalytics() {
  const [logs, setLogs] = useState<PushLogEntry[]>([]);

  useEffect(() => {
    const q = query(collection(getFirebaseDb(), "push_log"), orderBy("sentAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as PushLogEntry)));
    }, () => {});
    return () => unsub();
  }, []);

  // 7-day aggregates
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recent = logs.filter(l => l.sentAt > weekAgo);
  const totalSent = recent.reduce((s, l) => s + l.recipientCount, 0);
  const totalDelivered = recent.reduce((s, l) => s + l.deliveredCount, 0);
  const totalOpened = recent.reduce((s, l) => s + l.openedCount, 0);
  const totalDead = recent.reduce((s, l) => s + l.deadTokensFound, 0);
  const totalOrders = recent.reduce((s, l) => s + l.ordersAfterCount, 0);

  const deliveryPct = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const openPct = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;
  const orderPct = totalOpened > 0 ? Math.round((totalOrders / totalOpened) * 100) : 0;

  const segmentLabels: Record<string, string> = {
    sleeping: "😴 Спящие", streakRisk: "🔥 Стрик", almostFree: "🎁 Бесплатный",
    vip: "👑 VIP", manual: "✏️ Ручной", all: "📢 Все",
  };

  return (
    <div className="mt-6">
      <h3 className="font-bold text-brand-text text-sm mb-3">📊 Аналитика пушей (7 дней)</h3>

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-[#d0f0e0] p-2.5 text-center">
          <p className="text-lg font-bold text-brand-dark">{totalSent}</p>
          <p className="text-[9px] text-brand-text/40">Отправлено</p>
        </div>
        <div className="bg-white rounded-xl border border-[#d0f0e0] p-2.5 text-center">
          <p className="text-lg font-bold text-green-600">{totalDelivered}</p>
          <p className="text-[9px] text-brand-text/40">Доставлено</p>
        </div>
        <div className="bg-white rounded-xl border border-[#d0f0e0] p-2.5 text-center">
          <p className="text-lg font-bold text-blue-600">{totalOpened}</p>
          <p className="text-[9px] text-brand-text/40">Открыто</p>
        </div>
        <div className="bg-white rounded-xl border border-[#d0f0e0] p-2.5 text-center">
          <p className="text-lg font-bold text-brand-dark">{totalOrders}</p>
          <p className="text-[9px] text-brand-text/40">Заказов</p>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2 mb-4">
        {[
          { label: "Доставка", pct: deliveryPct, color: "bg-green-500" },
          { label: "Открытия", pct: openPct, color: "bg-blue-500" },
          { label: "Заказы", pct: orderPct, color: "bg-brand-dark" },
        ].map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-brand-text/50">{bar.label}</span>
              <span className="font-bold text-brand-text">{bar.pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }}
                transition={{ duration: 0.8 }} className={`h-full rounded-full ${bar.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Dead tokens warning */}
      {totalDead > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <p className="text-xs text-yellow-700">⚠️ {totalDead} мёртвых токенов за 7 дней</p>
        </div>
      )}

      {/* History */}
      {logs.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-brand-text/50 mb-2">История рассылок</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map(l => (
              <div key={l.id} className="bg-white rounded-xl border border-[#d0f0e0] p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">{l.title}</p>
                    <p className="text-[10px] text-brand-text/40 truncate">{l.body}</p>
                  </div>
                  <span className="text-[9px] text-brand-text/30 flex-shrink-0 ml-2">
                    {new Date(l.sentAt).toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-brand-bg rounded text-[9px] text-brand-text/50">{segmentLabels[l.segment] ?? l.segment}</span>
                  <span className="px-1.5 py-0.5 bg-brand-bg rounded text-[9px]">📨 {l.recipientCount}</span>
                  <span className="px-1.5 py-0.5 bg-green-50 rounded text-[9px] text-green-600">✓ {l.deliveredCount}</span>
                  {l.openedCount > 0 && <span className="px-1.5 py-0.5 bg-blue-50 rounded text-[9px] text-blue-600">👁 {l.openedCount}</span>}
                  {l.ordersAfterCount > 0 && <span className="px-1.5 py-0.5 bg-brand-mint/20 rounded text-[9px] text-brand-dark">☕ {l.ordersAfterCount}</span>}
                  {l.deadTokensFound > 0 && <span className="px-1.5 py-0.5 bg-red-50 rounded text-[9px] text-red-500">💀 {l.deadTokensFound}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
