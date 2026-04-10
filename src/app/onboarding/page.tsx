"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import confetti from "canvas-confetti";
import { requestPushPermission } from "@/lib/push";
import { trackEvent } from "@/lib/mixpanel";

/* ───────────────────────────────────────────
   ONBOARDING — Love is Coffee
   4 шага контента + встроенные разрешения
   Фото: /public/photos/logo-wall.jpg
         /public/photos/baristas.jpg
         /public/photos/barista-drink.jpg
   ─────────────────────────────────────────── */

const STEPS = ["welcome", "team", "features", "permissions", "done"] as const;
type Step = (typeof STEPS)[number];

/* ── Framer variants ── */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir < 0 ? 80 : -80,
    opacity: 0,
  }),
};

/* ── Photo component with gradient fallback ──
   Когда фото появятся в /public/photos/, поменяй usePhoto = true */
const usePhotos = true;

function CafePhoto({
  src,
  fallbackEmoji,
  fallbackLabel,
  className = "",
}: {
  src: string;
  fallbackEmoji: string;
  fallbackLabel: string;
  className?: string;
}) {
  if (usePhotos) {
    return (
      <div className={`overflow-hidden rounded-2xl ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={fallbackLabel}
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl flex flex-col items-center justify-center ${className}`}
      style={{
        background: "linear-gradient(145deg, #c0392b 0%, #e74c3c 40%, #d42b4f 100%)",
        boxShadow: "0 8px 28px rgba(196,49,49,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl" />
      <span className="text-4xl mb-1 relative z-10 drop-shadow-md">{fallbackEmoji}</span>
      <span className="text-[10px] text-white/70 font-semibold relative z-10 text-center px-4 leading-tight">
        {fallbackLabel}
      </span>
      <span className="absolute bottom-2 right-3 text-[7px] text-white/25 font-bold tracking-wider">
        LOVE IS COFFEE
      </span>
    </div>
  );
}

/* ── Loyalty dots preview ── */
function LoyaltyPreview() {
  return (
    <div className="bg-[#d42b4f]/5 rounded-2xl p-4 border border-[#d42b4f]/10">
      <p className="text-[10px] font-extrabold text-[#d42b4f] uppercase tracking-[2px] mb-3 text-center">
        Программа лояльности
      </p>
      <div className="flex gap-1.5 justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div
            key={n}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
              n === 8
                ? "bg-gradient-to-br from-[#d42b4f] to-[#e85d7a] text-white shadow-md"
                : "bg-[#f0e8e0] text-[#bbb]"
            }`}
            style={n === 8 ? { boxShadow: "0 2px 8px rgba(212,43,79,0.3)" } : {}}
          >
            {n === 8 ? "🎁" : "☕"}
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-500 mt-2">
        Каждый 8-й напиток — наш подарок
      </p>
    </div>
  );
}

/* ── Feature row ── */
function Feature({
  icon,
  title,
  desc,
  gradient,
}: {
  icon: string;
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <div className="flex items-center gap-3.5 bg-white rounded-2xl p-3.5 border border-[#f0e8e0] shadow-sm">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: gradient, boxShadow: "0 3px 10px rgba(0,0,0,0.08)" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-[#0f3a20]">{title}</p>
        <p className="text-xs text-gray-500 leading-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [dir, setDir] = useState(1);
  const [geoAsked, setGeoAsked] = useState(false);
  const [pushAsked, setPushAsked] = useState(false);

  useEffect(() => {
    if (user && (user.role === "barista" || user.role === "ceo")) {
      router.replace("/admin");
      return;
    }
    if (user && user.onboardingDone) {
      router.replace("/menu");
    }
  }, [user, router]);

  const currentIdx = STEPS.indexOf(step);

  const goTo = useCallback(
    (target: Step) => {
      const targetIdx = STEPS.indexOf(target);
      setDir(targetIdx > currentIdx ? 1 : -1);
      setStep(target);
    },
    [currentIdx],
  );

  const next = useCallback(() => {
    if (currentIdx < STEPS.length - 1) {
      const nextStep = STEPS[currentIdx + 1];
      setDir(1);
      setStep(nextStep);
    }
  }, [currentIdx]);

  const back = useCallback(() => {
    if (currentIdx > 0) {
      setDir(-1);
      setStep(STEPS[currentIdx - 1]);
    }
  }, [currentIdx]);

  /* Permission handlers */
  const handleGeo = async (allow: boolean) => {
    setGeoAsked(true);
    if (allow && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          if (user)
            updateDoc(doc(getFirebaseDb(), "users", user.uid), {
              geolocationAllowed: true,
            }).catch(() => {});
        },
        () => {},
      );
    }
  };

  const handlePush = async (allow: boolean) => {
    setPushAsked(true);
    if (allow && user) {
      await requestPushPermission(user.uid).catch(() => {});
    }
  };

  const handleDone = async () => {
    if (user) {
      await updateDoc(doc(getFirebaseDb(), "users", user.uid), {
        onboardingDone: true,
      }).catch(() => {});
    }
    trackEvent("Onboarding Completed", { stepsCompleted: STEPS.length });
    confetti({
      particleCount: 100,
      spread: 70,
      colors: ["#d42b4f", "#e85d7a", "#1a7a44", "#3ecf82", "#f59e0b"],
    });
    setTimeout(() => router.replace("/menu"), 800);
  };

  /* Swipe support */
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return;
    const d = touchX - e.changedTouches[0].clientX;
    if (Math.abs(d) > 60) {
      if (d > 0 && step !== "done") next();
      else if (d < 0 && step !== "welcome") back();
    }
    setTouchX(null);
  };

  return (
    <main
      className="min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#faf7f2", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] mt-10 mb-1">
        {currentIdx > 0 ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={back}
            className="w-9 h-9 rounded-xl bg-[#d42b4f]/8 flex items-center justify-center text-[#d42b4f] text-base"
          >
            ←
          </motion.button>
        ) : (
          <div className="w-9" />
        )}

        {/* Progress dots */}
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <motion.div
              key={s}
              animate={{
                width: i === currentIdx ? 28 : 8,
                backgroundColor: i === currentIdx ? "#d42b4f" : "rgba(212,43,79,0.15)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        {step !== "done" ? (
          <button
            onClick={() => goTo("permissions")}
            className="text-xs text-gray-400 font-semibold"
          >
            Пропустить
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* ── Step content ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          {/* ═══ STEP 1: Welcome ═══ */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            >
              {/* Cafe photo */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mb-6"
              >
                <CafePhoto
                  src="/photos/logo-wall.jpg"
                  fallbackEmoji="❤️☕"
                  fallbackLabel="Логотип на красной стене"
                  className="w-[270px] h-[170px] relative"
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-display text-[28px] font-extrabold text-[#d42b4f] leading-tight"
              >
                Love is Coffee
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-sm text-[#5a5048] mt-3 max-w-[280px] leading-relaxed"
              >
                Кофейня с душой в самом центре Алматы
              </motion.p>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.35 }}
                className="w-10 h-[3px] rounded-full my-5"
                style={{ background: "linear-gradient(90deg, #d42b4f, #e85d7a)" }}
              />

              {/* Mission quote */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#d42b4f]/[0.04] rounded-2xl px-5 py-4 border-l-[3px] border-[#d42b4f] max-w-[310px]"
              >
                <p className="text-[13px] italic text-[#5a4a42] leading-relaxed">
                  «Мы верим, что лучший кофе — тот, который сделан с заботой.
                  Не просто напиток, а маленький ритуал, который делает день теплее»
                </p>
              </motion.div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-5 flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-sm border border-[#f0e8e0]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#d42b4f]/10 flex items-center justify-center text-lg">
                  📍
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[#0f3a20]">
                    ул. Назарбаева 226
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Холл БанкЦентрКредит · Алматы
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ═══ STEP 2: Team ═══ */}
          {step === "team" && (
            <motion.div
              key="team"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto px-5 pt-2 pb-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-5"
              >
                <span className="text-3xl">❤️</span>
                <h2 className="font-display text-[22px] font-extrabold text-[#d42b4f] mt-2">
                  Наша команда
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Знаем имена гостей и помним любимые напитки
                </p>
              </motion.div>

              {/* Baristas photo */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4"
              >
                <CafePhoto
                  src="/photos/baristas.jpg"
                  fallbackEmoji="👨‍🍳👨‍🍳"
                  fallbackLabel="Баристы за кофемашиной"
                  className="w-full h-[190px] relative"
                />
              </motion.div>

              {/* Barista cards */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3 mb-4"
              >
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-[#f0e8e0]">
                  <span className="text-3xl">👨‍🍳</span>
                  <p className="text-sm font-extrabold text-[#0f3a20] mt-1">Виталий</p>
                  <p className="text-[10px] font-bold text-[#2980b9] uppercase tracking-wider">
                    Бариста
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                    Мастер латте-арта
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-[#f0e8e0]">
                  <span className="text-3xl">👨‍🍳</span>
                  <p className="text-sm font-extrabold text-[#0f3a20] mt-1">Аслан</p>
                  <p className="text-[10px] font-bold text-[#27ae60] uppercase tracking-wider">
                    Бариста
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                    Гуру авторских напитков
                  </p>
                </div>
              </motion.div>

              {/* Barista with drink photo */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CafePhoto
                  src="/photos/barista-drink.jpg"
                  fallbackEmoji="🧋✨"
                  fallbackLabel="Бариста с готовым напитком"
                  className="w-full h-[170px] relative"
                />
              </motion.div>
            </motion.div>
          )}

          {/* ═══ STEP 3: Features ═══ */}
          {step === "features" && (
            <motion.div
              key="features"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto px-5 pt-2 pb-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-5"
              >
                <span className="text-3xl">✨</span>
                <h2 className="font-display text-[22px] font-extrabold text-[#d42b4f] mt-2">
                  Что внутри
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Всё для идеального кофейного ритуала
                </p>
              </motion.div>

              <div className="space-y-2.5 mb-5">
                <Feature
                  icon="☕"
                  title="Заказ в пару тапов"
                  desc="Выбрал, настроил, отправил — жди push"
                  gradient="linear-gradient(135deg, #d42b4f, #e85d7a)"
                />
                <Feature
                  icon="🔥"
                  title="Стрик и лояльность"
                  desc="Каждый 8-й напиток — бесплатно!"
                  gradient="linear-gradient(135deg, #f59e0b, #fbbf24)"
                />
                <Feature
                  icon="💳"
                  title="Депозит"
                  desc="Пополни баланс и плати мгновенно"
                  gradient="linear-gradient(135deg, #3b82f6, #60a5fa)"
                />
                <Feature
                  icon="📡"
                  title="Real-time статус"
                  desc="Видишь когда заказ готов"
                  gradient="linear-gradient(135deg, #1a7a44, #2d9e5a)"
                />
                <Feature
                  icon="🎨"
                  title="Живая сцена"
                  desc="Pixel-art кофейня оживает"
                  gradient="linear-gradient(135deg, #a855f7, #c084fc)"
                />
              </div>

              <LoyaltyPreview />
            </motion.div>
          )}

          {/* ═══ STEP 4: Permissions ═══ */}
          {step === "permissions" && (
            <motion.div
              key="permissions"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-6"
              >
                <span className="text-4xl">🔔</span>
                <h2 className="font-display text-[22px] font-extrabold text-[#d42b4f] mt-3">
                  Пара настроек
                </h2>
                <p className="text-xs text-gray-500 mt-1 max-w-[260px] mx-auto">
                  Чтобы не пропустить когда кофе готов
                </p>
              </motion.div>

              <div className="w-full max-w-sm space-y-4">
                {/* Geo */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-4 border border-[#f0e8e0] shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1a7a44]/10 flex items-center justify-center text-lg shrink-0">
                      📍
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#0f3a20]">Геолокация</p>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        Покажем расстояние до кофейни
                      </p>
                    </div>
                    {!geoAsked ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleGeo(true)}
                        className="px-4 py-2 rounded-xl bg-[#1a7a44] text-white text-xs font-bold shrink-0"
                      >
                        OK
                      </motion.button>
                    ) : (
                      <span className="text-[#3ecf82] text-sm font-bold">✓</span>
                    )}
                  </div>
                </motion.div>

                {/* Push */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-4 border border-[#f0e8e0] shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d42b4f]/10 flex items-center justify-center text-lg shrink-0">
                      🔔
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#0f3a20]">Уведомления</p>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        Узнаешь когда кофе готов
                      </p>
                    </div>
                    {!pushAsked ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePush(true)}
                        className="px-4 py-2 rounded-xl bg-[#d42b4f] text-white text-xs font-bold shrink-0"
                      >
                        OK
                      </motion.button>
                    ) : (
                      <span className="text-[#3ecf82] text-sm font-bold">✓</span>
                    )}
                  </div>
                </motion.div>

                {/* Skip both note */}
                {!geoAsked && !pushAsked && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-[11px] text-gray-400"
                  >
                    Можно разрешить позже в настройках
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 5: Done ═══ */}
          {step === "done" && (
            <motion.div
              key="done"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-[110px] h-[110px] rounded-[32px] flex items-center justify-center text-[52px] mb-6"
                style={{
                  background: "linear-gradient(145deg, #d42b4f, #e85d7a)",
                  boxShadow: "0 12px 40px rgba(212,43,79,0.3)",
                }}
              >
                ☕
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-[26px] font-extrabold text-[#d42b4f]"
              >
                Всё готово!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-[#5a5048] mt-2 max-w-[260px] leading-relaxed"
              >
                {user ? `${user.displayName}, добро пожаловать!` : "Добро пожаловать!"}{" "}
                Выбери свой первый напиток — мы уже ждём.
              </motion.p>

              {/* Loyalty hint */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-[#f0e8e0]"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3ecf82]/30 to-[#1a7a44]/15 flex items-center justify-center text-xl">
                  ⭐
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[#0f3a20]">0 из 7</p>
                  <p className="text-[11px] text-gray-500">
                    Каждый 8-й напиток бесплатно!
                  </p>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[11px] text-gray-400 mt-6"
              >
                ул. Назарбаева 226 · холл БанкЦентрКредит
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="px-5 pb-8 pt-3 shrink-0">
        {step === "done" ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDone}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full py-4 rounded-2xl font-bold text-base text-white"
            style={{
              background: "linear-gradient(135deg, #d42b4f, #e85d7a)",
              boxShadow: "0 6px 24px rgba(212,43,79,0.28)",
            }}
          >
            Перейти к меню ☕
          </motion.button>
        ) : step === "permissions" ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            className="w-full py-4 rounded-2xl font-bold text-base text-white"
            style={{
              background: "linear-gradient(135deg, #d42b4f, #e85d7a)",
              boxShadow: "0 6px 24px rgba(212,43,79,0.28)",
            }}
          >
            {geoAsked || pushAsked ? "Готово ✨" : "Пропустить"}
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #d42b4f, #e85d7a)",
              boxShadow: "0 6px 24px rgba(212,43,79,0.28)",
            }}
          >
            {step === "welcome" && "Познакомимся ❤️"}
            {step === "team" && "Что внутри ✨"}
            {step === "features" && "Почти готово 🔔"}
          </motion.button>
        )}

        {step === "welcome" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-[10px] text-gray-400 mt-3"
          >
            ← свайп или тап →
          </motion.p>
        )}
      </div>
    </main>
  );
}