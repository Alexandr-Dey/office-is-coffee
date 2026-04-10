"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";

const clientTabs = [
  { href: "/menu", icon: "☕", label: "Меню" },
  { href: "/orders", icon: "📦", label: "Заказы" },
  { href: "/coins", icon: "⭐", label: "Монеты" },
  { href: "/profile", icon: "👤", label: "Профиль" },
];

const baristaTabs = [
  { href: "/admin", icon: "📋", label: "Заказы" },
  { href: "/barista/menu", icon: "📝", label: "Меню" },
  { href: "/barista/bonuses", icon: "💰", label: "Бонусы" },
  { href: "/profile", icon: "👤", label: "Профиль" },
];

const ceoTabs = [
  { href: "/admin", icon: "📋", label: "Заказы" },
  { href: "/ceo", icon: "👑", label: "CEO" },
  { href: "/menu", icon: "☕", label: "Меню" },
  { href: "/profile", icon: "👤", label: "Профиль" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const hideOn = ["/", "/avatar", "/onboarding"];
  if (hideOn.includes(pathname)) return null;

  const role = user?.role ?? "client";
  const tabs = role === "ceo" ? ceoTabs : role === "barista" ? baristaTabs : clientTabs;

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-50 bg-white" style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.05)" }} aria-label="Основная навигация" role="navigation">
      <div className="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link key={tab.href} href={tab.href} aria-label={tab.label} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-0.5 relative min-w-[44px] min-h-[44px] justify-center">
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
