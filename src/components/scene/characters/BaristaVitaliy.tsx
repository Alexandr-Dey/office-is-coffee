"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { VITALIY_IDLE_ACTIONS, pickWeightedRandom } from "../behaviors/baristaIdleActions";
import { daysSinceOrder } from "../behaviors/sceneTime";

interface Props {
  orderStatus: string;
  streakDays: number;
  lastOrderDate: string | null;
}

const SKIN = "#e8b88a";
const SKIN_SHADOW = "#d4a574";
const HAIR = "#2c1810";
const APRON = "#2980b9";

// Safe X positions behind the counter (between/beside objects)
// Counter: x=100..700. Objects block: machine 120-260, grinder 270-300, POS 365-405, cups 610-674
// Keep baristas centered behind the counter (center = x:400)
const VITALIY_SPOTS = [
  { x: 340, weight: 15 },
  { x: 380, weight: 30 },
  { x: 420, weight: 25 },
  { x: 460, weight: 20 },
  { x: 500, weight: 10 },
];

function pickSpot(spots: typeof VITALIY_SPOTS, currentX: number): number {
  const available = spots.filter(s => Math.abs(s.x - currentX) > 30);
  if (available.length === 0) return spots[0].x;
  const total = available.reduce((s, sp) => s + sp.weight, 0);
  let r = Math.random() * total;
  for (const sp of available) {
    r -= sp.weight;
    if (r <= 0) return sp.x;
  }
  return available[0].x;
}

