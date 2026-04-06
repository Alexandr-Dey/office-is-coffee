"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import confetti from "canvas-confetti";

const STEPS = ["welcome", "auth", "geo", "push", "pwa", "done"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const { user, signInWithName } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      let nextStep = STEPS[idx + 1];
      /* Skip PWA step if not iOS or already PWA */
      if (nextStep === "pwa" && (!isIOS || isPWA)) nextStep = "done";
      setStep(nextStep);
    }
  };

  const handleAuth = () => {
    if (!name.trim()) return;
    signInWithName(name.trim(), "client");
    next();
  };

  const handleGeo = (allow: boolean) => {
    if (allow && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          if (user) updateDoc(doc(getFirebaseDb(), "users", user.uid), { geolocationAllowed: true }).catch(() => {});
          next();
        },
        () => next(),
      );
    } else {
      next();
    }
  };

  const handlePush = (allow: boolean) => {
    if (allow && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        /* Token saving would go here with FCM */
        next();
      });
    } else {
      next();
    }
  };

  const handleDone = async () => {
    if (user) {
      await updateDoc(doc(getFirebaseDb(), "users", user.uid), { onboardingDone: true }).catch(() => {});
    }
    confetti({ particleCount: 80, spread: 60, colors: ["#1a7a44", "#3ecf82", "#d42b4f"] });
    setTimeout(() => router.replace("/menu"), 800);
  };

  return (
    <main className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors ${
              STEPS.indexOf(step) >= i ? "bg-brand-dark" : "bg-[#d0f0e0]"
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="text-center">
              <div className="text-6xl mb-4">{"\u2615"}</div>
              <h1 className="font-display text-3xl font-bold text-brand-text mb-2">Love is Coffee</h1>
              <p className="text-brand-text/50 mb-2">Виталий и Аслан ждут тебя</p>
              <p className="text-brand-text/70 mb-8">Добро пожаловать в Love is Coffee</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={next}
                className="w-full py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-lg">
                Начать
              </motion.button>
            </motion.div>
          )}

          {step === "auth" && (
            <motion.div key="auth" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="text-center">
              <div className="text-5xl mb-4">{"\uD83D\uDC64"}</div>
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">Как тебя зовут?</h2>
              <p className="text-brand-text/50 mb-6">Это имя увидит бариста на заказе</p>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                placeholder="Твоё имя"
                className="w-full px-6 py-4 rounded-2xl border-2 border-[#d0f0e0] text-brand-text font-medium text-lg focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/30 outline-none mb-4 text-center" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAuth} disabled={!name.trim()}
                className="w-full py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-lg disabled:opacity-50">
                Продолжить
              </motion.button>
            </motion.div>
          )}

          {step === "geo" && (
            <motion.div key="geo" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="text-center">
              <div className="text-5xl mb-4">{"\uD83D\uDCCD"}</div>
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">Узнай когда кофейня рядом</h2>
              <p className="text-brand-text/50 mb-8">Мы покажем расстояние и напомним когда ты близко. Координаты не сохраняются.</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleGeo(true)}
                className="w-full py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-lg mb-3">
                Разрешить
              </motion.button>
              <button onClick={() => handleGeo(false)} className="text-brand-text/40 text-sm">Не сейчас</button>
            </motion.div>
          )}

          {step === "push" && (
            <motion.div key="push" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="text-center">
              <div className="text-5xl mb-4">{"\uD83D\uDD14"}</div>
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">Не пропусти когда кофе готов</h2>
              <p className="text-brand-text/50 mb-8">Уведомим когда бариста приготовит заказ и когда кофейня откроется.</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handlePush(true)}
                className="w-full py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-lg mb-3">
                Разрешить
              </motion.button>
              <button onClick={() => handlePush(false)} className="text-brand-text/40 text-sm">Не сейчас</button>
            </motion.div>
          )}

          {step === "pwa" && (
            <motion.div key="pwa" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="text-center">
              <div className="text-5xl mb-4">{"\uD83D\uDCF1"}</div>
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">Установи приложение</h2>
              <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-6 text-left" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                <p className="text-sm text-brand-text/70 mb-2">1. Нажми кнопку <strong>Поделиться</strong> {"\u2191"} внизу экрана</p>
                <p className="text-sm text-brand-text/70 mb-2">2. Найди <strong>На экран Домой</strong></p>
                <p className="text-sm text-brand-text/70">3. Нажми <strong>Добавить</strong></p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={next}
                className="w-full py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-lg">
                Готово
              </motion.button>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center">
              <div className="text-6xl mb-4">{"\uD83C\uDF89"}</div>
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">Всё готово!</h2>
              <p className="text-brand-text/50 mb-8">Добро пожаловать в Love is Coffee</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleDone}
                className="w-full py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-lg">
                Перейти в меню {"\u2615"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
