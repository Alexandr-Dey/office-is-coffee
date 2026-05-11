"use client";

// Баннер с предложением включить push.
// Показывается ТОЛЬКО на iOS внутри standalone (PWA на главном экране) когда:
//  - юзер залогинен
//  - Notification.permission === 'default' (ещё не спрашивали или забыли)
//  - localStorage не помечен как «уже спрашивали».
// На iOS push работает только из PWA — поэтому в обычной Safari ничего не
// показываем, а в онбординге у нас отдельная карточка с инструкцией установки.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";

const ASK_KEY = "oic_ios_push_asked";
const SHOW_DELAY_MS = 2500;

function isIOSStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document); // iPadOS прячется под Mac
  const standalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches;
  return isIOS && !!standalone;
}

export default function IOSPushPromptBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    if (!isIOSStandalone()) return;
    if (localStorage.getItem(ASK_KEY) === "true") return;
    const t = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [user]);

  const enable = async () => {
    if (!user) return;
    localStorage.setItem(ASK_KEY, "true");
    setShow(false);
    try {
      const { requestPushPermission } = await import("@/lib/push");
      await requestPushPermission(user.uid);
    } catch {
      /* ignore — юзер позже включит из профиля */
    }
  };

  const dismiss = () => {
    localStorage.setItem(ASK_KEY, "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-24px)] max-w-[440px] bg-white rounded-2xl shadow-2xl border border-[#d0f0e0] p-4"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl shrink-0">🔔</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-brand-text">Включить уведомления?</p>
              <p className="text-xs text-brand-text/60 mt-0.5 leading-snug">
                Узнаешь когда кофе будет готов — не нужно постоянно проверять.
              </p>
              <div className="flex gap-2 mt-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={enable}
                  className="flex-1 py-2 rounded-xl bg-brand-dark text-white text-sm font-semibold"
                >
                  Включить
                </motion.button>
                <button
                  onClick={dismiss}
                  className="px-3 py-2 rounded-xl bg-[#d0f0e0]/40 text-brand-text/70 text-sm"
                >
                  Позже
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
