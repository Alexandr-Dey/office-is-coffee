"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "@/lib/auth";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = { animate: { transition: { staggerChildren: 0.15 } } };

export default function Home() {
  const { user, loading, signInWithName } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [step, setStep] = useState<"name" | "role">("name");

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "barista" || user.role === "ceo") {
        router.replace("/admin");
      } else {
        /* Check onboarding */
        import("@/lib/firebase").then(({ getFirebaseDb }) => {
          import("firebase/firestore").then(({ doc, getDoc }) => {
            getDoc(doc(getFirebaseDb(), "users", user.uid)).then((snap) => {
              if (snap.exists() && snap.data().onboardingDone) {
                router.replace("/menu");
              } else {
                router.replace("/onboarding");
              }
            }).catch(() => router.replace("/menu"));
          });
        });
      }
    }
  }, [user, loading, router]);

  const handleNameNext = () => { if (!name.trim()) return; setStep("role"); };
  const handleRole = (role: Role) => { signInWithName(name.trim(), role); };

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <span className="text-3xl">\u2615</span>
            <span className="font-display text-2xl font-bold text-brand-text">Love is Coffee</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            {step === "name" ? (
              <>
                <input type="text" placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                  className="px-4 py-2 rounded-full border border-[#d0f0e0] text-sm text-brand-text w-36 focus:border-brand-mint focus:ring-1 focus:ring-brand-mint outline-none" />
                <motion.button onClick={handleNameNext} disabled={!name.trim()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="bg-brand-dark text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-brand-mid transition-colors disabled:opacity-50">
                  Далее
                </motion.button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <motion.button onClick={() => handleRole("client")} whileTap={{ scale: 0.95 }}
                  className="bg-brand-dark text-white px-4 py-2 rounded-full font-medium text-sm">\u2615 Клиент</motion.button>
                <motion.button onClick={() => handleRole("barista")} whileTap={{ scale: 0.95 }}
                  className="bg-brand-mid text-white px-4 py-2 rounded-full font-medium text-sm">\uD83E\uDDD1\u200D\uD83C\uDF73 Бариста</motion.button>
                <motion.button onClick={() => handleRole("ceo")} whileTap={{ scale: 0.95 }}
                  className="bg-brand-pink text-white px-4 py-2 rounded-full font-medium text-sm">\uD83D\uDC51 CEO</motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-block bg-brand-mint/20 text-brand-dark text-sm font-medium px-4 py-1.5 rounded-full">v3.0</span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-3xl sm:text-5xl md:text-7xl font-bold text-brand-text mb-6 text-balance">
            Твой офис работает на <span className="text-brand-dark">кофе</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-brand-text/70 max-w-2xl mx-auto mb-10 text-balance">
            Love is Coffee — заказывай кофе, копи монеты, получай каждый 8-й бесплатный. Стрики, бонусы баристам и живая сцена кофейни.
          </motion.p>
          <motion.div variants={fadeUp}>
            {step === "name" ? (
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                <input type="text" placeholder="Введите имя" value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                  className="flex-1 px-6 py-3.5 rounded-full border-2 border-[#d0f0e0] text-brand-text font-medium text-lg focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/30 outline-none" />
                <motion.button onClick={handleNameNext} disabled={!name.trim()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="bg-brand-dark text-white px-8 py-3.5 rounded-full font-semibold text-lg shadow-lg disabled:opacity-50 whitespace-nowrap">
                  Далее \u2192
                </motion.button>
              </div>
            ) : (
              <div className="max-w-lg mx-auto">
                <p className="text-brand-dark mb-6">Привет, <span className="font-bold text-brand-text">{name}</span>! Кто ты?</p>
                <div className="flex gap-4 justify-center flex-wrap">
                  {([
                    { role: "client" as Role, icon: "\u2615", title: "Я клиент", sub: "Заказываю кофе", color: "bg-brand-dark" },
                    { role: "barista" as Role, icon: "\uD83E\uDDD1\u200D\uD83C\uDF73", title: "Я бариста", sub: "Готовлю кофе", color: "bg-brand-mid" },
                    { role: "ceo" as Role, icon: "\uD83D\uDC51", title: "CEO", sub: "Управляю кофейней", color: "bg-brand-pink" },
                  ]).map((r) => (
                    <motion.div key={r.role} onClick={() => handleRole(r.role)}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.97 }}
                      className={`${r.color} text-white rounded-2xl p-6 min-w-[140px] cursor-pointer hover:shadow-lg transition-shadow`}>
                      <span className="text-4xl block mb-2">{r.icon}</span>
                      <h3 className="font-display text-lg font-bold mb-0.5">{r.title}</h3>
                      <p className="text-white/70 text-xs">{r.sub}</p>
                    </motion.div>
                  ))}
                </div>
                <button onClick={() => setStep("name")} className="text-brand-text/40 text-sm mt-5 hover:text-brand-dark transition-colors">
                  \u2190 Назад
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>

      <footer className="py-10 px-6 border-t border-[#d0f0e0]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">\u2615</span>
            <span className="font-display font-bold text-brand-text">Love is Coffee</span>
          </div>
          <p className="text-brand-text/40 text-sm">&copy; {new Date().getFullYear()} LiC. Аксай, ул. Момышулы 14</p>
        </div>
      </footer>
    </main>
  );
}
