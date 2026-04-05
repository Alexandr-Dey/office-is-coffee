"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

/* ═══════════════════════════════════════════
   ТИПЫ
   ═══════════════════════════════════════════ */
interface OrderData {
  name: string;
  items: { name: string; size: string; price: number; qty: number }[];
  total: number;
  status: "pending" | "accepted" | "ready";
  comment?: string;
}

const STATUS_TEXT: Record<string, { title: string; sub: string; emoji: string }> = {
  pending: {
    title: "\u0417\u0430\u043A\u0430\u0437 \u043F\u0440\u0438\u043D\u044F\u0442",
    sub: "\u041E\u0436\u0438\u0434\u0430\u0435\u043C \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u0431\u0430\u0440\u0438\u0441\u0442\u044B...",
    emoji: "\u231B",
  },
  accepted: {
    title: "\u0412\u0438\u0442\u0430\u043B\u0438\u0439 \u0433\u043E\u0442\u043E\u0432\u0438\u0442 \u0442\u0432\u043E\u0439 \u043A\u043E\u0444\u0435",
    sub: "\u041D\u0435\u043C\u043D\u043E\u0433\u043E \u0442\u0435\u0440\u043F\u0435\u043D\u0438\u044F...",
    emoji: "\u2615",
  },
  ready: {
    title: "\u0422\u0432\u043E\u0439 \u043A\u043E\u0444\u0435 \u0433\u043E\u0442\u043E\u0432!",
    sub: "\u0417\u0430\u0431\u0435\u0440\u0438 \u0443 \u0441\u0442\u043E\u0439\u043A\u0438",
    emoji: "\uD83C\uDF89",
  },
};

/* ═══════════════════════════════════════════
   CANVAS АНИМАЦИЯ
   ═══════════════════════════════════════════ */