export function BaristaVitaliy({ orderStatus, streakDays, lastOrderDate }: Props) {
  const [currentAction, setCurrentAction] = useState(VITALIY_IDLE_ACTIONS[0].id);
  const [posX, setPosX] = useState(380);
  const [tapCount, setTapCount] = useState(0);
  const [isAngry, setIsAngry] = useState(false);
  const [isGone, setIsGone] = useState(false);

  const isSad = streakDays === 0 && daysSinceOrder(lastOrderDate) >= 2;
  const state = isSad ? "sad" : orderStatus;

  // Idle action cycle
  useEffect(() => {
    if (state !== "idle") return;
    let timeout: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const next = pickWeightedRandom(VITALIY_IDLE_ACTIONS);
      setCurrentAction(next.id);
      timeout = setTimeout(cycle, next.duration + 500);
    };
    timeout = setTimeout(cycle, 2000);
    return () => clearTimeout(timeout);
  }, [state]);

  // Random movement cycle
  useEffect(() => {
    if (state !== "idle") return;
    let timeout: ReturnType<typeof setTimeout>;
    const move = () => {
      setPosX(prev => pickSpot(VITALIY_SPOTS, prev));
      timeout = setTimeout(move, 8000 + Math.random() * 7000); // 8-15s
    };
    timeout = setTimeout(move, 5000 + Math.random() * 5000);
    return () => clearTimeout(timeout);
  }, [state]);

  // When working on order, go to machine area
  useEffect(() => {
    if (state === "accepted") setPosX(380);
    if (state === "ready") setPosX(420);
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
  }, []);

  if (isGone) {
    return (
      <g id="vitaliy-gone">
        <motion.rect
          x="200" y="310" width="30" height="15" fill={APRON} rx="2"
          initial={{ rotate: 0, y: 280 }}
          animate={{ rotate: 20, y: 310 }}
          transition={{ type: "spring" }}
        />
      </g>
    );
  }

  return (
    <motion.g
      id="barista-vitaliy"
      onClick={handleTap}
      style={{ cursor: "pointer" }}
      initial={{ x: posX, y: 275 }}
      animate={{ x: posX, y: 275 }}
      transition={{ type: "spring", stiffness: 40, damping: 15, mass: 1 }}
    >
      <g>
        {/* Name above head */}
        <text x="0" y="-18" textAnchor="middle" fill="#2980b9" fontSize="9" fontWeight="bold" opacity="0.7">
          Виталий
        </text>
        <VitaliyBody action={isAngry ? "angry" : state === "idle" ? currentAction : state} isSad={isSad} />
      </g>
    </motion.g>
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
      case "adjust_apron":
        return (
          <>
            <motion.rect x="-16" y="36" width="8" height="16" fill={SKIN} rx="3"
              animate={{ y: [36, 33, 36] }} transition={{ duration: 0.8, repeat: 1 }} />
            <motion.rect x="8" y="36" width="8" height="16" fill={SKIN} rx="3"
              animate={{ y: [36, 33, 36] }} transition={{ duration: 0.8, repeat: 1, delay: 0.2 }} />
          </>
        );
      case "stretch_back":
        return (
          <>
            <motion.rect x="-24" y="32" width="10" height="18" fill={SKIN} rx="4"
              animate={{ rotate: [0, -15, 0] }} transition={{ duration: 1.5, repeat: 1 }} />
            <motion.rect x="14" y="32" width="10" height="18" fill={SKIN} rx="4"
              animate={{ rotate: [0, 15, 0] }} transition={{ duration: 1.5, repeat: 1 }} />
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
            <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: 1 }}>
              <rect x="16" y="38" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="17" y="56" width="10" height="14" fill="#333" rx="2" />
              <rect x="18" y="57" width="8" height="11" fill="#4488ff" rx="1" />
            </motion.g>
          </>
        );
      case "organize_cups":
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <motion.g animate={{ x: [0, 8, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <rect x="16" y="40" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="20" y="58" width="8" height="12" fill="#d42b4f" rx="2" />
            </motion.g>
          </>
        );
      case "look_at_clock":
        return (
          <>
            <motion.g animate={{ rotate: [0, -20, -20, 0] }} transition={{ duration: 2, repeat: 1 }}>
              <rect x="-26" y="40" width="10" height="18" fill={SKIN} rx="4" />
              <circle cx="-24" cy="40" r="5" fill="none" stroke="#c0c0c0" strokeWidth="1.5" />
              <circle cx="-24" cy="40" r="1.5" fill="#333" />
            </motion.g>
            <rect x="16" y="42" width="10" height="18" fill={SKIN} rx="4" />
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
        {action === "angry" ? (
          <g>
            <line x1="-9" y1="4" x2="-3" y2="7" stroke="#222" strokeWidth="2" />
            <line x1="9" y1="4" x2="3" y2="7" stroke="#222" strokeWidth="2" />
            <rect x="-7" y="9" width="5" height="3.5" fill="#222" rx="1" />
            <rect x="2" y="9" width="5" height="3.5" fill="#222" rx="1" />
            <path d="M-5,20 Q0,17 5,20" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
            <ellipse cx="0" cy="10" rx="14" ry="14" fill="rgba(255,0,0,0.08)" />
          </g>
        ) : isSad ? (
          <g>
            <circle cx="-6" cy="9" r="3.5" fill="#FFF" />
            <circle cx="6" cy="9" r="3.5" fill="#FFF" />
            <circle cx="-7" cy="10" r="1.8" fill="#2A1810" />
            <circle cx="5" cy="10" r="1.8" fill="#2A1810" />
            <line x1="-9" y1="4" x2="-3" y2="6" stroke={HAIR} strokeWidth="1" />
            <line x1="3" y1="6" x2="9" y2="4" stroke={HAIR} strokeWidth="1" />
            <path d="M-5,20 Q0,17 5,20" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
            <circle cx="-22" cy="-10" r="3" fill="rgba(255,255,255,0.5)" />
            <circle cx="-28" cy="-18" r="4" fill="rgba(255,255,255,0.5)" />
            <circle cx="-32" cy="-28" r="7" fill="rgba(255,255,255,0.6)" />
            <text x="-32" y="-25" textAnchor="middle" fill="#666" fontSize="10">?</text>
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
            <path d="M0,12 Q2,15 0,15.5" stroke="rgba(150,100,70,0.3)" strokeWidth="1" fill="none" />
            <path d="M-5,19 Q0,22 5,19" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
          </g>
        )}
      </motion.g>
    </g>
  );
}
