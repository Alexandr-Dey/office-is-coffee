"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <p className="text-6xl mb-4">☕</p>
        <h1 className="font-display text-3xl font-bold text-brand-dark mb-2">404</h1>
        <p className="text-brand-text/60 mb-6">Такой страницы нет. Может, кофе?</p>
        <Link
          href="/menu"
          className="inline-block px-6 py-3 bg-[#1a7a44] text-white font-bold rounded-full text-sm"
        >
          Перейти в меню
        </Link>
      </motion.div>
    </main>
  );
}
