"use client";

import { motion } from "framer-motion";

interface Props {
  orderStatus: string;
}

export function ObjectsLayer({ orderStatus }: Props) {
  const steamIntensity = orderStatus === "accepted" ? "high" : "low";

  return (
    <g id="objects">
      {/* Fridge/vitrine (left of counter, 150-210) */}
      <rect x="155" y="260" width="55" height="40" fill="#d0d0d0" rx="2" />
      <rect x="158" y="263" width="49" height="34" fill="#b8d4e3" opacity="0.4" rx="1" />
      {/* Items inside vitrine */}
      <rect x="164" y="280" width="10" height="12" fill="#f5c6d0" rx="1" />
      <rect x="180" y="280" width="10" height="12" fill="#fde68a" rx="1" />
      <rect x="196" y="280" width="10" height="12" fill="#d4a574" rx="1" />

      {/* Microwave (220-290) */}
      <rect x="220" y="265" width="65" height="35" fill="#d0d0d0" rx="2" />
      <rect x="224" y="270" width="35" height="25" fill="#111" rx="1" />
      <rect x="264" y="270" width="14" height="25" fill="#aaa" rx="1" />
      <circle cx="270" cy="282" r="3" fill="#3ecf82" />
      <rect x="260" y="278" width="2" height="10" fill="#888" />

      {/* Coffee machine (310-420) */}
      <g id="coffee-machine" transform="translate(310, 240)">
        <rect x="0" y="0" width="100" height="60" fill="#c0c0c0" rx="3" />
        <rect x="3" y="3" width="94" height="20" fill="#444" rx="2" />
        {/* Gauges */}
        <circle cx="20" cy="14" r="6" fill="#333" stroke="#666" strokeWidth="1" />
        <circle cx="80" cy="14" r="6" fill="#333" stroke="#666" strokeWidth="1" />
        {/* Groups */}
        <rect x="15" y="28" width="25" height="28" fill="#a0a0a0" rx="1" />
        <rect x="60" y="28" width="25" height="28" fill="#a0a0a0" rx="1" />
        {/* Drip nozzles */}
        <rect x="22" y="50" width="12" height="10" fill="#666" rx="1" />
        <rect x="67" y="50" width="12" height="10" fill="#666" rx="1" />
        {/* Cups on top */}
        <rect x="10" y="-6" width="8" height="6" fill="#fff" rx="1" />
        <rect x="22" y="-6" width="8" height="6" fill="#fff" rx="1" />

        {/* Steam */}
        {[0, 1, 2].map((i) => (
          <motion.ellipse
            key={i}
            cx={50 + i * 8 - 8}
            cy={-12 - i * 12}
            rx="5"
            ry="8"
            fill="white"
            initial={{ opacity: 0.15, y: 0 }}
            animate={{
              opacity: [steamIntensity === "high" ? 0.5 : 0.2, 0],
              y: [-3, -22],
              x: [0, (i - 1) * 4],
            }}
            transition={{
              duration: steamIntensity === "high" ? 1.2 : 2.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
      </g>

      {/* Coffee grinder (430-470) */}
      <g transform="translate(430, 250)">
        <rect x="0" y="10" width="30" height="50" fill="#333" rx="2" />
        <rect x="4" y="0" width="22" height="14" fill="#444" rx="2" />
        <circle cx="15" cy="7" r="4" fill="#555" />
      </g>

      {/* POS terminal (480-530) */}
      <g transform="translate(490, 255)">
        <rect x="0" y="15" width="8" height="30" fill="#666" rx="1" />
        <rect x="-5" y="0" width="30" height="20" fill="#333" rx="2" />
        <rect x="-2" y="2" width="24" height="14" fill="#1a7a44" rx="1" />
      </g>

      {/* Pickup zone (540-580) — flat area */}
      <rect x="540" y="295" width="50" height="5" fill="#2d9e5a" opacity="0.3" rx="1" />

      {/* Cup stacks (590-640) */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={590 + i * 16} y={270 - i * 4} width="14" height={30 + i * 4} fill="#d42b4f" rx="2" />
          <rect x={592 + i * 16} y={273 - i * 4} width="10" height="3" fill="#fff" opacity="0.7" />
          <rect x={590 + i * 16} y={270 - i * 4} width="14" height="3" fill="#8b1a2e" rx="1" />
        </g>
      ))}

      {/* Plant by left wall */}
      <g transform="translate(30, 420)">
        <rect x="0" y="20" width="20" height="25" fill="#8b4513" rx="2" />
        <ellipse cx="10" cy="20" rx="15" ry="20" fill="#228b22" />
        <ellipse cx="5" cy="15" rx="8" ry="12" fill="#2d9e5a" />
        <ellipse cx="15" cy="12" rx="7" ry="10" fill="#1a7a44" />
      </g>
    </g>
  );
}
