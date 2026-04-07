"use client";

import { motion } from "framer-motion";

interface Props {
  active: boolean;
}

export function Steam({ active }: Props) {
  if (!active) return null;

  return (
    <g id="extra-steam">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.ellipse
          key={i}
          cx={190 + i * 12 - 24}
          cy={230 - i * 12}
          rx="7"
          ry="11"
          fill="white"
          animate={{
            opacity: [0.5, 0],
            y: [-5, -35],
            x: [0, (i - 2) * 5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "easeOut",
          }}
        />
      ))}
    </g>
  );
}