function WaitingCanvas({ status }: { status: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const t = frameRef.current;

      /* фон кофейни */
      ctx.fillStyle = "#8B2500";
      ctx.fillRect(0, 0, w, h);

      /* пол */
      ctx.fillStyle = "#D2B48C";
      ctx.fillRect(0, h * 0.65, w, h * 0.35);
      /* плитка */
      ctx.fillStyle = "#C4A882";
      for (let tx = 0; tx < w; tx += 30) {
        ctx.fillRect(tx, h * 0.65, 1, h * 0.35);
      }

      /* стойка */
      const barW = w * 0.55;
      const barX = w / 2 - barW / 2;
      const barY = h * 0.6;
      ctx.fillStyle = "#2E7D32";
      ctx.fillRect(barX, barY, barW, 22);
      ctx.fillStyle = "#1B5E20";
      ctx.fillRect(barX, barY + 22, barW, 8);

      /* надпись на стойке */
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CENTER COFFEE", w / 2, barY + 15);

      const bob = Math.sin(t * 0.05) * 2;
      const s = 0.85;

      /* Бариста Виталий (за стойкой, слева) */
      const vx = w / 2 - 40;
      const vy = barY - 45;
      ctx.save();
      ctx.translate(vx, vy + bob * 0.5);
      /* тело */
      ctx.fillStyle = "#1A1A1A";
      ctx.fillRect(-12 * s, 8 * s, 24 * s, 28 * s);
      /* фартук */
      ctx.fillStyle = "#C0392B";
      ctx.fillRect(-10 * s, 12 * s, 20 * s, 22 * s);
      /* голова */
      ctx.fillStyle = "#DEB887";
      ctx.beginPath();
      ctx.arc(0, -4 * s, 14 * s, 0, Math.PI * 2);
      ctx.fill();
      /* кепка */
      ctx.fillStyle = "#C0392B";
      ctx.beginPath();
      ctx.ellipse(0, -14 * s, 16 * s, 6 * s, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-16 * s, -15 * s, 32 * s, 4 * s);
      /* глаза */
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(-5 * s, -4 * s, 2 * s, 0, Math.PI * 2);
      ctx.arc(5 * s, -4 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      /* рот */
      ctx.beginPath();
      ctx.arc(0, 2 * s, 4 * s, 0, Math.PI);
      ctx.stroke();

      /* руки — зависят от статуса */
      if (status === "accepted") {
        /* готовит — руки вниз к стойке */
        ctx.fillStyle = "#1A1A1A";
        ctx.save();
        ctx.translate(-14 * s, 16 * s);
        ctx.rotate(0.3);
        ctx.fillRect(-3 * s, 0, 6 * s, 18 * s);
        ctx.restore();
        ctx.save();
        ctx.translate(14 * s, 16 * s);
        ctx.rotate(-0.3);
        ctx.fillRect(-3 * s, 0, 6 * s, 18 * s);
        ctx.restore();
        /* стаканчик в руках */
        const cupBob = Math.sin(t * 0.1) * 1.5;
        ctx.fillStyle = "#C0392B";
        ctx.beginPath();
        ctx.moveTo(-4 * s, 30 * s + cupBob);
        ctx.lineTo(-2 * s, 20 * s + cupBob);
        ctx.lineTo(4 * s, 20 * s + cupBob);
        ctx.lineTo(6 * s, 30 * s + cupBob);
        ctx.closePath();
        ctx.fill();
        /* пар от стакана */
        for (let pi = 0; pi < 3; pi++) {
          const pt = ((t * 0.06 + pi * 0.7) % 2);
          const pa = Math.max(0, 0.6 - pt * 0.3);
          ctx.fillStyle = `rgba(255,255,255,${pa})`;
          ctx.beginPath();
          ctx.ellipse(
            1 * s + Math.sin(t * 0.08 + pi) * 3,
            18 * s + cupBob - pt * 12,
            2, 3, 0, 0, Math.PI * 2
          );
          ctx.fill();
        }
      } else if (status === "ready") {
        /* машет правой рукой */
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(-18 * s, 14 * s, 6 * s, 14 * s);
        ctx.save();
        ctx.translate(14 * s, 8 * s);
        ctx.rotate(-0.8 + Math.sin(t * 0.15) * 0.3);
        ctx.fillRect(-3 * s, -18 * s, 6 * s, 20 * s);
        ctx.restore();
      } else {
        /* idle */
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(-18 * s, 14 * s, 6 * s, 14 * s);
        ctx.fillRect(12 * s, 14 * s, 6 * s, 14 * s);
      }
      /* бейдж */
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(-16 * s, 36 * s, 32 * s, 10 * s);
      ctx.fillStyle = "#FFF";
      ctx.font = `bold ${7 * s}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("\u0412\u0438\u0442\u0430\u043B\u0438\u0439", 0, 43 * s);
      ctx.restore();

      /* Аватар гостя (перед стойкой, справа) */
      const gx = w / 2 + 50;
      const gy = barY + 50;
      ctx.save();
      ctx.translate(gx, gy + bob);
      /* тело */
      ctx.fillStyle = "#2196F3";
      ctx.fillRect(-10 * s, 8 * s, 20 * s, 24 * s);
      /* голова */
      ctx.fillStyle = "#DEB887";
      ctx.beginPath();
      ctx.arc(0, -2 * s, 12 * s, 0, Math.PI * 2);
      ctx.fill();
      /* очки */
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-5 * s, -2 * s, 4 * s, 0, Math.PI * 2);
      ctx.arc(5 * s, -2 * s, 4 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-1 * s, -2 * s);
      ctx.lineTo(1 * s, -2 * s);
      ctx.stroke();
      /* ноги */
      ctx.fillStyle = "#333";
      ctx.fillRect(-8 * s, 32 * s, 6 * s, 10 * s);
      ctx.fillRect(2 * s, 32 * s, 6 * s, 10 * s);
      /* руки */
      ctx.fillStyle = "#1976D2";
      ctx.fillRect(-16 * s, 10 * s, 6 * s, 14 * s);
      ctx.fillRect(10 * s, 10 * s, 6 * s, 14 * s);
      ctx.restore();

      /* кофемашина */
      const cmx = barX + barW - 30;
      ctx.fillStyle = "#333";
      ctx.fillRect(cmx, barY - 40, 25, 40);
      ctx.fillStyle = "#555";
      ctx.fillRect(cmx + 3, barY - 35, 19, 15);
      ctx.fillStyle = "#C0392B";
      ctx.beginPath();
      ctx.arc(cmx + 12, barY - 10, 3, 0, Math.PI * 2);
      ctx.fill();

      /* пар от кофемашины */
      if (status === "accepted") {
        for (let pi = 0; pi < 5; pi++) {
          const pt = ((t * 0.04 + pi * 0.6) % 2.5);
          const pa = Math.max(0, 0.5 - pt * 0.2);
          ctx.fillStyle = `rgba(255,255,255,${pa})`;
          ctx.beginPath();
          ctx.ellipse(
            cmx + 12 + Math.sin(t * 0.07 + pi) * 5,
            barY - 42 - pt * 15,
            3, 5, 0, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }

      /* стаканчики на стойке */
      for (let si = 0; si < 3; si++) {
        const sx = barX + 20 + si * 22;
        ctx.fillStyle = "#F5EDE5";
        ctx.beginPath();
        ctx.moveTo(sx, barY - 1);
        ctx.lineTo(sx - 2, barY - 12);
        ctx.lineTo(sx + 8, barY - 12);
        ctx.lineTo(sx + 6, barY - 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#C0392B";
        ctx.fillRect(sx, barY - 8, 6, 3);
      }

      ctx.textAlign = "start";
      frameRef.current++;
    },
    [status]
  );

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const loop = () => {
      draw(ctx, cvs.width, cvs.height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={260}
      className="w-full max-w-[400px] rounded-2xl shadow-lg border border-coffee-200"
    />
  );
}

/* ═══════════════════════════════════════════
   СТРАНИЦА ОЖИДАНИЯ ЗАКАЗА
   ═══════════════════════════════════════════ */
export default function OrderWaitPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "orders", orderId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setOrder(snap.data() as OrderData);
      },
      (err) => {
        console.error("Firestore listen error:", err);
        setNotFound(true);
      }
    );
    return () => unsub();
  }, [orderId]);

  if (notFound) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">{"\uD83E\uDD14"}</p>
          <p className="text-coffee-700 text-lg font-medium mb-2">{"\u0417\u0430\u043A\u0430\u0437 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"}</p>
          <a href="/menu" className="text-red-600 font-semibold hover:underline">
            {"\u2190 \u0412 \u043C\u0435\u043D\u044E"}
          </a>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </main>
    );
  }

  const st = STATUS_TEXT[order.status] ?? STATUS_TEXT.pending;

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/office" className="text-sm text-coffee-500 hover:text-coffee-700">
            {"\u2190 \u0412 \u043E\u0444\u0438\u0441"}
          </a>
          <span className="font-display text-xl font-bold text-coffee-900">{"\u0422\u0432\u043E\u0439 \u0437\u0430\u043A\u0430\u0437"}</span>
          <div className="w-20" />
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          {/* Анимация */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-6"
          >
            <WaitingCanvas status={order.status} />
          </motion.div>

          {/* Статус */}
          <AnimatePresence mode="wait">
            <motion.div
              key={order.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <p className="text-5xl mb-3">{st.emoji}</p>
              <h1 className="font-display text-2xl font-bold text-coffee-900 mb-1">
                {st.title}
              </h1>
              <p className="text-coffee-500">{st.sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Прогресс */}
          <div className="flex justify-center gap-3 mb-8">
            {(["pending", "accepted", "ready"] as const).map((s, i) => {
              const steps = ["pending", "accepted", "ready"];
              const current = steps.indexOf(order.status);
              const active = i <= current;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      active
                        ? "bg-red-600 text-white"
                        : "bg-coffee-100 text-coffee-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div className={`w-8 h-0.5 ${active && i < current ? "bg-red-600" : "bg-coffee-100"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Детали */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-coffee-100 shadow-sm p-5 text-left"
          >
            <h3 className="font-bold text-coffee-900 mb-2">{"\u0414\u0435\u0442\u0430\u043B\u0438 \u0437\u0430\u043A\u0430\u0437\u0430"}</h3>
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-coffee-700">
                  {it.name} {it.size !== "\u2014" && `(${it.size})`} {it.qty > 1 && `\u00D7${it.qty}`}
                </span>
                <span className="font-bold text-coffee-800">{it.price * it.qty} {"\u20B8"}</span>
              </div>
            ))}
            <div className="border-t border-coffee-100 mt-2 pt-2 flex justify-between">
              <span className="font-bold text-coffee-900">{"\u0418\u0442\u043E\u0433\u043E"}</span>
              <span className="font-bold text-red-600">{order.total} {"\u20B8"}</span>
            </div>
          </motion.div>

          {order.status === "ready" && (
            <motion.a
              href="/office"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-2xl shadow-lg"
            >
              {"\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u0432 \u043E\u0444\u0438\u0441"}
            </motion.a>
          )}
        </div>
      </div>
    </main>
  );
}
