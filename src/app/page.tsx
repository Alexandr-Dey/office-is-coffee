"use client";

import { motion } from "framer-motion";
import Providers from "@/components/Providers";

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
              <span className="text-3xl">\u2615</span>
              <span className="font-display text-2xl font-bold text-coffee-900">
                OiC
              </span>
            </motion.div>
            <motion.a
              href="/avatar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-coffee-600 text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-coffee-700 transition-colors"
            >
              Создать аватар
            </motion.a>
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
              OiC \u2014 социальная платформа, которая превращает кофе-паузы в командообразование.
              Заказывайте вместе, открывайте новые бленды и подпитывайте лучшую работу.
            </motion.p>
            <motion.div variants={fadeUp} className="flex gap-4 justify-center">
              <motion.a
                href="/avatar"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-coffee-600 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-coffee-700 transition-colors shadow-lg shadow-coffee-600/25"
              >
                Начать сейчас
              </motion.a>
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
            <motion.a
              href="/avatar"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-white text-coffee-900 px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-cream-100 transition-colors"
            >
              Создать аватар
            </motion.a>
          </motion.div>
        </section>

        {/* Футер */}
        <footer className="py-10 px-6 border-t border-coffee-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">\u2615</span>
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
