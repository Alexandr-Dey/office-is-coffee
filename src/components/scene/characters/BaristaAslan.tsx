"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ASLAN_IDLE_ACTIONS, pickWeightedRandom } from "../behaviors/baristaIdleActions";

interface Props {
  orderStatus: string;
}

const SKIN = "#d4a574";
const SKIN_SHADOW = "#b8956a";
const HAIR = "#1a1a1a";
const APRON = "#27ae60";

// Aslan prefers right side (pickup), but roams everywhere
// Keep baristas centered behind the counter (center = x:400)
const ASLAN_SPOTS = [
  { x: 340, weight: 10 },
  { x: 380, weight: 20 },
  { x: 420, weight: 25 },
  { x: 460, weight: 30 },
  { x: 500, weight: 15 },
];

function pickSpot(spots: typeof ASLAN_SPOTS, currentX: number): number {
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

export function BaristaAslan({ orderStatus }: Props) {
  const [currentAction, setCurrentAction] = useState(ASLAN_IDLE_ACTIONS[0].id);
  const [posX, setPosX] = useState(450);
  const [tapCount, setTapCount] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const state = orderStatus;

  // Idle action cycle
  useEffect(() => {
    if (state !== "idle") return;
    let timeout: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const next = pickWeightedRandom(ASLAN_IDLE_ACTIONS);
      setCurrentAction(next.id);
      timeout = setTimeout(cycle, next.duration + 500);
    };
    timeout = setTimeout(cycle, 3000);
    return () => clearTimeout(timeout);
  }, [state]);

  // Random movement cycle
  useEffect(() => {
    if (state !== "idle") return;
    let timeout: ReturnType<typeof setTimeout>;
    const move = () => {
      setPosX(prev => pickSpot(ASLAN_SPOTS, prev));
      timeout = setTimeout(move, 7000 + Math.random() * 8000); // 7-15s
    };
    timeout = setTimeout(move, 3000 + Math.random() * 4000);
    return () => clearTimeout(timeout);
  }, [state]);

  // Order-specific positions
  useEffect(() => {
    if (state === "accepted") setPosX(460);
    if (state === "ready") setPosX(460);
  }, [state]);

  useEffect(() => {
    if (tapCount >= 5 && !isFlipping) {
      setIsFlipping(true);
      const t = setTimeout(() => { setIsFlipping(false); setTapCount(0); }, 3000);
      return () => clearTimeout(t);
    }
  }, [tapCount, isFlipping]);

  useEffect(() => {
    if (tapCount > 0 && tapCount < 5) {
      const t = setTimeout(() => setTapCount(0), 10000);
      return () => clearTimeout(t);
    }
  }, [tapCount]);

  const handleTap = useCallback(() => {
    setTapCount(p => p + 1);
  }, []);

  return (
    <motion.g
      id="barista-aslan"
      onClick={handleTap}
      style={{ cursor: "pointer" }}
      initial={{ x: posX, y: 275 }}
      animate={{
        x: posX,
        y: 275,
        ...(isFlipping ? { rotate: [0, 360] } : {}),
      }}
      transition={
        isFlipping
          ? { duration: 1.5, ease: "easeInOut" }
          : { type: "spring", stiffness: 40, damping: 15, mass: 1 }
      }
    >
      <g>
        {/* Name above head */}
        <text x="0" y="-18" textAnchor="middle" fill="#27ae60" fontSize="9" fontWeight="bold" opacity="0.7">
          Аслан
        </text>
        <AslanBody action={state === "idle" ? currentAction : state} isWaving={state === "ready"} />
      </g>
    </motion.g>
  );
}

