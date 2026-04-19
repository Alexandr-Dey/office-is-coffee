"use client";

import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { useRequireBarista } from "@/lib/auth";
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDoc,
  Timestamp, increment, arrayUnion, arrayRemove, limit,
} from "firebase/firestore";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  MENU_ITEMS, MODIFIERS, CATEGORIES, normalizeStopList, formatPrice,
  type StopList, type CategoryId,
} from "@/lib/menu";
import { resolveIsOpen, CAFE_OPEN_HOUR, CAFE_OPEN_MIN, CAFE_CLOSE_HOUR, CAFE_CLOSE_MIN } from "@/lib/constants";

interface OrderItem { name: string; size: string; price: number; qty: number; milk?: string; addons?: string[] }
interface Order {
  id: string; name: string; userId?: string; items: OrderItem[]; total: number;
  status: "new" | "pending" | "accepted" | "ready" | "paid" | "cancelled"; comment?: string;
  createdAt: Timestamp | null; estimatedMinutes?: number; acceptedAt?: number;
  rating?: number; baristaid?: string; paymentMethod?: "deposit" | "cash";
  isFreeByLoyalty?: boolean; cancelReason?: string;
}

function timeAgo(ts: Timestamp | null): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  return `${Math.floor(diff / 3600)} ч назад`;
}

function getWaitMinutes(ts: Timestamp | null): number {
  if (!ts) return 0;
  return Math.floor((Date.now() - ts.toMillis()) / 60000);
}

/** Urgency color based on wait time */
function getUrgencyClass(waitMin: number): string {
  if (waitMin >= 10) return "border-l-4 border-l-red-500";
  if (waitMin >= 5) return "border-l-4 border-l-amber-400";
  return "";
}

