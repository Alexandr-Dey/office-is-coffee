"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CoffeeMatch3 from "./CoffeeMatch3";
import { useAuth } from "@/lib/auth";
import { saveGameScore, getGameHighScore } from "@/lib/gameScores";

interface GameWrapperProps {
  orderStatus: "new" | "pending" | "accepted" | "ready" | "paid" | "cancelled";
  orderId: string;
}

export default function GameWrapper({ orderStatus, orderId }: GameWrapperProps) {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moves] = useState(20);
  const scoreSaved = useRef(false);
  const sessionId = useRef(orderId);

  // Reset when order changes
  useEffect(() => {
    if (sessionId.current !== orderId) {
      sessionId.current = orderId;
      scoreSaved.current = false;
      setScore(0);
    }
  }, [orderId]);

  // Load high score
  useEffect(() => {
    if (!user?.uid) return;
    getGameHighScore(user.uid, "match3").then(setHighScore).catch(() => {});
  }, [user?.uid]);

  // Save score when game ends or order becomes ready
  useEffect(() => {
    if (
      !user?.uid ||
      scoreSaved.current ||
      sessionId.current !== orderId ||
      score === 0
    ) return;

    if (orderStatus === "ready" || orderStatus === "paid") {
      scoreSaved.current = true;
      saveGameScore(user.uid, score, "match3").then(() => {
        if (score > highScore) setHighScore(score);
      }).catch(() => {});
    }
  }, [orderStatus, user?.uid, score, highScore, orderId]);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  const showGame = ["new", "pending", "accepted"].includes(orderStatus);
  const showReady = orderStatus === "ready";

  if (orderStatus === "paid" || orderStatus === "cancelled") return null;

  return (
    <div className="mb-6">
      <AnimatePresence mode="wait">
        {showGame && (
          <motion.div
            key="game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
              <div className="text-center mb-3">
                <p className="text-xs text-brand-text/50">Пока ждёшь кофе — поиграй!</p>
                <details className="mt-1">
                  <summary className="text-[10px] text-brand-dark cursor-pointer">Как играть?</summary>
                  <div className="text-[10px] text-brand-text/50 mt-1.5 text-left bg-brand-bg rounded-lg p-2.5 space-y-1">
                    <p>☕ Нажми на элемент, потом на соседний — они поменяются</p>
                    <p>✨ Собери 3+ одинаковых в ряд — они исчезнут</p>
                    <p>🔥 Цепочки дают больше очков: x2, x3, x4...</p>
                    <p>🎯 Цель: 500 очков за 20 ходов</p>
                    <p>🏆 Рекорд сохраняется в профиле</p>
                  </div>
                </details>
              </div>

              {/* HUD */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-brand-bg rounded-xl p-2 text-center">
                  <p className="text-[10px] text-brand-text/50">Очки</p>
                  <p className="font-bold text-brand-dark text-sm">{score}</p>
                </div>
                <div className="bg-brand-bg rounded-xl p-2 text-center">
                  <p className="text-[10px] text-brand-text/50">Рекорд</p>
                  <p className="font-bold text-brand-dark text-sm">{highScore}</p>
                </div>
                <div className="bg-brand-bg rounded-xl p-2 text-center">
                  <p className="text-[10px] text-brand-text/50">Ходы</p>
                  <p className="font-bold text-brand-dark text-sm">{moves}</p>
                </div>
                <div className="bg-brand-bg rounded-xl p-2 text-center">
                  <p className="text-[10px] text-brand-text/50">Цель</p>
                  <p className="font-bold text-brand-dark text-sm">500</p>
                </div>
              </div>

              <CoffeeMatch3 onScoreUpdate={handleScoreUpdate} />
            </div>
          </motion.div>
        )}

        {showReady && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-6 text-white text-center"
          >
            <p className="text-4xl mb-2">☕</p>
            <p className="font-bold text-xl mb-1">Ваш кофе готов!</p>
            <p className="text-white/70 text-sm">Заберите у стойки</p>
            {score > 0 && (
              <p className="mt-3 text-sm text-white/60">Ваш счёт: {score} очков{score > highScore ? " 🏆 Новый рекорд!" : ""}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
