"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = { animate: { transition: { staggerChildren: 0.15 } } };

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    // Redirect based on role
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
    try {
      await signInWithGoogle();
    } catch {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (user) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <span className="text-3xl">{"\u2615"}</span>
            <span className="font-display text-2xl font-bold text-brand-text">Love is Coffee</span>
          </motion.div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-block bg-brand-mint/20 text-brand-dark text-sm font-medium px-4 py-1.5 rounded-full">v3.0</span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-3xl sm:text-5xl md:text-7xl font-bold text-brand-text mb-6 text-balance">
            {"Твой офис работает на "}<span className="text-brand-dark">кофе</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-brand-text/70 max-w-2xl mx-auto mb-10 text-balance">
            Love is Coffee — заказывай кофе, копи монеты, получай каждый 8-й бесплатный. Стрики, бонусы баристам и живая сцена кофейни.
          </motion.p>
          <motion.div variants={fadeUp}>
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 bg-white text-brand-text px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg border border-[#d0f0e0] hover:shadow-xl transition-shadow disabled:opacity-50"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {signingIn ? "Входим..." : "Войти через Google"}
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      <footer className="py-10 px-6 border-t border-[#d0f0e0]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{"\u2615"}</span>
            <span className="font-display font-bold text-brand-text">Love is Coffee</span>
          </div>
          <p className="text-brand-text/40 text-sm">&copy; {new Date().getFullYear()} LiC. Аксай, ул. Момышулы 14</p>
        </div>
      </footer>
    </main>
  );
}
