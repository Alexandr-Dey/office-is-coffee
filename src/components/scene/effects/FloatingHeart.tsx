"use client";

import { motion } from "framer-motion";

interface Props {
  x: number;
  y: number;
  onDone: () => void;
}

export function FloatingHeart({ x, y, onDone }: Props) {
  return (
    <motion.g
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -60, scale: 1.2 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      onAnimationComplete={onDone}
    >
      <text
        x={x}
        y={y - 30}
        textAnchor="middle"
        fontSize="22"
        style={{ pointerEvents: "none" }}
      >
        ❤️
      </text>
    </motion.g>
  );
}
