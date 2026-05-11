"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import confetti from "canvas-confetti";
import { requestPushPermission } from "@/lib/push";
import { trackEvent } from "@/lib/mixpanel";

/* ───────────────────────────────────────────
   ONBOARDING v2 — три экрана:
   1. welcome  — бренд + адрес
   2. install  — добавление на главный экран (iOS / Android / Desktop)
   3. done     — push + переход в меню
   Если PWA уже установлена (display-mode: standalone) — install шаг
   пропускается автоматически.
   ─────────────────────────────────────────── */

type Step = "welcome" | "install" | "done";
type Platform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (navigator as NavigatorWithStandalone).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true
  );
}

/* ── slide variants ── */
const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

/* ═══════════════════════════════════════
   MAIN
   ═══════════════════════════════════════ */
export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [dir, setDir] = useState(1);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [standalone, setStandalone] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);

  /* Detect platform + capture beforeinstallprompt */
  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(detectStandalone());
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  /* Redirects */
  useEffect(() => {
    if (user && (user.role === "barista" || user.role === "ceo")) {
      router.replace("/admin");
      return;
    }
    if (user && user.onboardingDone) router.replace("/menu");
  }, [user, router]);

  const goTo = useCallback((target: Step, direction = 1) => {
    setDir(direction);
    setStep(target);
  }, []);

  const goFromWelcome = useCallback(() => {
    // Если PWA уже установлена — install шаг не нужен
    goTo(standalone ? "done" : "install", 1);
  }, [standalone, goTo]);

  const goFromInstall = useCallback(() => goTo("done", 1), [goTo]);

  const back = useCallback(() => {
    if (step === "install") goTo("welcome", -1);
    else if (step === "done") goTo(standalone ? "welcome" : "install", -1);
  }, [step, standalone, goTo]);

  const triggerNativeInstall = useCallback(async () => {
    if (!installEvent) return;
    setBusy(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      trackEvent("PWA Install Prompt", { outcome: choice.outcome });
      if (choice.outcome === "accepted") setStandalone(true);
    } catch { /* ignore */ }
    setInstallEvent(null);
    setBusy(false);
    goFromInstall();
  }, [installEvent, goFromInstall]);

  const finish = useCallback(
    async (askedPush: boolean) => {
      setBusy(true);
      if (user) {
        if (askedPush) {
          await requestPushPermission(user.uid).catch(() => {});
        }
        await setDoc(
          doc(getFirebaseDb(), "users", user.uid),
          { onboardingDone: true },
          { merge: true },
        ).catch(() => {});
      }
      trackEvent("Onboarding Completed", { askedPush, standalone, platform });
      confetti({
        particleCount: 90,
        spread: 70,
        colors: ["#d42b4f", "#e85d7a", "#1a7a44", "#3ecf82"],
      });
      setTimeout(() => router.replace("/menu"), 500);
    },
    [user, standalone, platform, router],
  );

  /* Swipe */
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return;
    const d = touchX - e.changedTouches[0].clientX;
    if (Math.abs(d) > 60) {
      if (d > 0) {
        if (step === "welcome") goFromWelcome();
        else if (step === "install") goFromInstall();
      } else {
        back();
      }
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
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 pt-3 mb-1"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        {step !== "welcome" ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={back}
            className="w-9 h-9 rounded-xl bg-[#d42b4f]/8 flex items-center justify-center text-[#d42b4f]"
          >
            ←
          </motion.button>
        ) : (
          <div className="w-9" />
        )}

        {/* Progress */}
        <div className="flex gap-2">
          {(["welcome", "install", "done"] as Step[]).map((s) => {
            const visible = s !== "install" || !standalone;
            if (!visible) return null;
            const active = s === step;
            return (
              <motion.div
                key={s}
                animate={{
                  width: active ? 28 : 8,
                  backgroundColor: active ? "#d42b4f" : "rgba(212,43,79,0.15)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="h-2 rounded-full"
              />
            );
          })}
        </div>

        {step !== "done" ? (
          <button
            onClick={() => goTo("done", 1)}
            className="text-xs text-gray-400 font-semibold"
          >
            Пропустить
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          {step === "welcome" && (
            <motion.div
              key="welcome"
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mb-6 overflow-hidden rounded-2xl w-[260px] h-[160px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/photos/logo-wall.jpg"
                  alt="Love is Coffee"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </motion.div>

              <h1 className="font-display text-[28px] font-extrabold text-[#d42b4f] leading-tight">
                Love is Coffee
              </h1>
              <p className="text-sm text-[#5a5048] mt-2 max-w-[280px]">
                Кофейня с душой в центре Алматы
              </p>

              <div className="mt-5 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#f0e8e0]">
                <div className="w-9 h-9 rounded-xl bg-[#d42b4f]/10 flex items-center justify-center">
                  📍
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[#0f3a20]">ул. Назарбаева 226</p>
                  <p className="text-[11px] text-gray-500">ТРЦ Самал Молл · холл БЦК</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === "install" && (
            <motion.div
              key="install"
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="absolute inset-0 overflow-y-auto px-5 pt-2 pb-4 flex flex-col"
            >
              <div className="text-center mb-5">
                <span className="text-4xl block mb-2">📲</span>
                <h2 className="font-display text-[22px] font-extrabold text-[#d42b4f]">
                  Добавь на главный экран
                </h2>
                <p className="text-xs text-gray-500 mt-1 max-w-[280px] mx-auto">
                  Открывается как обычное приложение и шлёт уведомления
                </p>
              </div>

              {platform === "ios" && <IOSInstructions />}
              {platform === "android" && (
                <AndroidInstructions
                  canAutoInstall={!!installEvent}
                  onAutoInstall={triggerNativeInstall}
                  busy={busy}
                />
              )}
              {platform === "desktop" && <DesktopInstructions />}
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-[100px] h-[100px] rounded-[28px] flex items-center justify-center text-[48px] mb-6"
                style={{
                  background: "linear-gradient(145deg, #d42b4f, #e85d7a)",
                  boxShadow: "0 12px 36px rgba(212,43,79,0.28)",
                }}
              >
                ☕
              </motion.div>

              <h2 className="font-display text-[24px] font-extrabold text-[#d42b4f]">
                {user?.displayName ? `Готово, ${user.displayName.split(" ")[0]}!` : "Готово!"}
              </h2>
              <p className="text-sm text-[#5a5048] mt-2 max-w-[280px]">
                Включить уведомления — узнаешь когда кофе готов?
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-8 pt-3 shrink-0 space-y-2">
        {step === "welcome" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goFromWelcome}
            className="w-full py-4 rounded-2xl font-bold text-base text-white"
            style={{
              background: "linear-gradient(135deg, #d42b4f, #e85d7a)",
              boxShadow: "0 6px 24px rgba(212,43,79,0.28)",
            }}
          >
            Поехали ☕
          </motion.button>
        )}

        {step === "install" && (
          <>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={goFromInstall}
              className="w-full py-4 rounded-2xl font-bold text-base text-white"
              style={{
                background: "linear-gradient(135deg, #d42b4f, #e85d7a)",
                boxShadow: "0 6px 24px rgba(212,43,79,0.28)",
              }}
            >
              Готово — продолжить
            </motion.button>
            <button
              onClick={goFromInstall}
              className="w-full py-2 text-xs text-gray-400 font-semibold"
            >
              Не сейчас — открыть в браузере
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => finish(true)}
              disabled={busy}
              className="w-full py-4 rounded-2xl font-bold text-base text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #d42b4f, #e85d7a)",
                boxShadow: "0 6px 24px rgba(212,43,79,0.28)",
              }}
            >
              {busy ? "Открываем…" : "Включить и в меню"}
            </motion.button>
            <button
              onClick={() => finish(false)}
              disabled={busy}
              className="w-full py-2 text-xs text-gray-400 font-semibold"
            >
              Без уведомлений
            </button>
          </>
        )}
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════
   PLATFORM INSTRUCTIONS
   ═══════════════════════════════════════ */

function StepRow({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-2xl p-3.5 border border-[#f0e8e0] shadow-sm">
      <div className="w-7 h-7 rounded-full bg-[#d42b4f] text-white text-sm font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <div className="text-sm text-[#0f3a20] leading-snug pt-0.5">{children}</div>
    </div>
  );
}

function IOSInstructions() {
  return (
    <div className="space-y-2.5">
      <StepRow n={1}>
        Нажми кнопку <span className="font-bold">«Поделиться»</span>{" "}
        <span className="px-1.5 py-0.5 bg-[#f0e8e0] rounded text-[12px]">⎙</span> внизу
        браузера
      </StepRow>
      <StepRow n={2}>
        Выбери <span className="font-bold">«На экран „Домой“»</span>
      </StepRow>
      <StepRow n={3}>
        Нажми <span className="font-bold">«Добавить»</span> справа сверху — на рабочем
        столе появится иконка
      </StepRow>
      <p className="text-[11px] text-gray-500 text-center pt-2">
        Открывай Love is Coffee всегда с этой иконки — push заработает
      </p>
    </div>
  );
}

function AndroidInstructions({
  canAutoInstall,
  onAutoInstall,
  busy,
}: {
  canAutoInstall: boolean;
  onAutoInstall: () => void;
  busy: boolean;
}) {
  if (canAutoInstall) {
    return (
      <div className="space-y-3">
        <div className="bg-gradient-to-br from-[#1a7a44] to-[#2d9e5a] rounded-2xl p-5 text-center text-white">
          <span className="text-4xl block mb-2">⚡</span>
          <p className="font-extrabold text-lg">Одна кнопка</p>
          <p className="text-sm text-white/85 mt-1">Chrome сам всё установит</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAutoInstall}
          disabled={busy}
          className="w-full py-4 rounded-2xl bg-[#1a7a44] text-white font-extrabold text-base disabled:opacity-60"
        >
          {busy ? "Устанавливаем…" : "Установить как приложение"}
        </motion.button>
        <p className="text-[11px] text-gray-500 text-center">
          Или вручную: меню <span className="font-bold">⋮</span> → «Добавить на главный экран»
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <StepRow n={1}>
        Открой меню <span className="font-bold">⋮</span> справа сверху в Chrome
      </StepRow>
      <StepRow n={2}>
        Выбери <span className="font-bold">«Установить приложение»</span> или
        <span className="font-bold"> «На главный экран»</span>
      </StepRow>
      <StepRow n={3}>Открой иконку с рабочего стола</StepRow>
    </div>
  );
}

function DesktopInstructions() {
  return (
    <div className="space-y-2.5">
      <StepRow n={1}>
        В Chrome / Edge нажми значок <span className="font-bold">⊕</span> справа в адресной
        строке
      </StepRow>
      <StepRow n={2}>
        Выбери <span className="font-bold">«Установить»</span> — Love is Coffee откроется в
        отдельном окне
      </StepRow>
      <p className="text-[11px] text-gray-500 text-center pt-2">
        На телефоне будет красивее — можешь продолжить в браузере
      </p>
    </div>
  );
}
