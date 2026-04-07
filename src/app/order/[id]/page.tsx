"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useToast } from "@/components/Toast";
import CoffeeScene, { type BaristaState } from "@/components/CoffeeScene";
import { trackEvent } from "@/lib/mixpanel";

interface OrderData {
  name: string;
  items: { name: string; size: string; price: number; qty: number }[];
  total: number;
  status: "new" | "pending" | "accepted" | "ready" | "paid";
  comment?: string;
  estimatedMinutes?: number;
  acceptedAt?: number;
  rating?: number;
}

const STATUS_TEXT: Record<string, { title: string; sub: string; emoji: string }> = {
  new: { title: "Заказ отправлен", sub: "Бариста скоро увидит...", emoji: "\uD83D\uDCE8" },
  pending: { title: "Заказ принят", sub: "Ожидаем подтверждения баристы...", emoji: "\u231B" },
  accepted: { title: "Виталий готовит твой кофе", sub: "Немного терпения...", emoji: "\u2615" },
  ready: { title: "Твой кофе готов!", sub: "Забери у стойки", emoji: "\uD83C\uDF89" },
  paid: { title: "Приятного!", sub: "До встречи снова", emoji: "\u2705" },
};

/* ═══ COUNTDOWN TIMER ═══ */
function CountdownTimer({ estimatedMinutes, acceptedAt }: { estimatedMinutes: number; acceptedAt: number }) {
  const [remaining, setRemaining] = useState(0);
  const [total] = useState(estimatedMinutes * 60 * 1000);

  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Date.now() - acceptedAt;
      const rem = Math.max(0, total - elapsed);
      setRemaining(rem);
    }, 1000);
    return () => clearInterval(iv);
  }, [acceptedAt, total]);

  const progress = Math.min(1, (Date.now() - acceptedAt) / total);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const overdue = remaining === 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        {overdue ? (
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}
            className="text-lg font-bold text-orange-500">Скоро готово...</motion.span>
        ) : (
          <span className="text-3xl font-bold font-mono text-brand-dark">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        )}
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${overdue ? "bg-orange-400" : "bg-brand-mint"}`}
          initial={{ width: "0%" }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

/* ═══ FEEDBACK SHEET ═══ */
function FeedbackSheet({ orderId, onDismiss }: { orderId: string; onDismiss: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const submitRating = async (rating: number) => {
    setSubmitted(true);
    trackEvent("Order Rated", { rating, orderId });
    await updateDoc(doc(getFirebaseDb(), "orders", orderId), { rating }).catch(() => {});
    setTimeout(onDismiss, 1000);
  };

  return (
    <motion.div
      initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
      className="fixed bottom-20 left-3 right-3 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-[#d0f0e0] p-5 z-50 text-center"
    >
      {submitted ? (
        <p className="text-lg font-bold text-brand-dark">Спасибо! \u2764\uFE0F</p>
      ) : (
        <>
          <p className="font-bold text-brand-text mb-3">Как кофе?</p>
          <div className="flex justify-center gap-6">
            {[{ emoji: "\uD83D\uDE0D", val: 3 }, { emoji: "\uD83D\uDC4D", val: 2 }, { emoji: "\uD83D\uDE15", val: 1 }].map((r) => (
              <motion.button key={r.val} whileTap={{ scale: 0.85 }}
                onClick={() => submitRating(r.val)}
                className="text-4xl hover:scale-110 transition-transform">{r.emoji}</motion.button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ═══ PAGE ═══ */
export default function OrderWaitPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const prevStatus = useRef<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>();
  const { showToast } = useToast();

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "orders", orderId),
      (snap) => {
        if (!snap.exists()) { setNotFound(true); return; }
        const data = snap.data() as OrderData;
        if (prevStatus.current && prevStatus.current !== data.status) {
          if (data.status === "accepted") showToast("\u2615 Ваш кофе готовится!", "info");
          else if (data.status === "ready") {
            showToast("\u2705 Ваш кофе готов! Заберите у стойки", "success");
            feedbackTimer.current = setTimeout(() => setShowFeedback(true), 120000);
          }
        }
        prevStatus.current = data.status;
        setOrder(data);
      },
      () => setNotFound(true),
    );
    return () => { unsub(); clearTimeout(feedbackTimer.current); };
  }, [orderId, showToast]);

  const dismissFeedback = useCallback(() => setShowFeedback(false), []);

  if (notFound) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">\uD83E\uDD14</p>
          <p className="text-brand-text text-lg font-medium mb-2">Заказ не найден</p>
          <a href="/menu" className="text-brand-dark font-semibold hover:underline">\u2190 В меню</a>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-brand-bg pt-20 px-4">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-[#d0f0e0] animate-pulse">
            <div className="h-6 bg-[#d0f0e0] rounded-lg w-3/4 mb-3" />
            <div className="h-4 bg-[#d0f0e0]/50 rounded-lg w-1/2 mb-6" />
            <div className="h-40 bg-[#d0f0e0]/50 rounded-xl mb-4" />
          </div>
        </div>
      </main>
    );
  }

  const st = STATUS_TEXT[order.status] ?? STATUS_TEXT.pending;

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/menu" className="text-sm text-brand-text/50 hover:text-brand-dark">\u2190 В меню</a>
          <span className="font-display text-xl font-bold text-brand-text">Твой заказ</span>
          <div className="w-20" />
        </div>
      </nav>

      <div className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center mb-6">
            <CoffeeScene orderStatus={order.status as BaristaState} />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={order.status} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-4">
              <p className="text-5xl mb-3">{st.emoji}</p>
              <h1 className="font-display text-2xl font-bold text-brand-text mb-1">{st.title}</h1>
              <p className="text-brand-text/50">{st.sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Countdown timer */}
          {order.status === "accepted" && order.estimatedMinutes && order.acceptedAt && (
            <CountdownTimer estimatedMinutes={order.estimatedMinutes} acceptedAt={order.acceptedAt} />
          )}

          {/* Progress steps */}
          <div className="flex justify-center gap-2 mb-8">
            {(["new", "pending", "accepted", "ready", "paid"] as const).map((s, i) => {
              const steps = ["new", "pending", "accepted", "ready", "paid"];
              const current = steps.indexOf(order.status);
              const active = i <= current;
              const labels = ["\uD83D\uDCE8", "\u231B", "\u2615", "\uD83C\uDF89", "\u2705"];
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                    active ? "bg-brand-dark text-white" : "bg-[#d0f0e0] text-brand-text/40"
                  }`}>{labels[i]}</div>
                  {i < 4 && <div className={`w-4 h-0.5 ${active && i < current ? "bg-brand-dark" : "bg-[#d0f0e0]"}`} />}
                </div>
              );
            })}
          </div>

          {/* Order details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-5 text-left" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <h3 className="font-bold text-brand-text mb-2">Детали заказа</h3>
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-brand-text/70">{it.name} {it.size !== "\u2014" && `(${it.size})`} {it.qty > 1 && `\u00D7${it.qty}`}</span>
                <span className="font-bold text-brand-text">{it.price * it.qty} \u20B8</span>
              </div>
            ))}
            <div className="border-t border-[#d0f0e0] mt-2 pt-2 flex justify-between">
              <span className="font-bold text-brand-text">Итого</span>
              <span className="font-bold text-brand-dark">{order.total} \u20B8</span>
            </div>
          </motion.div>

          {(order.status === "ready" || order.status === "paid") && (
            <motion.a href="/menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="inline-block mt-6 px-8 py-3 bg-brand-dark text-white font-bold rounded-2xl shadow-lg">
              Вернуться в меню
            </motion.a>
          )}
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && !order.rating && (
          <FeedbackSheet orderId={orderId} onDismiss={dismissFeedback} />
        )}
      </AnimatePresence>
    </main>
  );
}
