"use client";

import { motion } from "framer-motion";

interface Props {
  orderStatus: string;
}

export function ObjectsLayer({ orderStatus }: Props) {
  const isWorking = orderStatus === "accepted";

  return (
    <g id="objects" style={{ pointerEvents: "none" }}>
      {/* ═══ ZONE 1: COFFEE (100-300) ═══ */}

      {/* Coffee machine — large, centered in zone 1 */}
      <g transform="translate(120, 260)">
        {/* Machine body */}
        <rect x="0" y="0" width="140" height="80" fill="url(#machineBody)" rx="4" />
        {/* Top panel */}
        <rect x="3" y="3" width="134" height="24" fill="#444" rx="2" />
        {/* Gauges */}
        <circle cx="30" cy="16" r="9" fill="#333" stroke="#888" strokeWidth="1.5" />
        <circle cx="30" cy="16" r="6" fill="#222" />
        <line x1="30" y1="16" x2="35" y2="12" stroke="#e74c3c" strokeWidth="1" />
        <circle cx="30" cy="16" r="1.5" fill="#fff" />

        <circle cx="110" cy="16" r="9" fill="#333" stroke="#888" strokeWidth="1.5" />
        <circle cx="110" cy="16" r="6" fill="#222" />
        <line x1="110" y1="16" x2="115" y2="12" stroke="#3ecf82" strokeWidth="1" />
        <circle cx="110" cy="16" r="1.5" fill="#fff" />

        {/* Brand badge */}
        <rect x="52" y="7" width="36" height="13" fill="#c0392b" rx="2" />
        <text x="70" y="17" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">LiC</text>

        {/* Group heads */}
        <rect x="15" y="32" width="40" height="42" fill="#a8a8a8" rx="2" />
        <rect x="85" y="32" width="40" height="42" fill="#a8a8a8" rx="2" />
        {/* Portafilters */}
        <rect x="22" y="68" width="26" height="12" fill="#555" rx="2" />
        <rect x="92" y="68" width="26" height="12" fill="#555" rx="2" />

        {/* Cups on top */}
        {[8, 24, 40, 88, 104, 120].map((cx) => (
          <rect key={cx} x={cx} y={-8} width="11" height="8" fill="#fff" rx="1" opacity="0.8" />
        ))}

        {/* Steam */}
        {[0, 1, 2].map((i) => (
          <motion.ellipse
            key={`steam-${i}`}
            cx={70 + i * 14 - 14}
            cy={-16 - i * 12}
            rx="6"
            ry="9"
            fill="white"
            initial={{ opacity: 0.1, y: 0 }}
            animate={{
              opacity: [isWorking ? 0.5 : 0.15, 0],
              y: [-2, -24],
              x: [0, (i - 1) * 5],
            }}
            transition={{
              duration: isWorking ? 1.0 : 2.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut",
            }}
          />
        ))}
      </g>

      {/* Coffee grinder — right of machine */}
      <g transform="translate(270, 288)">
        <polygon points="3,0 27,0 23,12 7,12" fill="#444" />
        <circle cx="12" cy="5" r="2.5" fill="#5C2E0E" opacity="0.5" />
        <circle cx="19" cy="4" r="2" fill="#3a1a08" opacity="0.5" />
        <rect x="2" y="12" width="26" height="48" fill="#333" rx="3" />
        <circle cx="15" cy="26" r="5" fill="#222" stroke="#555" strokeWidth="1" />
        <rect x="14" y="21" width="2" height="5" fill="#e74c3c" />
        <rect x="7" y="52" width="16" height="8" fill="#444" rx="1" />
      </g>

      {/* Zone 1 label */}
      <text x="200" y="232" textAnchor="middle" fill="#8b6f47" fontSize="8" fontWeight="bold" opacity="0.4">
        ☕
      </text>

      {/* ═══ ZONE 2: CASH (300-500) ═══ */}

      {/* POS terminal — facing customer (viewer), tilted forward */}
      <g transform="translate(365, 278)">
        {/* Stand base */}
        <rect x="6" y="48" width="28" height="4" fill="#555" rx="1" />
        {/* Stand pole — angled back */}
        <rect x="16" y="36" width="8" height="14" fill="#666" rx="1" />
        {/* Screen back (dark, visible because tilted toward viewer) */}
        <rect x="0" y="2" width="40" height="36" fill="#222" rx="3" />
        {/* Screen face — bright, facing viewer */}
        <rect x="1" y="3" width="38" height="34" fill="#333" rx="2" />
        <rect x="3" y="5" width="34" height="28" fill="#1a7a44" rx="2" />
        {/* Screen UI */}
        <text x="20" y="18" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">LiC</text>
        <rect x="8" y="23" width="24" height="3" fill="#3ecf82" rx="0.5" />
        <rect x="8" y="28" width="16" height="2" fill="#2d9e5a" rx="0.5" />
        {/* Screen shine/reflection */}
        <rect x="4" y="6" width="6" height="18" fill="#fff" opacity="0.06" rx="1" />
      </g>

      {/* ═══ ZONE 3: PICKUP (500-700) ═══ */}

      {/* Pickup surface marker */}
      <rect x="510" y="334" width="80" height="6" fill="#2d9e5a" opacity="0.2" rx="2" />
      <text x="550" y="330" textAnchor="middle" fill="#1a7a44" fontSize="7" opacity="0.35" fontWeight="bold">
        ВЫДАЧА
      </text>

      {/* Cup stacks — S M L */}
      <g transform="translate(610, 294)">
        {/* S */}
        <rect x="0" y="18" width="14" height="28" fill="#d42b4f" rx="2" />
        <rect x="1" y="20" width="12" height="3" fill="#fff" opacity="0.5" />
        <rect x="0" y="18" width="14" height="4" fill="#8b1a2e" rx="1" />
        <text x="7" y="40" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">S</text>
      </g>
      <g transform="translate(632, 288)">
        {/* M */}
        <rect x="0" y="18" width="16" height="34" fill="#d42b4f" rx="2" />
        <rect x="1" y="20" width="14" height="3" fill="#fff" opacity="0.5" />
        <rect x="0" y="18" width="16" height="4" fill="#8b1a2e" rx="1" />
        <text x="8" y="44" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">M</text>
      </g>
      <g transform="translate(656, 280)">
        {/* L */}
        <rect x="0" y="18" width="18" height="42" fill="#d42b4f" rx="2" />
        <rect x="1" y="20" width="16" height="3" fill="#fff" opacity="0.5" />
        <rect x="0" y="18" width="18" height="4" fill="#8b1a2e" rx="1" />
        <text x="9" y="50" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">L</text>
      </g>
    </g>
  );
}