/** Remaining time for accepted orders */
function getRemainingMin(acceptedAt?: number, estimatedMinutes?: number): number | null {
  if (!acceptedAt || !estimatedMinutes) return null;
  const elapsed = Math.floor((Date.now() - acceptedAt) / 60000);
  return estimatedMinutes - elapsed;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "bg-purple-100 text-purple-800" },
  pending: { label: "Ожидает", color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Готовится", color: "bg-blue-100 text-blue-800" },
  ready: { label: "Готов", color: "bg-green-100 text-green-800" },
  paid: { label: "Оплачен", color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Отменён", color: "bg-red-100 text-red-800" },
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
  const [hasCookie, setHasCookie] = useState(false);

  useEffect(() => {
    if (!order.userId || order.status !== "ready") return;
    getDoc(doc(getFirebaseDb(), "users", order.userId)).then(snap => {
      if (snap.exists() && snap.data().pendingCookie) setHasCookie(true);
    }).catch(() => {});
  }, [order.status, order.userId]);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState("");

  const changeStatus = async (newStatus: "accepted" | "ready" | "paid", minutes?: number) => {
    if (updating) return; // Prevent double-click
    setUpdating(true);
    setError("");
    try {
      const orderRef = doc(getFirebaseDb(), "orders", order.id);
      // Simple update instead of transaction for reliability
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "accepted" && minutes) {
        updates.estimatedMinutes = minutes;
        updates.acceptedAt = Date.now();
        updates.baristaid = baristaId;
      }
      if (newStatus === "paid") updates.paidAt = new Date().toISOString();
      await updateDoc(orderRef, updates);

      // Bonus is handled by Cloud Function onOrderReady — no client-side bonus logic needed
    } catch (e) {
      console.error("changeStatus error:", e);
      setError(e instanceof Error ? e.message : "Ошибка обновления заказа");
    }
    setUpdating(false);
    setShowTimePicker(false);
  };

  const cancelOrder = async () => {
    if (updating) return;
    setUpdating(true);
    setError("");
    try {
      await updateDoc(doc(getFirebaseDb(), "orders", order.id), {
        status: "cancelled",
        cancelReason: cancelReason.trim() || "Нет в наличии",
        cancelledAt: new Date().toISOString(),
        cancelledBy: baristaId,
      });
    } catch (e) {
      console.error("cancelOrder error:", e);
      setError(e instanceof Error ? e.message : "Ошибка отмены заказа");
    }
    setUpdating(false);
    setShowCancel(false);
  };

  const sl = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
  const ratingEmoji = order.rating === 3 ? "😍" : order.rating === 2 ? "👍" : order.rating === 1 ? "😕" : null;
  const waitMin = getWaitMinutes(order.createdAt);
  const urgency = ["new", "pending"].includes(order.status) ? getUrgencyClass(waitMin) : "";
  const remaining = getRemainingMin(order.acceptedAt, order.estimatedMinutes);

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 100 }}
      className={`bg-white rounded-2xl border border-[#d0f0e0] shadow-sm p-5 ${urgency}`} style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-brand-text text-lg">{order.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-brand-text/40">{timeAgo(order.createdAt)}</p>
            {waitMin >= 5 && ["new", "pending"].includes(order.status) && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${waitMin >= 10 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                ⏱ {waitMin} мин ждёт
              </span>
            )}
            {order.status === "accepted" && remaining !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${remaining <= 0 ? "bg-red-100 text-red-600" : remaining <= 2 ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                {remaining <= 0 ? "⏱ Время вышло!" : `⏱ ~${remaining} мин осталось`}
              </span>
            )}
          </div>
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
      {order.cancelReason && (
        <div className="bg-red-50 rounded-xl px-3 py-2 text-xs text-red-600 mb-3">🚫 {order.cancelReason}</div>
      )}
      {order.paymentMethod === "cash" && !["paid", "cancelled"].includes(order.status) && (
        <div className="mb-2"><span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">💵 НАЛИЧНЫЕ</span></div>
      )}

      {/* Cancel form */}
      {showCancel && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="border-t border-red-200 pt-3 mb-3">
          <p className="text-xs text-red-600 font-bold mb-2">🚫 Причина отмены:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {["Нет в наличии", "Закончились ингредиенты", "Оборудование сломалось"].map((r) => (
              <button key={r} onClick={() => setCancelReason(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${cancelReason === r ? "bg-red-100 text-red-700 border border-red-300" : "bg-gray-100 text-gray-600"}`}>
                {r}
              </button>
            ))}
          </div>
          <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Или свой комментарий..."
            className="w-full px-3 py-2 rounded-xl border border-red-200 text-sm outline-none focus:border-red-400 mb-2" />
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={cancelOrder} disabled={updating}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-50">
              Подтвердить отмену
            </motion.button>
            <button onClick={() => setShowCancel(false)}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
              Назад
            </button>
          </div>
        </motion.div>
      )}

      {/* Cookie banner */}
      {hasCookie && order.status === "ready" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-[#faeeda] rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[#8B6914]">🍪 У клиента есть печенька!</span>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (!order.userId) return;
              await updateDoc(doc(getFirebaseDb(), "users", order.userId), { pendingCookie: false }).catch(() => {});
              setHasCookie(false);
            }}
            className="px-3 py-1.5 bg-[#1a7a44] text-white text-xs font-bold rounded-lg">
            Выдал ✓
          </motion.button>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-xs font-medium px-3 py-2 rounded-xl mb-3">
          ⚠️ {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[#d0f0e0] pt-3">
        <span className="font-bold text-brand-dark">{order.total}₸</span>
        <div className="flex gap-2 flex-wrap justify-end">
          {/* New → show Accept button */}
          {order.status === "new" && !showTimePicker && !showCancel && (
            <>
              <motion.button whileTap={{ scale: 0.95 }} disabled={updating}
                onClick={() => setShowTimePicker(true)}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                ✅ Принять
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { setShowCancel(true); setCancelReason("Нет в наличии"); }}
                className="px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-bold">
                ✕
              </motion.button>
            </>
          )}

          {/* Pending → show time picker directly */}
          {(order.status === "pending" || showTimePicker) && !showCancel && order.status !== "accepted" && order.status !== "ready" && order.status !== "paid" && order.status !== "cancelled" && (
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20].map((m) => (
                <motion.button key={m} whileTap={{ scale: 0.9 }} disabled={updating}
                  onClick={() => changeStatus("accepted", m)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {m} мин
                </motion.button>
              ))}
              {order.status === "new" && (
                <button onClick={() => setShowTimePicker(false)}
                  className="px-3 py-3 bg-gray-100 text-gray-500 rounded-xl text-sm">←</button>
              )}
              {!showCancel && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowCancel(true); setCancelReason("Нет в наличии"); }}
                  className="px-3 py-3 bg-red-500 text-white rounded-xl text-sm font-bold">✕</motion.button>
              )}
            </div>
          )}

          {/* Accepted → Ready */}
          {order.status === "accepted" && !showCancel && (
            <motion.button whileTap={{ scale: 0.95 }} disabled={updating}
              onClick={() => changeStatus("ready")}
              className="px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
              ☕ Готово
            </motion.button>
          )}

          {/* Ready → Paid */}
          {order.status === "ready" && (
            <motion.button whileTap={{ scale: 0.95 }} disabled={updating}
              onClick={() => changeStatus("paid")}
              className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
              {order.paymentMethod === "cash" ? "💵 Получил оплату" : "✓ Выдано"}
            </motion.button>
          )}

          {order.status === "paid" && (
            <span className="px-4 py-2 text-emerald-600 text-sm font-bold">✓ Завершён</span>
          )}
          {order.status === "cancelled" && (
            <span className="px-4 py-2 text-red-500 text-sm font-bold">✕ Отменён</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══ PUSH GATE — barista must enable push ═══ */
function BaristaPushGate({ uid, children }: { uid: string; children: ReactNode }) {
  const [pushStatus, setPushStatus] = useState<"loading" | "granted" | "prompt" | "denied">("loading");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) { setPushStatus("denied"); return; }
    if (Notification.permission === "granted") {
      // Silently ensure token
      import("@/lib/push").then(({ ensurePushToken }) => {
        ensurePushToken(uid).catch(() => {});
      });
      setPushStatus("granted");
    } else if (Notification.permission === "denied") {
      setPushStatus("denied");
    } else {
      setPushStatus("prompt");
    }
  }, [uid]);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const { requestPushPermission } = await import("@/lib/push");
      const ok = await requestPushPermission(uid);
      setPushStatus(ok ? "granted" : "denied");
    } catch {
      setPushStatus("denied");
    }
    setRequesting(false);
  };

  if (pushStatus === "loading") return null;
  if (pushStatus === "granted") return <>{children}</>;

  return (
    <main className="min-h-screen bg-brand-bg flex items-center justify-center px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-dark to-brand-mid flex items-center justify-center text-4xl mx-auto mb-6"
          style={{ boxShadow: "0 8px 24px rgba(26,122,68,0.3)" }}>
          🔔
        </div>
        <h2 className="font-display text-2xl font-bold text-brand-dark mb-2">Включи уведомления</h2>
        <p className="text-sm text-brand-text/60 mb-6">
          {pushStatus === "denied"
            ? "Уведомления заблокированы в браузере. Разреши их в настройках сайта и обнови страницу."
            : "Ты будешь получать уведомления о новых заказах. Без них можно пропустить заказ клиента."}
        </p>
        {pushStatus === "prompt" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleEnable}
            disabled={requesting}
            className="w-full py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg disabled:opacity-50 min-h-[56px]"
            style={{ boxShadow: "0 6px 20px rgba(26,122,68,0.25)" }}
          >
            {requesting ? "Подключаем..." : "Разрешить уведомления"}
          </motion.button>
        )}
        {pushStatus === "denied" && (
          <button onClick={() => window.location.reload()}
            className="w-full py-3 bg-gray-100 text-brand-text font-bold rounded-xl text-sm min-h-[44px]">
            Обновить страницу
          </button>
        )}
      </motion.div>
    </main>
  );
}

/* ═══ PAGE ═══ */
/* ═══ STOP-LIST PANEL ═══ */
function StopListPanel({ stopList }: { stopList: StopList }) {
  const [tab, setTab] = useState<"items" | "modifiers">("items");

  const toggleItem = async (id: string) => {
    const ref = doc(getFirebaseDb(), "cafe_status", "aksay_main");
    if (stopList.items.includes(id)) {
      await updateDoc(ref, { "stopList.items": arrayRemove(id) }).catch(() => {});
    } else {
      await updateDoc(ref, { "stopList.items": arrayUnion(id) }).catch(() => {});
    }
  };

  const toggleModifier = async (id: string) => {
    const ref = doc(getFirebaseDb(), "cafe_status", "aksay_main");
    if (stopList.modifiers.includes(id)) {
      await updateDoc(ref, { "stopList.modifiers": arrayRemove(id) }).catch(() => {});
    } else {
      await updateDoc(ref, { "stopList.modifiers": arrayUnion(id) }).catch(() => {});
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("items")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold min-h-[44px] ${
            tab === "items" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
          }`}>Позиции ({stopList.items.length})</button>
        <button onClick={() => setTab("modifiers")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold min-h-[44px] ${
            tab === "modifiers" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
          }`}>Модификаторы ({stopList.modifiers.length})</button>
      </div>

      {tab === "items" && (
        <div className="space-y-1">
          {CATEGORIES.map(cat => {
            const items = MENU_ITEMS.filter(i => i.category === cat.id);
            if (items.length === 0) return null;
            return (
              <div key={cat.id} className="mb-3">
                <p className="text-xs font-bold text-brand-text/50 uppercase mb-1">{cat.name}</p>
                {items.map(item => {
                  const stopped = stopList.items.includes(item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white mb-1 border border-[#d0f0e0]">
                      <span className={`text-sm ${stopped ? "text-red-500 line-through" : "text-brand-text"}`}>{item.name}</span>
                      <button onClick={() => toggleItem(item.id)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${stopped ? "bg-red-400" : "bg-green-400"}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${stopped ? "left-1" : "left-6"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === "modifiers" && (
        <div className="space-y-1">
          {(['milk', 'syrup', 'addon'] as const).map(group => {
            const mods = MODIFIERS.filter(m => m.group === group);
            const label = group === 'milk' ? 'Молоко' : group === 'syrup' ? 'Сиропы' : 'Добавки';
            return (
              <div key={group} className="mb-3">
                <p className="text-xs font-bold text-brand-text/50 uppercase mb-1">{label}</p>
                {mods.map(mod => {
                  const stopped = stopList.modifiers.includes(mod.id);
                  return (
                    <div key={mod.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white mb-1 border border-[#d0f0e0]">
                      <div>
                        <span className={`text-sm ${stopped ? "text-red-500 line-through" : "text-brand-text"}`}>{mod.name}</span>
                        <span className="text-xs text-brand-text/40 ml-2">{formatPrice(mod.price)}</span>
                      </div>
                      <button onClick={() => toggleModifier(mod.id)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${stopped ? "bg-red-400" : "bg-green-400"}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${stopped ? "left-1" : "left-6"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══ POPULAR PANEL ═══ */
function PopularPanel({ popularItems }: { popularItems: string[] }) {
  const togglePopular = async (id: string) => {
    const ref = doc(getFirebaseDb(), "cafe_status", "aksay_main");
    if (popularItems.includes(id)) {
      await updateDoc(ref, { popularItems: arrayRemove(id) }).catch(() => {});
    } else {
      if (popularItems.length >= 8) return; // max 8
      await updateDoc(ref, { popularItems: arrayUnion(id) }).catch(() => {});
    }
  };

  return (
    <div>
      <p className="text-xs text-brand-text/50 mb-3">
        Выбери до 8 позиций. Они появятся в секции «Популярное» у клиентов.
      </p>
      {CATEGORIES.map(cat => {
        const items = MENU_ITEMS.filter(i => i.category === cat.id);
        if (items.length === 0) return null;
        return (
          <div key={cat.id} className="mb-3">
            <p className="text-xs font-bold text-brand-text/50 uppercase mb-1">{cat.name}</p>
            {items.map(item => {
              const isPopular = popularItems.includes(item.id);
              return (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white mb-1 border border-[#d0f0e0]">
                  <div className="flex items-center gap-2">
                    {isPopular && <span className="text-xs">🔥</span>}
                    <span className={`text-sm ${isPopular ? "font-bold text-brand-dark" : "text-brand-text"}`}>{item.name}</span>
                  </div>
                  <button onClick={() => togglePopular(item.id)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${isPopular ? "bg-orange-400" : "bg-gray-200"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${isPopular ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useRequireBarista();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"active" | "paid">("active");
  const [cafeOpen, setCafeOpen] = useState(true);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [mainTab, setMainTab] = useState<"orders" | "stoplist" | "popular">("orders");
  const [stopList, setStopList] = useState<StopList>({ items: [], modifiers: [] });
  const [popularItems, setPopularItems] = useState<string[]>([]);

  // Force token refresh
  useEffect(() => {
    getFirebaseAuth().currentUser?.getIdToken(true).catch(() => {});
  }, []);

  const alertIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistent alert: repeating sound every 5s while there are "new" orders
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playAlertSound = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const playTone = (freq: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.4;
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.12);
      };
      playTone(880, 0);
      playTone(1100, 0.15);
      playTone(1320, 0.30);
    } catch { /* audio not available */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  }, []);

  const startAlert = useCallback(() => {
    if (alertIntervalRef.current) return; // already running
    playAlertSound(); // play immediately
    alertIntervalRef.current = setInterval(() => {
      playAlertSound();
    }, 5000);
  }, [playAlertSound]);

  const stopAlert = useCallback(() => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const q = query(collection(getFirebaseDb(), "orders"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const newOrders = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }));
      setOrders(newOrders);
    });
    return () => unsub();
  }, []);

  // Alert logic: start/stop based on "new" orders count
  const newOrdersCount = orders.filter(o => o.status === "new").length;
  useEffect(() => {
    if (newOrdersCount > 0) {
      startAlert();
    } else {
      stopAlert();
    }
    return () => stopAlert();
  }, [newOrdersCount, startAlert, stopAlert]);

  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const { isOpen, isManual } = resolveIsOpen(data);
        setCafeOpen(isOpen);
        setIsManualOverride(isManual);
        setStopList(normalizeStopList(data.stopList));
        setPopularItems(data.popularItems ?? []);
      }
    }, () => {});
    return () => unsub();
  }, []);

  const toggleCafe = async () => {
    const newOpen = !cafeOpen;
    const action = newOpen ? "открыть" : "закрыть";

    // Рассчитываем до когда действует override — до следующего перехода по расписанию
    const now = new Date();
    const almaty = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Almaty" }));
    const todayOpen = new Date(almaty);
    todayOpen.setHours(CAFE_OPEN_HOUR, CAFE_OPEN_MIN, 0, 0);
    const todayClose = new Date(almaty);
    todayClose.setHours(CAFE_CLOSE_HOUR, CAFE_CLOSE_MIN, 0, 0);

    // Override до ближайшего перехода: если закрываем → до открытия, если открываем → до закрытия
    let overrideUntil: Date;
    if (newOpen) {
      // Открываем вручную → override до закрытия по расписанию
      overrideUntil = almaty < todayClose ? todayClose : new Date(todayClose.getTime() + 86400000);
    } else {
      // Закрываем вручную → override до открытия по расписанию
      overrideUntil = almaty < todayOpen ? todayOpen : new Date(todayOpen.getTime() + 86400000);
    }

    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} кофейню вручную?\nАвтоматически вернётся по расписанию.`)) return;

    setCafeOpen(newOpen);
    setIsManualOverride(true);
    await setDoc(doc(getFirebaseDb(), "cafe_status", "aksay_main"), {
      isOpen: newOpen,
      manualOverride: true,
      manualUntil: overrideUntil.toISOString(),
      [newOpen ? "openedAt" : "closedAt"]: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
  };

  const activeOrders = orders.filter((o) => ["new", "pending", "accepted", "ready"].includes(o.status));
  const readyOrders = orders.filter((o) => o.status === "ready");
  const waitingOrders = orders.filter((o) => ["new", "pending", "accepted"].includes(o.status));
  const doneOrders = orders.filter((o) => o.status === "paid" || o.status === "cancelled");
  const displayed = filter === "active" ? activeOrders : doneOrders;

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
    <BaristaPushGate uid={user.uid}>
    <main className="min-h-screen bg-brand-bg pb-20">
      {/* Flashing banner for new orders */}
      {newOrdersCount > 0 && (
        <motion.div
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="sticky top-0 z-[60] bg-red-500 text-white text-center py-3 cursor-pointer"
          onClick={() => { setMainTab("orders"); setFilter("active"); }}
        >
          <p className="text-base font-bold">
            🔔 {newOrdersCount === 1 ? "Новый заказ!" : `${newOrdersCount} новых заказа!`}
          </p>
          <p className="text-xs text-white/80">Нажми чтобы принять</p>
        </motion.div>
      )}

      <div className={`sticky ${newOrdersCount > 0 ? "top-[60px]" : "top-0"} z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]`}>
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-brand-text">📋 Заказы</h1>
          <motion.button whileTap={{ scale: 0.95 }} onClick={toggleCafe}
            className={`px-3 py-2 rounded-full text-xs font-bold min-h-[44px] ${cafeOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {cafeOpen ? "🟢 Открыто" : "🔴 Закрыто"}
            {isManualOverride && <span className="ml-1 opacity-70">· ручн.</span>}
          </motion.button>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-[480px] mx-auto">
        {/* Main tabs */}
        <div className="flex gap-1.5 mb-4">
          <button onClick={() => setMainTab("orders")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[40px] transition-all ${
              mainTab === "orders" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
            }`}>📋 Заказы</button>
          <button onClick={() => setMainTab("popular")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[40px] transition-all ${
              mainTab === "popular" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
            }`}>🔥 Популярное ({popularItems.length})</button>
          <button onClick={() => setMainTab("stoplist")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[40px] transition-all ${
              mainTab === "stoplist" ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
            }`}>🚫 Стоп ({stopList.items.length + stopList.modifiers.length})</button>
        </div>

        {mainTab === "stoplist" && <StopListPanel stopList={stopList} />}

        {mainTab === "popular" && (
          <PopularPanel popularItems={popularItems} />
        )}

        {mainTab === "orders" && (
          <>
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
                Завершённые ({doneOrders.length})
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
          </>
        )}
      </div>
    </main>
    </BaristaPushGate>
  );
}
