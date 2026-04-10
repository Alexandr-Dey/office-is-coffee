"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VITALIY_IDLE_ACTIONS, pickWeightedRandom } from "../behaviors/baristaIdleActions";
import { daysSinceOrder } from "../behaviors/sceneTime";
import { doc, setDoc, increment } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

interface Props {
  orderStatus: string;
  streakDays: number;
  lastOrderDate: string | null;
}

const SKIN = "#e8b88a";
const SKIN_SHADOW = "#d4a574";
const HAIR = "#2c1810";
const APRON = "#2980b9";

// Vitaliy's spots — interleaved with Aslan's to avoid overlap
const SPOTS = [200, 320, 440, 560, 680];

function pickSpot(current: number): number {
  const others = SPOTS.filter(s => Math.abs(s - current) > 60);
  return others[Math.floor(Math.random() * others.length)] ?? SPOTS[0];
}

export function BaristaVitaliy({ orderStatus, streakDays, lastOrderDate }: Props) {
  const [currentAction, setCurrentAction] = useState(VITALIY_IDLE_ACTIONS[0].id);
  const [posX, setPosX] = useState(320);
  const [tapCount, setTapCount] = useState(0);
  const [isAngry, setIsAngry] = useState(false);
  const [isGone, setIsGone] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);

  const isSad = streakDays === 0 && daysSinceOrder(lastOrderDate) >= 2;
  const state = isSad ? "sad" : orderStatus;
  const canMove = state === "idle" || state === "sad";

  // Idle action cycle
  useEffect(() => {
    if (!canMove) return;
    let timeout: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const next = pickWeightedRandom(VITALIY_IDLE_ACTIONS);
      setCurrentAction(next.id);
      timeout = setTimeout(cycle, next.duration + 500);
    };
    timeout = setTimeout(cycle, 2000);
    return () => clearTimeout(timeout);
  }, [canMove]);

  // Random movement — works in idle AND sad
  useEffect(() => {
    if (!canMove) return;
    let timeout: ReturnType<typeof setTimeout>;
    const move = () => {
      setPosX(prev => pickSpot(prev));
      timeout = setTimeout(move, 6000 + Math.random() * 3000);
    };
    timeout = setTimeout(move, 2000 + Math.random() * 2000);
    return () => clearTimeout(timeout);
  }, [canMove]);

  useEffect(() => {
    if (state === "accepted") setPosX(320);
    if (state === "ready") setPosX(440);
  }, [state]);

  useEffect(() => {
    if (tapCount >= 8 && !isAngry && !isGone) {
      setIsAngry(true);
      const t1 = setTimeout(() => {
        setIsAngry(false);
        setIsGone(true);
        const t2 = setTimeout(() => { setIsGone(false); setTapCount(0); }, 30000);
        return () => clearTimeout(t2);
      }, 2000);
      return () => clearTimeout(t1);
    }
  }, [tapCount, isAngry, isGone]);

  useEffect(() => {
    if (tapCount > 0 && tapCount < 8) {
      const t = setTimeout(() => setTapCount(0), 10000);
      return () => clearTimeout(t);
    }
  }, [tapCount]);

  const handleTap = useCallback(() => {
    setTapCount(p => p + 1);
    // Floating heart
    setHearts(prev => [...prev, Date.now()]);
    // Save to Firestore
    const today = new Date().toISOString().slice(0, 10);
    setDoc(doc(getFirebaseDb(), "barista_hearts", `vitaliy_${today}`), {
      baristaName: "Виталий",
      date: today,
      count: increment(1),
    }, { merge: true }).catch(() => {});
  }, []);

  if (isGone) {
    return (
      <g id="vitaliy-gone">
        <rect x="370" y="310" width="30" height="15" fill={APRON} rx="2" opacity="0.5" />
      </g>
    );
  }

  return (
    <g
      id="barista-vitaliy"
      onClick={handleTap}
      style={{ cursor: "pointer", transition: "transform 2s ease-in-out" }}
      transform={`translate(${posX}, 275)`}
    >
      <text x="0" y="-18" textAnchor="middle" fill="#2980b9" fontSize="9" fontWeight="bold" opacity="0.7">
        Виталий
      </text>
      <VitaliyBody action={isAngry ? "angry" : canMove ? currentAction : state} isSad={isSad} />
      {/* Floating hearts */}
      <AnimatePresence>
        {hearts.map((id) => (
          <motion.text
            key={id}
            x={-5 + Math.random() * 10}
            y={-25}
            fontSize="20"
            textAnchor="middle"
            initial={{ opacity: 1, y: -25, scale: 0.5 }}
            animate={{ opacity: 0, y: -70, scale: 1.3, x: -10 + Math.random() * 20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            onAnimationComplete={() => setHearts(prev => prev.filter(h => h !== id))}
            style={{ pointerEvents: "none" }}
          >
            ❤️
          </motion.text>
        ))}
      </AnimatePresence>
    </g>
  );
}

function VitaliyBody({ action, isSad }: { action: string; isSad: boolean }) {
  const bodyEl = <ellipse cx="0" cy="52" rx="18" ry="20" fill="#f5f0e8" />;
  const apronEl = (
    <>
      <rect x="-14" y="36" width="28" height="34" fill={APRON} rx="3" />
      <rect x="-14" y="30" width="5" height="8" fill={APRON} opacity="0.8" rx="1" />
      <rect x="9" y="30" width="5" height="8" fill={APRON} opacity="0.8" rx="1" />
      <rect x="-8" y="44" width="16" height="10" fill="#1a5276" rx="2" opacity="0.5" />
      <text x="0" y="52" textAnchor="middle" fill="#FFD700" fontSize="7" fontWeight="bold">LiC</text>
    </>
  );

  const renderArms = () => {
    switch (action) {
      case "wipe_counter":
        return (
          <>
            <motion.g animate={{ x: [-5, 5, -5] }} transition={{ duration: 1, repeat: Infinity }}>
              <rect x="-26" y="44" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="-28" y="62" width="14" height="5" fill="#bbb" rx="1" />
            </motion.g>
            <rect x="16" y="42" width="10" height="18" fill={SKIN} rx="4" />
          </>
        );
      case "check_machine":
        return (
          <>
            <motion.rect x="-26" y="38" width="10" height="20" fill={SKIN} rx="4"
              animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <rect x="16" y="40" width="10" height="18" fill={SKIN} rx="4" />
          </>
        );
      case "polish_cup":
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <motion.g animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 0.6, repeat: Infinity }}>
              <rect x="16" y="40" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="18" y="58" width="8" height="10" fill="#fff" rx="1" />
            </motion.g>
          </>
        );
      case "check_phone":
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <rect x="16" y="38" width="10" height="18" fill={SKIN} rx="4" />
            <rect x="17" y="56" width="10" height="14" fill="#333" rx="2" />
            <rect x="18" y="57" width="8" height="11" fill="#4488ff" rx="1" />
          </>
        );
      case "tap_rhythm":
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <motion.g animate={{ y: [0, -4, 0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
              <rect x="16" y="44" width="10" height="16" fill={SKIN} rx="4" />
            </motion.g>
          </>
        );
      case "accepted":
        return (
          <>
            <motion.rect x="-26" y="38" width="10" height="20" fill={SKIN} rx="4"
              animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <rect x="16" y="40" width="10" height="18" fill={SKIN} rx="4" />
          </>
        );
      default:
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <rect x="16" y="42" width="10" height="18" fill={SKIN} rx="4" />
          </>
        );
    }
  };

  return (
    <g>
      {bodyEl}
      {apronEl}
      {renderArms()}
      <rect x="-5" y="20" width="10" height="10" fill={SKIN} />
      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="0" cy="10" rx="16" ry="16" fill={SKIN} />
        <ellipse cx="2" cy="14" rx="11" ry="9" fill={SKIN_SHADOW} opacity="0.1" />
        <ellipse cx="0" cy="-1" rx="15" ry="9" fill={HAIR} />
        <ellipse cx="9" cy="2" rx="6" ry="5" fill={HAIR} />
        <ellipse cx="-8" cy="3" rx="4" ry="3" fill={HAIR} />
        <ellipse cx="-15" cy="10" rx="4" ry="5" fill={SKIN_SHADOW} />
        <ellipse cx="15" cy="10" rx="4" ry="5" fill={SKIN_SHADOW} />
        {isSad ? (
          <g>
            <circle cx="-6" cy="9" r="3.5" fill="#FFF" />
            <circle cx="6" cy="9" r="3.5" fill="#FFF" />
            <circle cx="-7" cy="10" r="1.8" fill="#2A1810" />
            <circle cx="5" cy="10" r="1.8" fill="#2A1810" />
            <path d="M-5,20 Q0,17 5,20" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
          </g>
        ) : action === "angry" ? (
          <g>
            <line x1="-9" y1="4" x2="-3" y2="7" stroke="#222" strokeWidth="2" />
            <line x1="9" y1="4" x2="3" y2="7" stroke="#222" strokeWidth="2" />
            <rect x="-7" y="9" width="5" height="3.5" fill="#222" rx="1" />
            <rect x="2" y="9" width="5" height="3.5" fill="#222" rx="1" />
            <path d="M-5,20 Q0,17 5,20" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
          </g>
        ) : (
          <g>
            <circle cx="-6" cy="9" r="3.5" fill="#FFF" />
            <circle cx="6" cy="9" r="3.5" fill="#FFF" />
            <circle cx="-6" cy="10" r="2.2" fill="#2A1810" />
            <circle cx="6" cy="10" r="2.2" fill="#2A1810" />
            <circle cx="-5" cy="8.5" r="0.8" fill="#FFF" />
            <circle cx="7" cy="8.5" r="0.8" fill="#FFF" />
            <path d="M-9,4 Q-5,2 -2,4" stroke={HAIR} strokeWidth="1.3" fill="none" />
            <path d="M2,4 Q5,2 9,4" stroke={HAIR} strokeWidth="1.3" fill="none" />
            <path d="M-5,19 Q0,22 5,19" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
          </g>
        )}
      </motion.g>
    </g>
  );
}
