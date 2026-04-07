"use client";

import { motion } from "framer-motion";

interface Props {
  active: boolean;
}

export function Steam({ active }: Props) {
  // Extra steam puffs when coffee is being made
  if (!active) return null;

  return (
    <g id="extra-steam">
      {[0, 1, 2, 3].map((i) => (
        <motion.ellipse
          key={i}
          cx={360 + i * 10 - 15}
          cy={210 - i * 15}
          rx="6"
          ry="10"
          fill="white"
          animate={{
            opacity: [0.4, 0],
            y: [-5, -30],
            x: [0, (i - 1.5) * 5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeOut",
          }}
        />
      ))}
    </g>
  );
}
