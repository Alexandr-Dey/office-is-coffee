"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Providers from "@/components/Providers";
import { useAuth } from "@/lib/auth";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.15 },
  },
};

const features = [
  {
    icon: "\u2615",
    title: "Групповые заказы",
    description: "Собирайте заказы кофе от всей команды в один тап. Никаких чатов в Slack.",
  },
  {
    icon: "\ud83e\udd1d",
    title: "Кофе-друзья",
    description: "Находите коллег со схожим вкусом. Стройте связи за чашкой эспрессо.",
  },
  {
    icon: "\ud83d\udcca",
    title: "Статистика офиса",
    description: "Смотрите кофе-культуру офиса \u2014 топ напитков, пиковые часы и тренды.",
  },
  {
    icon: "\ud83c\udfaf",
    title: "Умные рекомендации",
    description: "AI-подсказки на основе настроения, погоды и прошлых заказов.",
  },
];

export default function Home() {
  const { user, loading, hasAvatar, authError, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  /* После входа — редирект по наличию аватара */
  useEffect(() => {
    if (!loading && user && hasAvatar !== null) {
      if (hasAvatar) {
        router.replace("/office");
      } else {
        router.replace("/avatar");
      }
    }
  }, [user, loading, hasAvatar, router]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Ошибка входа:", err);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Providers>
      <main className="min-h-screen">
        {/* Навигация */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-3xl">{"\u2615"}</span>
              <span className="font-display text-2xl font-bold text-coffee-900">
                OiC
              </span>
            </motion.div>
            <motion.button
              onClick={handleSignIn}
              disabled={signingIn || loading}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-coffee-600 text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-coffee-700 transition-colors disabled:opacity-50"
            >
              {signingIn ? "Входим..." : "Войти через Google"}
            </motion.button>
          </div>
        </nav>

        {/* Герой */}
        <section className="pt-32 pb-20 px-6">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-block bg-coffee-100 text-coffee-700 text-sm font-medium px-4 py-1.5 rounded-full">
                Сейчас в бете
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl md:text-7xl font-bold text-coffee-950 mb-6 text-balance"
            >
              Твой офис работает на{" "}
              <span className="text-coffee-600">кофе</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-coffee-700 max-w-2xl mx-auto mb-10 text-balance"
            >
              OiC — социальная платформа, которая превращает кофе-паузы в командообразование.
              Заказывайте вместе, открывайте новые бленды и подпитывайте лучшую работу.
            </motion.p>
            <motion.div variants={fadeUp} className="flex gap-4 justify-center flex-wrap">
              <motion.button
                onClick={handleSignIn}
                disabled={signingIn || loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-coffee-600 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-coffee-700 transition-colors shadow-lg shadow-coffee-600/25 disabled:opacity-50 flex items-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#fff"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fff"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#fff"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {signingIn ? "Входим..." : "Войти через Google"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-coffee-300 text-coffee-700 px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-coffee-50 transition-colors"
              >
                Узнать больше
              </motion.button>
            </motion.div>
          </motion.div>
        </section>

        {/* Фичи */}
        <section className="py-20 px-6 bg-white/50">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl font-bold text-coffee-950 text-center mb-16"
            >
              Всё, что нужно твоему офису
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-coffee-100 hover:shadow-lg hover:border-coffee-200 transition-all"
                >
                  <span className="text-4xl block mb-4">{feature.icon}</span>
                  <h3 className="font-display text-xl font-semibold text-coffee-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-coffee-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto bg-gradient-to-br from-coffee-800 to-coffee-950 rounded-3xl p-12 text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Готовы преобразить кофе-культуру?
            </h2>
            <p className="text-coffee-200 text-lg mb-8 max-w-xl mx-auto">
              Присоединяйтесь к 500+ командам, которые уже строят лучшие связи в офисе.
            </p>
            <motion.button
              onClick={handleSignIn}
              disabled={signingIn || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-white text-coffee-900 px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-cream-100 transition-colors disabled:opacity-50"
            >
              {signingIn ? "Входим..." : "Начать сейчас"}
            </motion.button>
          </motion.div>
        </section>

        {/* Футер */}
        <footer className="py-10 px-6 border-t border-coffee-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{"\u2615"}</span>
              <span className="font-display font-bold text-coffee-900">
                Office is Coffee
              </span>
            </div>
            <p className="text-coffee-500 text-sm">
              &copy; {new Date().getFullYear()} OiC. Заряжаем команды, по чашке за раз.
            </p>
          </div>
        </footer>
      </main>
    </Providers>
  );
}
