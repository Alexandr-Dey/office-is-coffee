"use client";

import { motion } from "framer-motion";

const STATUS_TEXT: Record<string, string> = {
  pending: "\u23F3 Новый заказ",
  accepted: "\u2615 Готовится...",
  ready: "\uD83C\uDF89 Готов!",
  new: "\u23F3 Принимаем...",
};

interface Props {
  status: string;
}

export function OrderBubble({ status }: Props) {
  const text = STATUS_TEXT[status];
  if (!text) return null;

  return (
    <motion.g
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <rect x="270" y="220" width="260" height="48" rx="14" fill="rgba(255,255,255,0.95)" stroke="#1a7a44" strokeWidth="2" />
      <text x="400" y="252" textAnchor="middle" fill="#1a7a44" fontSize="20" fontWeight="bold">
        {text}
      </text>
      {/* Triangle pointer down */}
      <polygon points="385,268 400,280 395,268" fill="rgba(255,255,255,0.95)" stroke="#1a7a44" strokeWidth="1.5" />
    </motion.g>
  );
}
