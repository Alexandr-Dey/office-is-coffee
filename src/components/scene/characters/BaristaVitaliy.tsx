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

export function BaristaVitaliy({ orderStatus, streakDays, lastOrderDate }: Props) {
  const [currentAction, setCurrentAction] = useState(VITALIY_IDLE_ACTIONS[0].id);
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

  // Tap easter egg: 8 taps
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

  // Tap reset timer
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
          x="240" y="350" width="30" height="15" fill={APRON} rx="2"
          initial={{ rotate: 0, y: 300 }}
          animate={{ rotate: 20, y: 350 }}
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
      transform="translate(280, 360)"
    >
      <VitaliyBody action={isAngry ? "angry" : state === "idle" ? currentAction : state} isSad={isSad} />
      <text x="0" y="80" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontWeight="bold">
        {"Виталий"}
      </text>
    </motion.g>
  );
}

function VitaliyBody({ action, isSad }: { action: string; isSad: boolean }) {
  // Body/shirt
  const bodyEl = <ellipse cx="0" cy="48" rx="16" ry="18" fill="#F0F0F0" />;
  // Apron
  const apronEl = (
    <>
      <rect x="-12" y="34" width="24" height="30" fill={APRON} rx="2" />
      <rect x="-12" y="32" width="4" height="5" fill={APRON} opacity="0.7" />
      <rect x="8" y="32" width="4" height="5" fill={APRON} opacity="0.7" />
      <text x="0" y="52" textAnchor="middle" fill="#FFD700" fontSize="7" fontWeight="bold">LiC</text>
    </>
  );

  // Arms depend on action
  const renderArms = () => {
    switch (action) {
      case "wipe_counter":
        return (
          <>
            <motion.g animate={{ x: [-4, 4, -4] }} transition={{ duration: 1, repeat: Infinity }}>
              <rect x="-22" y="42" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="-25" y="58" width="12" height="4" fill="#bbb" rx="1" />
            </motion.g>
            <rect x="14" y="40" width="8" height="16" fill={SKIN} rx="3" />
          </>
        );
      case "check_machine":
        return (
          <>
            <motion.rect x="-22" y="36" width="8" height="18" fill={SKIN} rx="3"
              animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <rect x="14" y="38" width="8" height="16" fill={SKIN} rx="3" />
          </>
        );
      case "adjust_apron":
        return (
          <>
            <motion.rect x="-14" y="34" width="6" height="14" fill={SKIN} rx="2"
              animate={{ y: [34, 32, 34] }} transition={{ duration: 0.8, repeat: 1 }} />
            <motion.rect x="8" y="34" width="6" height="14" fill={SKIN} rx="2"
              animate={{ y: [34, 32, 34] }} transition={{ duration: 0.8, repeat: 1, delay: 0.2 }} />
          </>
        );
      case "stretch_back":
        return (
          <>
            <motion.rect x="-20" y="30" width="8" height="16" fill={SKIN} rx="3"
              animate={{ rotate: [0, -15, 0] }} transition={{ duration: 1.5, repeat: 1 }} />
            <motion.rect x="12" y="30" width="8" height="16" fill={SKIN} rx="3"
              animate={{ rotate: [0, 15, 0] }} transition={{ duration: 1.5, repeat: 1 }} />
          </>
        );
      case "polish_cup":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 0.6, repeat: Infinity }}>
              <rect x="14" y="38" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="16" y="54" width="6" height="8" fill="#fff" rx="1" />
            </motion.g>
          </>
        );
      case "check_phone":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: 1 }}>
              <rect x="14" y="36" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="15" y="52" width="8" height="12" fill="#333" rx="1" />
              <rect x="16" y="53" width="6" height="9" fill="#4488ff" rx="0.5" />
            </motion.g>
          </>
        );
      case "organize_cups":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ x: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <rect x="14" y="38" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="18" y="54" width="6" height="10" fill="#d42b4f" rx="1" />
            </motion.g>
          </>
        );
      case "look_at_clock":
        return (
          <>
            <motion.g animate={{ rotate: [0, -20, -20, 0] }} transition={{ duration: 2, repeat: 1 }}>
              <rect x="-22" y="38" width="8" height="16" fill={SKIN} rx="3" />
              <circle cx="-20" cy="38" r="4" fill="none" stroke="#c0c0c0" strokeWidth="1.5" />
              <circle cx="-20" cy="38" r="1" fill="#333" />
            </motion.g>
            <rect x="14" y="40" width="8" height="16" fill={SKIN} rx="3" />
          </>
        );
      case "tap_rhythm":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ y: [0, -3, 0, -3, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
              <rect x="14" y="42" width="8" height="14" fill={SKIN} rx="3" />
            </motion.g>
          </>
        );
      case "accepted":
        return (
          <>
            <motion.rect x="-22" y="36" width="8" height="18" fill={SKIN} rx="3"
              animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <rect x="14" y="38" width="8" height="16" fill={SKIN} rx="3" />
          </>
        );
      case "pending":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <rect x="14" y="40" width="8" height="16" fill={SKIN} rx="3" />
          </>
        );
      case "ready":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <rect x="14" y="40" width="8" height="16" fill={SKIN} rx="3" />
          </>
        );
      default:
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <rect x="14" y="40" width="8" height="16" fill={SKIN} rx="3" />
          </>
        );
    }
  };

  return (
    <g>
      {bodyEl}
      {apronEl}
      {renderArms()}

      {/* Neck */}
      <rect x="-4" y="20" width="8" height="8" fill={SKIN} />

      {/* Head */}
      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="0" cy="10" rx="14" ry="15" fill={SKIN} />
        <ellipse cx="2" cy="13" rx="10" ry="8" fill={SKIN_SHADOW} opacity="0.12" />

        {/* Hair */}
        <ellipse cx="0" cy="0" rx="13" ry="8" fill={HAIR} />
        <ellipse cx="8" cy="3" rx="5" ry="4" fill={HAIR} />

        {/* Ears */}
        <ellipse cx="-13" cy="10" rx="3" ry="4.5" fill={SKIN_SHADOW} />
        <ellipse cx="13" cy="10" rx="3" ry="4.5" fill={SKIN_SHADOW} />

        {/* Face */}
        {action === "angry" ? (
          <g>
            <line x1="-8" y1="4" x2="-3" y2="7" stroke="#222" strokeWidth="2" />
            <line x1="8" y1="4" x2="3" y2="7" stroke="#222" strokeWidth="2" />
            <rect x="-6" y="9" width="5" height="3" fill="#222" rx="1" />
            <rect x="1" y="9" width="5" height="3" fill="#222" rx="1" />
            <path d="M-4,19 Q0,16 4,19" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
            <ellipse cx="0" cy="10" rx="12" ry="13" fill="rgba(255,0,0,0.08)" />
          </g>
        ) : isSad ? (
          <g>
            <circle cx="-5" cy="9" r="3" fill="#FFF" />
            <circle cx="5" cy="9" r="3" fill="#FFF" />
            <circle cx="-6" cy="9.5" r="1.5" fill="#2A1810" />
            <circle cx="4" cy="9.5" r="1.5" fill="#2A1810" />
            <line x1="-8" y1="4" x2="-3" y2="5.5" stroke={HAIR} strokeWidth="1" />
            <line x1="3" y1="5.5" x2="8" y2="4" stroke={HAIR} strokeWidth="1" />
            <path d="M-4,19 Q0,16 4,19" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
            {/* Thought bubble */}
            <circle cx="-20" cy="-10" r="3" fill="rgba(255,255,255,0.5)" />
            <circle cx="-26" cy="-18" r="4" fill="rgba(255,255,255,0.5)" />
            <circle cx="-30" cy="-28" r="7" fill="rgba(255,255,255,0.6)" />
            <text x="-30" y="-25" textAnchor="middle" fill="#666" fontSize="10">?</text>
            {/* Sigh animation */}
            <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <rect x="-10" y="24" width="20" height="10" fill="transparent" />
            </motion.g>
          </g>
        ) : (
          <g>
            <circle cx="-5" cy="9" r="3" fill="#FFF" />
            <circle cx="5" cy="9" r="3" fill="#FFF" />
            <circle cx="-5" cy="9.5" r="2" fill="#2A1810" />
            <circle cx="5" cy="9.5" r="2" fill="#2A1810" />
            <circle cx="-4.3" cy="8.5" r="0.7" fill="#FFF" />
            <circle cx="5.7" cy="8.5" r="0.7" fill="#FFF" />
            <path d="M-7,4 Q-4,2 -1,4" stroke={HAIR} strokeWidth="1.2" fill="none" />
            <path d="M1,4 Q4,2 7,4" stroke={HAIR} strokeWidth="1.2" fill="none" />
            <path d="M0,12 Q2,14 0,14.5" stroke="rgba(150,100,70,0.3)" strokeWidth="1" fill="none" />
            <path d="M-4,18 Q0,21 4,18" stroke="#6B3E26" strokeWidth="1.5" fill="none" />
          </g>
        )}
      </motion.g>
    </g>
  );
}
