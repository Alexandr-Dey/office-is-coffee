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

export function BaristaAslan({ orderStatus }: Props) {
  const [currentAction, setCurrentAction] = useState(ASLAN_IDLE_ACTIONS[0].id);
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

  // Tap easter egg: 5 taps -> flip
  useEffect(() => {
    if (tapCount >= 5 && !isFlipping) {
      setIsFlipping(true);
      const t = setTimeout(() => { setIsFlipping(false); setTapCount(0); }, 3000);
      return () => clearTimeout(t);
    }
  }, [tapCount, isFlipping]);

  // Tap reset timer
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
      transform="translate(500, 360)"
      animate={isFlipping ? { rotate: [0, 360], y: [0, -40, 0] } : {}}
      transition={isFlipping ? { duration: 1.5, ease: "easeInOut" } : {}}
    >
      <AslanBody action={state === "idle" ? currentAction : state} isWaving={state === "ready"} />
      <text x="0" y="80" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontWeight="bold">
        {"Аслан"}
      </text>
    </motion.g>
  );
}

function AslanBody({ action, isWaving }: { action: string; isWaving: boolean }) {
  // Body
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

  const renderArms = () => {
    if (isWaving) {
      return (
        <>
          <rect x="-22" y="38" width="8" height="14" fill={SKIN} rx="3" />
          <rect x="-20" y="40" width="10" height="12" fill="#d42b4f" rx="1" />
          <rect x="-19" y="42" width="7" height="2" fill="#fff" opacity="0.7" />
          <motion.rect x="14" y="28" width="8" height="16" fill={SKIN} rx="3"
            animate={{ rotate: [-20, 20, -20] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ transformOrigin: "18px 44px" }} />
        </>
      );
    }

    switch (action) {
      case "juggle_cup":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ y: [0, -20, 0] }} transition={{ duration: 1, repeat: Infinity }}>
              <rect x="14" y="36" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="16" y="20" width="8" height="12" fill="#d42b4f" rx="1" />
            </motion.g>
          </>
        );
      case "dance_move":
        return (
          <>
            <motion.rect x="-22" y="36" width="8" height="16" fill={SKIN} rx="3"
              animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 0.6, repeat: Infinity }} />
            <motion.rect x="14" y="36" width="8" height="16" fill={SKIN} rx="3"
              animate={{ rotate: [10, -10, 10] }} transition={{ duration: 0.6, repeat: Infinity }} />
          </>
        );
      case "check_phone":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 1.5, repeat: 1 }}>
              <rect x="14" y="36" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="15" y="52" width="8" height="12" fill="#333" rx="1" />
              <rect x="16" y="53" width="6" height="9" fill="#4488ff" rx="0.5" />
            </motion.g>
          </>
        );
      case "laugh":
        return (
          <>
            <motion.rect x="-22" y="38" width="8" height="16" fill={SKIN} rx="3"
              animate={{ y: [38, 36, 38] }} transition={{ duration: 0.4, repeat: 3 }} />
            <motion.rect x="14" y="38" width="8" height="16" fill={SKIN} rx="3"
              animate={{ y: [38, 36, 38] }} transition={{ duration: 0.4, repeat: 3, delay: 0.1 }} />
          </>
        );
      case "stretch_arms":
        return (
          <>
            <motion.rect x="-26" y="38" width="8" height="16" fill={SKIN} rx="3"
              animate={{ x: [-26, -32, -26] }} transition={{ duration: 1.5, repeat: 1 }} />
            <motion.rect x="18" y="38" width="8" height="16" fill={SKIN} rx="3"
              animate={{ x: [18, 24, 18] }} transition={{ duration: 1.5, repeat: 1 }} />
          </>
        );
      case "wipe_cup":
        return (
          <>
            <rect x="-22" y="38" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <rect x="14" y="38" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="16" y="54" width="8" height="10" fill="#fff" rx="1" />
            </motion.g>
          </>
        );
      case "pose":
        return (
          <>
            <rect x="-18" y="40" width="8" height="14" fill={SKIN} rx="3" />
            <rect x="10" y="40" width="8" height="14" fill={SKIN} rx="3" />
          </>
        );
      case "air_drums":
        return (
          <>
            <motion.rect x="-22" y="40" width="8" height="14" fill={SKIN} rx="3"
              animate={{ y: [40, 36, 40] }} transition={{ duration: 0.3, repeat: Infinity }} />
            <motion.rect x="14" y="40" width="8" height="14" fill={SKIN} rx="3"
              animate={{ y: [40, 36, 40] }} transition={{ duration: 0.3, repeat: Infinity, delay: 0.15 }} />
          </>
        );
      case "write_on_cup":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <rect x="14" y="38" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="18" y="54" width="3" height="7" fill="#333" />
            </motion.g>
          </>
        );
      case "accepted":
        return (
          <>
            <rect x="-22" y="40" width="8" height="16" fill={SKIN} rx="3" />
            <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <rect x="14" y="38" width="8" height="16" fill={SKIN} rx="3" />
              <rect x="18" y="54" width="3" height="7" fill="#333" />
            </motion.g>
          </>
        );
      case "pending":
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
      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="0" cy="10" rx="14" ry="15" fill={SKIN} />
        <ellipse cx="2" cy="13" rx="10" ry="8" fill={SKIN_SHADOW} opacity="0.12" />

        {/* Hair */}
        <ellipse cx="0" cy="0" rx="13" ry="7" fill={HAIR} />
        <ellipse cx="-6" cy="2" rx="6" ry="4" fill={HAIR} />

        {/* Ears */}
        <ellipse cx="-13" cy="10" rx="3" ry="4.5" fill={SKIN_SHADOW} />
        <ellipse cx="13" cy="10" rx="3" ry="4.5" fill={SKIN_SHADOW} />
        {/* Bracelet */}
        <rect x="14" y="42" width="6" height="2" fill="#e8b88a" rx="1" opacity="0.6" />

        {/* Face */}
        {action === "laugh" ? (
          <g>
            <path d="M-6,7 Q-4,5 -2,7" stroke={HAIR} strokeWidth="1" fill="none" />
            <path d="M2,7 Q4,5 6,7" stroke={HAIR} strokeWidth="1" fill="none" />
            <ellipse cx="0" cy="18" rx="4" ry="4" fill="#6B3E26" />
            <circle cx="-5" cy="9" r="2" fill="#FFF" />
            <circle cx="5" cy="9" r="2" fill="#FFF" />
            <circle cx="-5" cy="9.5" r="1.2" fill="#2A1810" />
            <circle cx="5" cy="9.5" r="1.2" fill="#2A1810" />
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
