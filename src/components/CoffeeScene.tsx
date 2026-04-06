"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type BaristaState = "idle" | "pending" | "accepted" | "ready";

interface CoffeeSceneProps {
  orderStatus?: BaristaState;
  streakDays?: number;
  lastOrderDate?: string | null;
  orderCount?: number;
}

/* ═══ HELPERS ═══ */
function daysSinceOrder(lastDate: string | null): number {
  if (!lastDate) return 999;
  const now = new Date();
  const last = new Date(lastDate + "T00:00:00+05:00");
  return Math.floor((now.getTime() - last.getTime()) / 86400000);
}

/* ═══ PIXEL RECT HELPER ═══ */
function P({ x, y, w = 1, h = 1, c, s = 4 }: { x: number; y: number; w?: number; h?: number; c: string; s?: number }) {
  return <rect x={x * s} y={y * s} width={w * s} height={h * s} fill={c} />;
}

/* ═══ BACKGROUND ═══ */
function Background() {
  return (
    <g id="background">
      {/* Red wall - left third */}
      <rect x="0" y="0" width="130" height="220" fill="#c0392b" />
      {/* Shadow on red wall */}
      <rect x="120" y="0" width="10" height="220" fill="#a93226" />
      {/* Light wall - right two thirds */}
      <rect x="130" y="0" width="260" height="220" fill="#f5f0e8" />
      {/* Subtle shadow on light wall */}
      <rect x="130" y="0" width="6" height="220" fill="#e8e0d0" />
      {/* Floor */}
      <rect x="0" y="210" width="390" height="10" fill="#DDD5C8" />
    </g>
  );
}

/* ═══ LOGO ON RED WALL ═══ */
function Logo() {
  return (
    <g id="logo" transform="translate(65, 30)">
      {/* Heart shape with pixels */}
      {/* Top row */}
      <P x={-2} y={0} c="#fff" /><P x={-1} y={0} c="#fff" />
      <P x={1} y={0} c="#fff" /><P x={2} y={0} c="#fff" />
      {/* Second row */}
      <P x={-3} y={1} c="#fff" /><P x={-2} y={1} c="#fff" /><P x={-1} y={1} c="#fff" />
      <P x={0} y={1} c="#fff" />
      <P x={1} y={1} c="#fff" /><P x={2} y={1} c="#fff" /><P x={3} y={1} c="#fff" />
      {/* Third row */}
      <P x={-3} y={2} c="#fff" /><P x={-2} y={2} c="#fff" /><P x={-1} y={2} c="#fff" />
      <P x={0} y={2} c="#fff" />
      <P x={1} y={2} c="#fff" /><P x={2} y={2} c="#fff" /><P x={3} y={2} c="#fff" />
      {/* Fourth row */}
      <P x={-2} y={3} c="#fff" /><P x={-1} y={3} c="#fff" /><P x={0} y={3} c="#fff" />
      <P x={1} y={3} c="#fff" /><P x={2} y={3} c="#fff" />
      {/* Fifth row */}
      <P x={-1} y={4} c="#fff" /><P x={0} y={4} c="#fff" /><P x={1} y={4} c="#fff" />
      {/* Bottom */}
      <P x={0} y={5} c="#fff" />
      {/* Coffee beans inside heart */}
      <P x={-1} y={2} c="#5C2E0E" s={2} /><P x={1} y={2} c="#5C2E0E" s={2} />
      <P x={0} y={3} c="#5C2E0E" s={2} />
      {/* Text LOVE IS */}
      <text x="0" y="38" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">LOVE IS</text>
      <text x="0" y="48" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">COFFEE</text>
    </g>
  );
}

