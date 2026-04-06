"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const tabs = [
  { href: "/menu", icon: "\u2615", label: "Меню" },
  { href: "/orders", icon: "\uD83D\uDCE6", label: "Заказы" },
  { href: "/coins", icon: "\u2B50", label: "Монеты" },
  { href: "/profile", icon: "\uD83D\uDC64", label: "Профиль" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const hideOn = ["/", "/avatar", "/admin", "/ceo"];
  if (hideOn.some((p) => pathname === p || pathname.startsWith("/admin") || pathname.startsWith("/ceo"))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white" style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-0.5 relative">
              <motion.span
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`text-xl transition-colors ${active ? "" : "opacity-40"}`}
              >
                {tab.icon}
              </motion.span>
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-[#1a7a44]" : "text-[#9ca3af]"}`}>
                {tab.label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-brand-mint"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