function AslanBody({ action, isWaving }: { action: string; isWaving: boolean }) {
  const bodyEl = <ellipse cx="0" cy="52" rx="18" ry="20" fill="#f5f0e8" />;
  const apronEl = (
    <>
      <rect x="-14" y="36" width="28" height="34" fill={APRON} rx="3" />
      <rect x="-14" y="30" width="5" height="8" fill={APRON} opacity="0.8" rx="1" />
      <rect x="9" y="30" width="5" height="8" fill={APRON} opacity="0.8" rx="1" />
      <rect x="-8" y="44" width="16" height="10" fill="#1a7a44" rx="2" opacity="0.5" />
      <text x="0" y="52" textAnchor="middle" fill="#FFD700" fontSize="7" fontWeight="bold">LiC</text>
    </>
  );

  const renderArms = () => {
    if (isWaving) {
      return (
        <>
          <rect x="-26" y="40" width="10" height="16" fill={SKIN} rx="4" />
          <rect x="-24" y="42" width="12" height="14" fill="#d42b4f" rx="2" />
          <rect x="-23" y="44" width="9" height="2" fill="#fff" opacity="0.7" />
          <motion.rect x="16" y="30" width="10" height="18" fill={SKIN} rx="4"
            animate={{ rotate: [-20, 20, -20] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ transformOrigin: "21px 48px" }} />
        </>
      );
    }

    switch (action) {
      case "juggle_cup":
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <motion.g animate={{ y: [0, -22, 0] }} transition={{ duration: 1, repeat: Infinity }}>
              <rect x="16" y="38" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="18" y="22" width="10" height="14" fill="#d42b4f" rx="2" />
            </motion.g>
          </>
        );
      case "dance_move":
        return (
          <>
            <motion.rect x="-26" y="38" width="10" height="18" fill={SKIN} rx="4"
              animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 0.6, repeat: Infinity }} />
            <motion.rect x="16" y="38" width="10" height="18" fill={SKIN} rx="4"
              animate={{ rotate: [10, -10, 10] }} transition={{ duration: 0.6, repeat: Infinity }} />
          </>
        );
      case "check_phone":
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 1.5, repeat: 1 }}>
              <rect x="16" y="38" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="17" y="56" width="10" height="14" fill="#333" rx="2" />
              <rect x="18" y="57" width="8" height="11" fill="#4488ff" rx="1" />
            </motion.g>
          </>
        );
      case "laugh":
        return (
          <>
            <motion.rect x="-26" y="40" width="10" height="18" fill={SKIN} rx="4"
              animate={{ y: [40, 37, 40] }} transition={{ duration: 0.4, repeat: 3 }} />
            <motion.rect x="16" y="40" width="10" height="18" fill={SKIN} rx="4"
              animate={{ y: [40, 37, 40] }} transition={{ duration: 0.4, repeat: 3, delay: 0.1 }} />
          </>
        );
      case "stretch_arms":
        return (
          <>
            <motion.rect x="-30" y="40" width="10" height="18" fill={SKIN} rx="4"
              animate={{ x: [-30, -36, -30] }} transition={{ duration: 1.5, repeat: 1 }} />
            <motion.rect x="20" y="40" width="10" height="18" fill={SKIN} rx="4"
              animate={{ x: [20, 26, 20] }} transition={{ duration: 1.5, repeat: 1 }} />
          </>
        );
      case "wipe_cup":
        return (
          <>
            <rect x="-26" y="40" width="10" height="18" fill={SKIN} rx="4" />
            <motion.g animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <rect x="16" y="40" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="18" y="58" width="10" height="12" fill="#fff" rx="2" />
            </motion.g>
          </>
        );
      case "pose":
        return (
          <>
            <rect x="-20" y="42" width="10" height="16" fill={SKIN} rx="4" />
            <rect x="10" y="42" width="10" height="16" fill={SKIN} rx="4" />
          </>
        );
      case "air_drums":
        return (
          <>
            <motion.rect x="-26" y="42" width="10" height="16" fill={SKIN} rx="4"
              animate={{ y: [42, 38, 42] }} transition={{ duration: 0.3, repeat: Infinity }} />
            <motion.rect x="16" y="42" width="10" height="16" fill={SKIN} rx="4"
              animate={{ y: [42, 38, 42] }} transition={{ duration: 0.3, repeat: Infinity, delay: 0.15 }} />
          </>
        );
      case "write_on_cup":
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <rect x="16" y="40" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="20" y="58" width="4" height="8" fill="#333" rx="0.5" />
            </motion.g>
          </>
        );
      case "accepted":
        return (
          <>
            <rect x="-26" y="42" width="10" height="18" fill={SKIN} rx="4" />
            <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <rect x="16" y="40" width="10" height="18" fill={SKIN} rx="4" />
              <rect x="20" y="58" width="4" height="8" fill="#333" rx="0.5" />
            </motion.g>
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
      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="0" cy="10" rx="16" ry="16" fill={SKIN} />
        <ellipse cx="2" cy="14" rx="11" ry="9" fill={SKIN_SHADOW} opacity="0.1" />
        <ellipse cx="0" cy="-1" rx="15" ry="8" fill={HAIR} />
        <ellipse cx="-7" cy="2" rx="7" ry="5" fill={HAIR} />
        <ellipse cx="-15" cy="10" rx="4" ry="5" fill={SKIN_SHADOW} />
        <ellipse cx="15" cy="10" rx="4" ry="5" fill={SKIN_SHADOW} />
        <rect x="16" y="44" width="8" height="3" fill="#e8b88a" rx="1" opacity="0.5" />
        {action === "laugh" ? (
          <g>
            <path d="M-7,7 Q-5,5 -3,7" stroke={HAIR} strokeWidth="1" fill="none" />
            <path d="M3,7 Q5,5 7,7" stroke={HAIR} strokeWidth="1" fill="none" />
            <ellipse cx="0" cy="19" rx="5" ry="4.5" fill="#6B3E26" />
            <circle cx="-6" cy="9" r="2.5" fill="#FFF" />
            <circle cx="6" cy="9" r="2.5" fill="#FFF" />
            <circle cx="-6" cy="10" r="1.5" fill="#2A1810" />
            <circle cx="6" cy="10" r="1.5" fill="#2A1810" />
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
