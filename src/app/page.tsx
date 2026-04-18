"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = { animate: { transition: { staggerChildren: 0.15 } } };

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const { user, firebaseUser, loading, connectionError, signInWithGoogle, signInAsGuest } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "1";
  const [signingIn, setSigningIn] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [showGuest, setShowGuest] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "barista") {
      router.replace("/admin");
    } else if (user.role === "ceo") {
      router.replace("/ceo");
    } else if (!user.onboardingDone) {
      router.replace("/onboarding");
    } else {
      router.replace("/menu");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError("");
    try {
      await signInWithGoogle();
      // На десктопе popup закрылся, onAuthStateChanged скоро сработает.
      // На мобилке signInWithRedirect перезагрузит страницу — сюда не дойдём.
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      const silentErrors = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
      if (silentErrors.includes(code)) {
        setSigningIn(false);
        return;
      }
      const errorMessages: Record<string, string> = {
        "auth/popup-blocked": "Браузер заблокировал окно входа. Разрешите всплывающие окна.",
        "auth/network-request-failed": "Проблема с интернетом. Проверьте подключение.",
        "auth/unauthorized-domain": "Сайт не настроен для входа. Сообщите администратору.",
        "auth/operation-not-allowed": "Вход через Google отключён. Сообщите администратору.",
      };
      setAuthError(errorMessages[code] ?? `Ошибка входа: ${code || "unknown"}`);
      Sentry.captureException(e, {
        tags: { auth_method: "google" },
        extra: { code },
      });
      console.error("Google sign-in error:", e);
      setSigningIn(false);
    }
  };

  // Safety: если signingIn застрял (popup завис, onAuthStateChanged не сработал) — сбросить через 30с
  useEffect(() => {
    if (!signingIn) return;
    const t = setTimeout(() => setSigningIn(false), 30000);
    return () => clearTimeout(t);
  }, [signingIn]);

  const handleGuestSignIn = async () => {
    const trimmed = guestName.trim();
    if (!trimmed) return;
    setSigningIn(true);
    setAuthError("");
    try {
      await signInAsGuest(trimmed);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      const msg = code === "auth/network-request-failed"
        ? "Проблема с интернетом. Проверьте подключение."
        : `Не удалось войти: ${code || "unknown"}`;
      setAuthError(msg);
      Sentry.captureException(e, {
        tags: { auth_method: "guest" },
        extra: { code },
      });
      console.error("Guest sign-in error:", e);
      setSigningIn(false);
    }
  };

  if (loading && !connectionError) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (connectionError && !user) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">☕</p>
          <h2 className="font-display text-xl font-bold text-brand-text mb-2">Не удалось подключиться</h2>
          <p className="text-sm text-brand-text/60 mb-6">Проверьте интернет и попробуйте снова</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand-dark text-white font-bold rounded-xl">
            Повторить
          </button>
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin mx-auto" />
          {debug && (
            <div className="mt-4 p-3 bg-gray-900 text-green-400 rounded-xl text-[11px] font-mono text-left">
              <p>AUTH DEBUG (redirecting...)</p>
              <p>uid: {user.uid.slice(0,8)}.. | {user.email ?? "anon"}</p>
              <p>role: {user.role} | onboarding: {String(user.onboardingDone)}</p>
              <p>→ {user.role === "barista" ? "/admin" : user.role === "ceo" ? "/ceo" : !user.onboardingDone ? "/onboarding" : "/menu"}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          <span className="text-3xl">☕</span>
          <span className="font-display text-2xl font-bold text-brand-text">Love is Coffee</span>
        </motion.div>
      </div>

      {/* Hero */}
      <section className="flex-1 flex items-center px-6 py-10">
        <motion.div variants={stagger} initial="initial" animate="animate" className="w-full max-w-md mx-auto text-center">
          <motion.div variants={fadeUp} className="mb-4">
            <span className="inline-block bg-brand-mint/20 text-brand-dark text-sm font-medium px-4 py-1.5 rounded-full">Кофейня Love is Coffee</span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-3xl font-bold text-brand-text mb-3">
            Заказывай кофе,{" "}
            <span className="text-brand-dark">копи монеты</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-brand-text/60 mb-8">
            Каждый 8-й кофе бесплатный. Стрики, бонусы и живая сцена кофейни.
          </motion.p>

          <motion.div variants={fadeUp} className="space-y-3">
            {authError && <p className="text-sm text-red-500 text-center mb-2">{authError}</p>}

            {/* Google Sign In */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-3 bg-white text-brand-text px-6 py-3.5 rounded-xl font-semibold text-base shadow-md border border-[#d0f0e0] disabled:opacity-50 min-h-[48px]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {signingIn ? "Входим..." : "Войти через Google"}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#d0f0e0]" />
              <span className="text-xs text-brand-text/40">или</span>
              <div className="flex-1 h-px bg-[#d0f0e0]" />
            </div>

            {/* Guest Sign In */}
            {!showGuest ? (
              <motion.button
                onClick={() => setShowGuest(true)}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-semibold text-base text-brand-dark bg-brand-bg border border-[#d0f0e0] min-h-[48px]"
              >
                Войти как гость
              </motion.button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGuestSignIn()}
                  placeholder="Как тебя зовут?"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint focus:ring-1 focus:ring-brand-mint outline-none text-base text-brand-text bg-white min-h-[48px]"
                />
                <motion.button
                  onClick={handleGuestSignIn}
                  disabled={signingIn || !guestName.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 bg-brand-dark text-white font-bold rounded-xl text-base disabled:opacity-50 min-h-[48px]"
                >
                  {signingIn ? "Входим..." : "Начать ☕"}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Debug panel — ?debug=1 */}
      {debug && (
        <div className="mx-4 mb-2 p-3 bg-gray-900 text-green-400 rounded-xl text-[11px] font-mono leading-relaxed">
          <p>AUTH DEBUG</p>
          <p>loading: {String(loading)} | signingIn: {String(signingIn)}</p>
          <p>connectionError: {String(connectionError)}</p>
          <p>firebaseUser: {String(!!firebaseUser)}</p>
          <p>user: null (login screen)</p>
          <p>authError: {authError || "none"}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-[#d0f0e0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">☕</span>
            <span className="font-display font-bold text-brand-text text-sm">Love is Coffee</span>
          </div>
          <p className="text-brand-text/30 text-xs">ул. Назарбаева 226 · БанкЦентрКредит</p>
        </div>
      </footer>
    </main>
  );
}
