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
              <p className="text-center text-xs text-brand-text/50 mb-3">Пока ждёшь кофе — поиграй!</p>

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
