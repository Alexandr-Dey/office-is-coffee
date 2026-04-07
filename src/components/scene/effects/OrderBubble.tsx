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
      <rect x="300" y="150" width="200" height="40" rx="10" fill="rgba(255,255,255,0.95)" stroke="#1a7a44" strokeWidth="1.5" />
      <text x="400" y="176" textAnchor="middle" fill="#1a7a44" fontSize="14" fontWeight="bold">
        {text}
      </text>
      {/* Triangle pointer */}
      <polygon points="380,190 400,200 390,190" fill="rgba(255,255,255,0.95)" stroke="#1a7a44" strokeWidth="1" />
    </motion.g>
  );
}