/* ═══ MENU BOARDS ═══ */
function MenuBoards() {
  const boards = [
    { x: 145, lines: [40, 35, 45, 30] },
    { x: 225, lines: [35, 45, 30, 40] },
    { x: 305, lines: [45, 30, 35, 45] },
  ];
  return (
    <g id="menu-boards">
      {boards.map((b, bi) => (
        <g key={bi}>
          {/* Frame */}
          <rect x={b.x} y="12" width="65" height="55" fill="none" stroke="#2d2d2d" strokeWidth="2" />
          {/* Screen bg */}
          <rect x={b.x + 2} y="14" width="61" height="51" fill="#1a1a1a" />
          {/* Menu lines */}
          {b.lines.map((lw, li) => (
            <g key={li}>
              <rect x={b.x + 8} y={22 + li * 11} width={lw} height="3" fill="#666" />
              <rect x={b.x + 10 + lw} y={22 + li * 11} width="12" height="3" fill="#888" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

/* ═══ COUNTER ═══ */
function Counter() {
  return (
    <g id="counter">
      {/* Main counter body */}
      <rect x="0" y="165" width="390" height="45" fill="#1a7a44" />
      {/* Counter top edge (highlight) */}
      <rect x="0" y="165" width="390" height="5" fill="#2d9e5a" />
      {/* Shadow under counter top */}
      <rect x="0" y="170" width="390" height="2" fill="#145a32" />
      {/* Decorative text */}
      <text x="100" y="192" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="sans-serif" fontStyle="italic">☕ center coffee</text>
      <text x="250" y="192" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="sans-serif" fontStyle="italic">☕ center coffee</text>
    </g>
  );
}

/* ═══ MICROWAVE ═══ */
function Microwave() {
  return (
    <g id="microwave" transform="translate(30, 143)">
      {/* Body */}
      <rect x="0" y="0" width="32" height="22" fill="#d0d0d0" rx="1" />
      {/* Window */}
      <rect x="3" y="4" width="18" height="14" fill="#111" rx="1" />
      {/* Button panel */}
      <rect x="24" y="4" width="5" height="14" fill="#aaa" />
      {/* Green light */}
      <circle cx="26" cy="11" r="2" fill="#3ecf82" />
      {/* Handle */}
      <rect x="22" y="8" width="1" height="6" fill="#888" />
    </g>
  );
}

/* ═══ COFFEE MACHINE ═══ */
function CoffeeMachine({ steamIntensity }: { steamIntensity: "low" | "high" }) {
  return (
    <g id="coffee-machine" transform="translate(177, 123)">
      {/* Body */}
      <rect x="0" y="0" width="36" height="42" fill="#2a2a2a" rx="2" />
      {/* Display */}
      <rect x="4" y="5" width="28" height="16" fill="#444" rx="1" />
      {/* Buttons */}
      <circle cx="10" cy="28" r="3" fill="#C0392B" />
      <circle cx="20" cy="28" r="3" fill="#3ecf82" />
      {/* Drip nozzle */}
      <rect x="14" y="36" width="8" height="6" fill="#555" />
      {/* Steam */}
      {[0, 1, 2].map((i) => (
        <motion.ellipse
          key={i}
          cx={18 + i * 3 - 3}
          cy={-5 - i * 8}
          rx="3"
          ry="5"
          fill="white"
          initial={{ opacity: 0.15, y: 0 }}
          animate={{
            opacity: [steamIntensity === "high" ? 0.5 : 0.2, 0],
            y: [-2, -14],
            x: [0, (i - 1) * 3],
          }}
          transition={{
            duration: steamIntensity === "high" ? 1.2 : 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </g>
  );
}

/* ═══ CUP STACKS ═══ */
function CupStacks({ fallen }: { fallen?: boolean }) {
  if (fallen) {
    return (
      <g id="cups-fallen">
        {[0, 1, 2].map((i) => (
          <motion.g
            key={i}
            initial={{ rotate: 0, y: 0 }}
            animate={{ rotate: 20 + i * 30, y: 10, x: i * 8 - 8 }}
            transition={{ type: "spring", damping: 8 }}
          >
            <rect x={320 + i * 7} y="151" width="10" height="14" fill="#d42b4f" rx="1" />
            <rect x={322 + i * 7} y="153" width="6" height="1.5" fill="#fff" />
          </motion.g>
        ))}
      </g>
    );
  }
  return (
    <g id="cups">
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={320 + i * 7} y={151 - i * 2} width="10" height={14 + i * 2} fill="#d42b4f" rx="1" />
          <rect x={322 + i * 7} y={153 - i * 2} width="6" height="1.5" fill="#fff" />
        </g>
      ))}
    </g>
  );
}

/* ═══ BARISTA PIXEL ART ═══ */
function BaristaPixel({
  x, side, state, idleAction, isSad, sleeping, angry, flipping, scared, waving,
}: {
  x: number; side: "left" | "right"; state: BaristaState; idleAction: string;
  isSad?: boolean; sleeping?: boolean; angry?: boolean; flipping?: boolean;
  scared?: boolean; waving?: boolean;
}) {
  const isLeft = side === "left";
  const skinColor = isLeft ? "#e8b88a" : "#d4a574";
  const skinShadow = isLeft ? "#d4a574" : "#b8956a";
  const hairColor = isLeft ? "#2c1810" : "#1a1a1a";
  const apronColor = isLeft ? "#2980b9" : "#27ae60";
  const name = isLeft ? "Виталий" : "Аслан";

  const bob = 0; // will be animated

  if (sleeping) {
    return (
      <motion.g transform={`translate(${x}, 140)`}>
        {/* Head resting on counter */}
        <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ellipse cx="0" cy="-5" rx="10" ry="9" fill={skinColor} />
          <ellipse cx="0" cy="-12" rx="9" ry="5" fill={hairColor} />
          {/* Closed eyes */}
          <line x1="-5" y1="-5" x2="-2" y2="-5" stroke="#2A1810" strokeWidth="1.5" />
          <line x1="2" y1="-5" x2="5" y2="-5" stroke="#2A1810" strokeWidth="1.5" />
        </motion.g>
        {/* Zzz */}
        <motion.text
          x="12" y="-20" fill="rgba(255,255,255,0.6)" fontSize="8" fontWeight="bold"
          animate={{ y: [-20, -26], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >Z</motion.text>
        <motion.text
          x="18" y="-30" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="bold"
          animate={{ y: [-30, -38], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >Z</motion.text>
        <text x="0" y="20" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8" fontWeight="bold">{name}</text>
      </motion.g>
    );
  }

  const flipAnim = flipping ? { rotate: [0, 360], y: [0, -30, 0] } : {};
  const flipTransition = flipping ? { duration: 1.5, ease: "easeInOut" } : {};

  return (
    <motion.g
      transform={`translate(${x}, 105)`}
      animate={flipAnim}
      transition={flipTransition}
    >
      {/* Body / Shirt */}
      <ellipse cx="0" cy="42" rx="12" ry="14" fill="#F0F0F0" />

      {/* Apron */}
      <rect x="-9" y="30" width="18" height="25" fill={apronColor} rx="1" />
      {/* Apron straps */}
      <rect x="-9" y="28" width="3" height="4" fill={apronColor} opacity="0.7" />
      <rect x="6" y="28" width="3" height="4" fill={apronColor} opacity="0.7" />
      {/* LiC text on apron */}
      <text x="0" y="45" textAnchor="middle" fill="#FFD700" fontSize="6" fontWeight="bold">LiC</text>

      {/* Arms */}
      {state === "idle" && isLeft && !angry && (
        <g>
          {/* Wiping arm */}
          <motion.g animate={idleAction === "wipe" ? { x: [-3, 3, -3] } : {}} transition={{ duration: 1, repeat: Infinity }}>
            <rect x="-16" y="38" width="5" height="12" fill={skinColor} rx="2" />
            {/* Rag */}
            <rect x="-18" y="50" width="8" height="3" fill="#bbb" rx="1" />
          </motion.g>
          <rect x="11" y="36" width="5" height="12" fill={skinColor} rx="2" />
        </g>
      )}
      {state === "idle" && !isLeft && (
        <g>
          <rect x="-16" y="36" width="5" height="12" fill={skinColor} rx="2" />
          <motion.g animate={idleAction === "arrange" ? { x: [0, 4, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
            <rect x="11" y="38" width="5" height="12" fill={skinColor} rx="2" />
          </motion.g>
        </g>
      )}
      {state === "accepted" && isLeft && (
        <g>
          {/* Working coffee machine */}
          <motion.rect x="-16" y="32" width="5" height="14" fill={skinColor} rx="2"
            animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 0.8, repeat: Infinity }} />
          <rect x="11" y="34" width="5" height="14" fill={skinColor} rx="2" />
        </g>
      )}
      {state === "accepted" && !isLeft && (
        <g>
          <rect x="-16" y="36" width="5" height="12" fill={skinColor} rx="2" />
          {/* Writing on cup */}
          <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.5, repeat: Infinity }}>
            <rect x="11" y="36" width="5" height="12" fill={skinColor} rx="2" />
            <rect x="13" y="48" width="2" height="5" fill="#333" />
          </motion.g>
        </g>
      )}
      {state === "ready" && !isLeft && (
        <g>
          {/* Holding cup */}
          <rect x="-18" y="38" width="7" height="10" fill="#d42b4f" rx="1" />
          <rect x="-17" y="40" width="5" height="1.5" fill="#fff" />
          {/* Waving arm */}
          <motion.rect x="11" y="26" width="5" height="12" fill={skinColor} rx="2"
            animate={{ rotate: [-15, 15, -15] }} transition={{ duration: 0.5, repeat: Infinity }}
            style={{ transformOrigin: "13px 38px" }} />
        </g>
      )}
      {state === "ready" && isLeft && (
        <g>
          <rect x="-16" y="36" width="5" height="12" fill={skinColor} rx="2" />
          <rect x="11" y="36" width="5" height="12" fill={skinColor} rx="2" />
        </g>
      )}
      {state === "pending" && (
        <g>
          <rect x="-16" y="36" width="5" height="12" fill={skinColor} rx="2" />
          <rect x="11" y="36" width="5" height="12" fill={skinColor} rx="2" />
        </g>
      )}
      {scared && (
        <g>
          <motion.rect x="-14" y="22" width="5" height="10" fill={skinColor} rx="2"
            animate={{ y: [22, 18, 22] }} transition={{ duration: 0.3, repeat: 3 }} />
          <motion.rect x="9" y="22" width="5" height="10" fill={skinColor} rx="2"
            animate={{ y: [22, 18, 22] }} transition={{ duration: 0.3, repeat: 3 }} />
        </g>
      )}

      {/* Neck */}
      <rect x="-3" y="18" width="6" height="6" fill={skinColor} />

      {/* Head */}
      <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="0" cy="10" rx="11" ry="12" fill={skinColor} />
        {/* Shadow on face */}
        <ellipse cx="2" cy="12" rx="8" ry="6" fill={skinShadow} opacity="0.15" />

        {/* Hair */}
        <ellipse cx="0" cy="1" rx="10" ry="6" fill={hairColor} />
        {isLeft && <ellipse cx="6" cy="3" rx="4" ry="3" fill={hairColor} />}
        {!isLeft && <ellipse cx="-5" cy="2" rx="5" ry="3" fill={hairColor} />}

        {/* Ears */}
        <ellipse cx="-10" cy="10" rx="2.5" ry="3.5" fill={skinShadow} />
        <ellipse cx="10" cy="10" rx="2.5" ry="3.5" fill={skinShadow} />

        {/* Face */}
        {angry ? (
          <g>
            {/* Angry eyebrows */}
            <line x1="-6" y1="4" x2="-2" y2="6" stroke="#222" strokeWidth="1.5" />
            <line x1="6" y1="4" x2="2" y2="6" stroke="#222" strokeWidth="1.5" />
            {/* Squinting eyes */}
            <rect x="-5" y="8" width="4" height="2" fill="#222" rx="1" />
            <rect x="1" y="8" width="4" height="2" fill="#222" rx="1" />
            {/* Frown */}
            <path d="M-3,16 Q0,13 3,16" stroke="#6B3E26" strokeWidth="1.2" fill="none" />
            {/* Red face tint */}
            <ellipse cx="0" cy="10" rx="9" ry="10" fill="rgba(255,0,0,0.1)" />
          </g>
        ) : isSad ? (
          <g>
            {/* Sad eyes looking at door */}
            <circle cx="-4" cy="8" r="2" fill="#FFF" />
            <circle cx="4" cy="8" r="2" fill="#FFF" />
            <circle cx="-5" cy="8" r="1.2" fill="#2A1810" />
            <circle cx="3" cy="8" r="1.2" fill="#2A1810" />
            {/* Sad eyebrows */}
            <line x1="-6" y1="4" x2="-2" y2="5" stroke={hairColor} strokeWidth="1" />
            <line x1="2" y1="5" x2="6" y2="4" stroke={hairColor} strokeWidth="1" />
            {/* Frown */}
            <path d="M-3,16 Q0,13 3,16" stroke="#6B3E26" strokeWidth="1.2" fill="none" />
            {/* Thought bubble */}
            <circle cx="-16" cy="-8" r="2" fill="rgba(255,255,255,0.5)" />
            <circle cx="-20" cy="-14" r="3" fill="rgba(255,255,255,0.5)" />
            <circle cx="-24" cy="-22" r="5" fill="rgba(255,255,255,0.6)" />
            <text x="-24" y="-20" textAnchor="middle" fill="#666" fontSize="7">?</text>
          </g>
        ) : scared ? (
          <g>
            {/* Wide scared eyes */}
            <circle cx="-4" cy="8" r="3.5" fill="#FFF" />
            <circle cx="4" cy="8" r="3.5" fill="#FFF" />
            <circle cx="-4" cy="8" r="2" fill="#2A1810" />
            <circle cx="4" cy="8" r="2" fill="#2A1810" />
            {/* Open mouth */}
            <ellipse cx="0" cy="15" rx="3" ry="3.5" fill="#6B3E26" />
            {/* ! above */}
            <text x="0" y="-8" textAnchor="middle" fill="rgba(255,50,50,0.8)" fontSize="12" fontWeight="bold">!</text>
          </g>
        ) : (
          <g>
            {/* Normal eyes */}
            <circle cx="-4" cy="8" r="2.5" fill="#FFF" />
            <circle cx="4" cy="8" r="2.5" fill="#FFF" />
            <circle cx="-4" cy="8.5" r="1.5" fill="#2A1810" />
            <circle cx="4" cy="8.5" r="1.5" fill="#2A1810" />
            {/* Highlights */}
            <circle cx="-3.3" cy="7.5" r="0.6" fill="#FFF" />
            <circle cx="4.7" cy="7.5" r="0.6" fill="#FFF" />
            {/* Eyebrows */}
            <path d={`M-6,4 Q-3,2 -1,4`} stroke={hairColor} strokeWidth="1" fill="none" />
            <path d={`M1,4 Q3,2 6,4`} stroke={hairColor} strokeWidth="1" fill="none" />
            {/* Nose */}
            <path d="M0,10 Q1.5,12 0,12.5" stroke="rgba(150,100,70,0.3)" strokeWidth="0.8" fill="none" />
            {/* Smile */}
            <path d="M-3,15 Q0,18 3,15" stroke="#6B3E26" strokeWidth="1.2" fill="none" />

            {/* Yawn overlay */}
            {idleAction === "yawn" && !isLeft && (
              <motion.ellipse cx="0" cy="15" rx="3" ry="4" fill="#6B3E26"
                initial={{ ry: 1 }} animate={{ ry: [1, 4, 1] }}
                transition={{ duration: 2, repeat: 1 }} />
            )}
          </g>
        )}
      </motion.g>

      {/* Name */}
      <text x="0" y="72" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8" fontWeight="bold">{name}</text>
    </motion.g>
  );
}

/* ═══ ORDER CARD OVERLAY ═══ */
function OrderCardOverlay({ state }: { state: BaristaState }) {
  const labels: Record<string, string> = {
    pending: "⏳ Новый заказ",
    accepted: "☕ Готовится...",
    ready: "🎉 Готов!",
  };
  return (
    <motion.g
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <rect x="150" y="78" width="90" height="20" rx="5" fill="rgba(255,255,255,0.92)" stroke="#d0f0e0" strokeWidth="1" />
      <text x="195" y="92" textAnchor="middle" fill="#1a7a44" fontSize="8" fontWeight="bold">{labels[state] ?? ""}</text>
    </motion.g>
  );
}

/* ═══ READY BUBBLE ═══ */
function ReadyBubble() {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <rect x="225" y="68" width="100" height="22" rx="11" fill="rgba(0,0,0,0.75)" />
      <text x="275" y="83" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">Готово! Забирай ☕</text>
      {/* Triangle pointer */}
      <polygon points="265,90 275,96 270,90" fill="rgba(0,0,0,0.75)" />
    </motion.g>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function CoffeeScene({ orderStatus, streakDays, lastOrderDate, orderCount }: CoffeeSceneProps) {
  const state: BaristaState = orderStatus ?? "idle";
  const [vitaliyTaps, setVitaliyTaps] = useState(0);
  const [aslanTaps, setAslanTaps] = useState(0);
  const [idleAction, setIdleAction] = useState("default");
  const [vAngry, setVAngry] = useState(false);
  const [vGone, setVGone] = useState(false);
  const [aFlipping, setAFlipping] = useState(false);
  const [cupsFallen, setCupsFallen] = useState(false);
  const [wokeUp, setWokeUp] = useState(false);
  const [isDancing, setIsDancing] = useState(false);

  const hour = typeof window !== "undefined" ? new Date().getHours() : 12;
  const isNight = hour >= 23 || hour < 7;
  const isSleeping = isNight && !wokeUp;
  const isSad = (streakDays ?? 1) === 0 && daysSinceOrder(lastOrderDate ?? null) >= 2;

  // Random idle actions every 10 seconds
  useEffect(() => {
    if (state !== "idle" || isSleeping) return;
    const interval = setInterval(() => {
      const actions = ["wipe", "yawn", "arrange", "look_phone", "stretch", "default"];
      setIdleAction(actions[Math.floor(Math.random() * actions.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, [state, isSleeping]);

  // Vitaliy easter egg: 8 taps
  useEffect(() => {
    if (vitaliyTaps >= 8 && !vAngry && !vGone) {
      setVAngry(true);
      const t1 = setTimeout(() => {
        setVAngry(false);
        setVGone(true);
        const t2 = setTimeout(() => {
          setVGone(false);
          setVitaliyTaps(0);
        }, 30000);
        return () => clearTimeout(t2);
      }, 2000);
      return () => clearTimeout(t1);
    }
  }, [vitaliyTaps, vAngry, vGone]);

  // Aslan easter egg: 5 taps
  useEffect(() => {
    if (aslanTaps >= 5 && !aFlipping) {
      setAFlipping(true);
      const t = setTimeout(() => {
        setAFlipping(false);
        setAslanTaps(0);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [aslanTaps, aFlipping]);

  // Shake detection
  useEffect(() => {
    let lastShake = 0;
    const handle = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const tot = Math.abs(a.x || 0) + Math.abs(a.y || 0);
      if (tot > 25 && Date.now() - lastShake > 3000) {
        lastShake = Date.now();
        setCupsFallen(true);
        setTimeout(() => setCupsFallen(false), 3000);
      }
    };
    window.addEventListener("devicemotion", handle);
    return () => window.removeEventListener("devicemotion", handle);
  }, []);

  // 10th order dance
  useEffect(() => {
    if (orderCount && orderCount > 0 && orderCount % 10 === 0 && !isDancing) {
      setIsDancing(true);
      const t = setTimeout(() => setIsDancing(false), 3000);
      return () => clearTimeout(t);
    }
  }, [orderCount, isDancing]);

  // Tap reset timers
  useEffect(() => {
    if (vitaliyTaps > 0 && vitaliyTaps < 8) {
      const t = setTimeout(() => setVitaliyTaps(0), 30000);
      return () => clearTimeout(t);
    }
  }, [vitaliyTaps]);

  useEffect(() => {
    if (aslanTaps > 0 && aslanTaps < 5) {
      const t = setTimeout(() => setAslanTaps(0), 10000);
      return () => clearTimeout(t);
    }
  }, [aslanTaps]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 390;

    if (isSleeping) {
      setWokeUp(true);
      setTimeout(() => setWokeUp(false), 5000);
      return;
    }

    // Vitaliy area (left of center)
    if (x > 110 && x < 200) {
      setVitaliyTaps((p) => p + 1);
    }
    // Aslan area (right of center)
    if (x > 220 && x < 310) {
      setAslanTaps((p) => p + 1);
    }
  }, [isSleeping]);

  return (
    <svg
      viewBox="0 0 390 220"
      shapeRendering="crispEdges"
      className="w-full rounded-2xl cursor-pointer"
      onClick={handleClick}
    >
      <Background />
      <Logo />
      <MenuBoards />
      <Microwave />
      <CoffeeMachine steamIntensity={state === "accepted" ? "high" : "low"} />
      <CupStacks fallen={cupsFallen} />
      <Counter />

      {/* Baristas */}
      {!vGone && (
        <BaristaPixel
          x={155} side="left" state={state} idleAction={idleAction}
          isSad={isSad} sleeping={isSleeping} angry={vAngry}
          scared={isNight && wokeUp}
        />
      )}
      {vGone && (
        <g>
          {/* Thrown apron on counter */}
          <motion.rect
            x="110" y="160" width="16" height="10" fill="#2980b9" rx="1"
            initial={{ rotate: 0, y: 130 }}
            animate={{ rotate: 20, y: 160 }}
            transition={{ type: "spring" }}
          />
        </g>
      )}

      <BaristaPixel
        x={265} side="right" state={state} idleAction={idleAction}
        sleeping={isSleeping} flipping={aFlipping}
        scared={isNight && wokeUp}
        waving={state === "ready"}
      />

      {/* Order card overlay */}
      <AnimatePresence>
        {state !== "idle" && <OrderCardOverlay state={state} />}
      </AnimatePresence>

      {/* Ready bubble */}
      <AnimatePresence>
        {state === "ready" && <ReadyBubble />}
      </AnimatePresence>

      {/* 10th order dance celebration */}
      {isDancing && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.text
            x="195" y="75" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11" fontWeight="bold"
            animate={{ y: [75, 72, 75], scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >Легенда кофейни! 🏆</motion.text>
        </motion.g>
      )}
    </svg>
  );
}
