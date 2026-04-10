"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CookieFact } from "@/lib/cookieFacts";

interface CookieButtonProps {
  fact: CookieFact;
  collected: boolean;
  onCollect: () => void;
}

export default function CookieButton({ fact, collected, onCollect }: CookieButtonProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [justCollected, setJustCollected] = useState(false);

  const handleCollect = () => {
    onCollect();
    setJustCollected(true);
    setTimeout(() => setShowSheet(false), 1400);
  };

  return (
    <>
      {/* Cookie icon on card */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); setShowSheet(true); }}
        className="absolute -top-2 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
        style={{
          backgroundColor: collected ? "#d0f0e0" : "#faeeda",
          border: collected ? "2px solid #3ecf82" : "2px solid #FAC775",
        }}
        animate={collected ? {} : { y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
        transition={collected ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-sm">{collected ? "✓" : "🍪"}</span>
      </motion.button>

      {/* Bottom sheet */}
      <AnimatePresence>
        {showSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
            onClick={() => setShowSheet(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl p-6 w-full max-w-[480px] relative overflow-hidden"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              {/* Cookie icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                className="text-center mb-3"
              >
                <span className="text-6xl">🍪</span>
              </motion.div>

              <h3 className="font-bold text-xl text-[#1a7a44] text-center mb-4">
                {justCollected ? "Печенька твоя!" : "Ты нашёл сегодняшнюю печеньку!"}
              </h3>

              {/* Fact */}
              <div className="bg-[#f5f0e8] rounded-xl p-4 mb-4">
                <p className="text-sm text-[#0f3a20] leading-relaxed">{fact.text}</p>
                <p className="text-[10px] text-[#0f3a20]/40 mt-2">{fact.source}</p>
              </div>

              {/* Real cookie notice */}
              <div className="flex items-center gap-3 bg-[#faeeda] rounded-xl p-3 mb-4">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-sm font-bold text-[#0f3a20]">Настоящая печенька к кофе</p>
                  <p className="text-xs text-[#0f3a20]/60">Скажи баристе «у меня есть печенька» при заказе</p>
                </div>
              </div>

              {/* Button */}
              {collected || justCollected ? (
                <div className="w-full py-3 bg-[#d0f0e0] text-[#1a7a44] font-bold rounded-xl text-center text-sm">
                  ✓ Печенька в профиле!
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCollect}
                  className="w-full py-3 bg-[#1a7a44] text-white font-bold rounded-xl text-sm min-h-[44px]"
                >
                  Забрать печеньку 🍪
                </motion.button>
              )}

              {/* Confetti on collect */}
              {justCollected && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const colors = ["#1a7a44", "#3ecf82", "#d42b4f", "#f59e0b", "#FAC775", "#faeeda"];
                    const color = colors[i % colors.length];
                    const left = Math.random() * 100;
                    const delay = Math.random() * 0.5;
                    const size = 4 + Math.random() * 6;
                    return (
                      <motion.div
                        key={i}
                        initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
                        animate={{ y: 400, x: (Math.random() - 0.5) * 200, opacity: 0, rotate: Math.random() * 720 }}
                        transition={{ duration: 1.2 + Math.random(), delay, ease: "easeIn" }}
                        className="absolute rounded-sm"
                        style={{ left: `${left}%`, top: 0, width: size, height: size, backgroundColor: color }}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
