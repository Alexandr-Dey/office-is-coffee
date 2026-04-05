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
    title: "\u0413\u0440\u0443\u043F\u043F\u043E\u0432\u044B\u0435 \u0437\u0430\u043A\u0430\u0437\u044B",
    description: "\u0421\u043E\u0431\u0438\u0440\u0430\u0439\u0442\u0435 \u0437\u0430\u043A\u0430\u0437\u044B \u043A\u043E\u0444\u0435 \u043E\u0442 \u0432\u0441\u0435\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0432 \u043E\u0434\u0438\u043D \u0442\u0430\u043F. \u041D\u0438\u043A\u0430\u043A\u0438\u0445 \u0447\u0430\u0442\u043E\u0432 \u0432 Slack.",
  },
  {
    icon: "\ud83e\udd1d",
    title: "\u041A\u043E\u0444\u0435-\u0434\u0440\u0443\u0437\u044C\u044F",
    description: "\u041D\u0430\u0445\u043E\u0434\u0438\u0442\u0435 \u043A\u043E\u043B\u043B\u0435\u0433 \u0441\u043E \u0441\u0445\u043E\u0436\u0438\u043C \u0432\u043A\u0443\u0441\u043E\u043C. \u0421\u0442\u0440\u043E\u0439\u0442\u0435 \u0441\u0432\u044F\u0437\u0438 \u0437\u0430 \u0447\u0430\u0448\u043A\u043E\u0439 \u044D\u0441\u043F\u0440\u0435\u0441\u0441\u043E.",
  },
  {
    icon: "\ud83d\udcca",
    title: "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043E\u0444\u0438\u0441\u0430",
    description: "\u0421\u043C\u043E\u0442\u0440\u0438\u0442\u0435 \u043A\u043E\u0444\u0435-\u043A\u0443\u043B\u044C\u0442\u0443\u0440\u0443 \u043E\u0444\u0438\u0441\u0430 \u2014 \u0442\u043E\u043F \u043D\u0430\u043F\u0438\u0442\u043A\u043E\u0432, \u043F\u0438\u043A\u043E\u0432\u044B\u0435 \u0447\u0430\u0441\u044B \u0438 \u0442\u0440\u0435\u043D\u0434\u044B.",
  },
  {
    icon: "\ud83c\udfaf",
    title: "\u0423\u043C\u043D\u044B\u0435 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438",
    description: "AI-\u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438 \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044F, \u043F\u043E\u0433\u043E\u0434\u044B \u0438 \u043F\u0440\u043E\u0448\u043B\u044B\u0445 \u0437\u0430\u043A\u0430\u0437\u043E\u0432.",
  },
];

export default function Home() {
  const { user, loading, hasAvatar, signInWithName } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [step, setStep] = useState<"name" | "role">("name");

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "barista") {
        router.replace("/admin");
      } else if (hasAvatar) {
        router.replace("/office");
      } else {
        router.replace("/avatar");
      }
    }
  }, [user, loading, hasAvatar, router]);

  const handleNameNext = () => {
    if (!name.trim()) return;
    setStep("role");
  };

  const handleRole = (role: "client" | "barista") => {
    signInWithName(name.trim(), role);
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
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              {step === "name" ? (
                <>
                  <input
                    type="text"
                    placeholder={"\u0412\u0430\u0448\u0435 \u0438\u043C\u044F"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                    className="px-4 py-2 rounded-full border border-coffee-200 text-sm text-coffee-900 w-36 focus:border-coffee-500 focus:ring-1 focus:ring-coffee-200 outline-none"
                  />
                  <motion.button
                    onClick={handleNameNext}
                    disabled={!name.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-coffee-600 text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-coffee-700 transition-colors disabled:opacity-50"
                  >
                    {"\u0414\u0430\u043B\u0435\u0435"}
                  </motion.button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => handleRole("client")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-coffee-600 text-white px-4 py-2 rounded-full font-medium text-sm"
                  >
                    {"\u2615 \u041A\u043B\u0438\u0435\u043D\u0442"}
                  </motion.button>
                  <motion.button
                    onClick={() => handleRole("barista")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-coffee-800 text-white px-4 py-2 rounded-full font-medium text-sm"
                  >
                    {"\u{1F9D1}\u200D\u{1F373} \u0411\u0430\u0440\u0438\u0441\u0442\u0430"}
                  </motion.button>
                </div>
              )}
            </motion.div>
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
                {"\u0421\u0435\u0439\u0447\u0430\u0441 \u0432 \u0431\u0435\u0442\u0435"}
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl md:text-7xl font-bold text-coffee-950 mb-6 text-balance"
            >
              {"\u0422\u0432\u043E\u0439 \u043E\u0444\u0438\u0441 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 "}
              <span className="text-coffee-600">{"\u043A\u043E\u0444\u0435"}</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-coffee-700 max-w-2xl mx-auto mb-10 text-balance"
            >
              OiC {"\u2014"} {"\u0441\u043E\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043A\u043E\u0444\u0435-\u043F\u0430\u0443\u0437\u044B \u0432 \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0435. \u0417\u0430\u043A\u0430\u0437\u044B\u0432\u0430\u0439\u0442\u0435 \u0432\u043C\u0435\u0441\u0442\u0435, \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0439\u0442\u0435 \u043D\u043E\u0432\u044B\u0435 \u0431\u043B\u0435\u043D\u0434\u044B \u0438 \u043F\u043E\u0434\u043F\u0438\u0442\u044B\u0432\u0430\u0439\u0442\u0435 \u043B\u0443\u0447\u0448\u0443\u044E \u0440\u0430\u0431\u043E\u0442\u0443."}
            </motion.p>
            <motion.div variants={fadeUp}>
              {step === "name" ? (
                <div className="flex gap-3 justify-center items-center max-w-md mx-auto">
                  <input
                    type="text"
                    placeholder={"\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                    className="flex-1 px-6 py-3.5 rounded-full border-2 border-coffee-200 text-coffee-900 font-medium text-lg focus:border-coffee-500 focus:ring-2 focus:ring-coffee-200 outline-none"
                  />
                  <motion.button
                    onClick={handleNameNext}
                    disabled={!name.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-coffee-600 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-coffee-700 transition-colors shadow-lg shadow-coffee-600/25 disabled:opacity-50 whitespace-nowrap"
                  >
                    {"\u0414\u0430\u043B\u0435\u0435 \u2192"}
                  </motion.button>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <p className="text-coffee-600 mb-4">{"\u041F\u0440\u0438\u0432\u0435\u0442, "}<span className="font-bold text-coffee-900">{name}</span>{"! \u041A\u0442\u043E \u0442\u044B?"}</p>
                  <div className="flex gap-4 justify-center">
                    <motion.button
                      onClick={() => handleRole("client")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-coffee-600 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-coffee-700 transition-colors shadow-lg shadow-coffee-600/25"
                    >
                      {"\u2615 \u041A\u043B\u0438\u0435\u043D\u0442"}
                    </motion.button>
                    <motion.button
                      onClick={() => handleRole("barista")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-coffee-800 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-coffee-900 transition-colors shadow-lg shadow-coffee-800/25"
                    >
                      {"\u{1F9D1}\u200D\u{1F373} \u0411\u0430\u0440\u0438\u0441\u0442\u0430"}
                    </motion.button>
                  </div>
                  <button onClick={() => setStep("name")} className="text-coffee-400 text-sm mt-3 hover:text-coffee-600">
                    {"\u2190 \u041D\u0430\u0437\u0430\u0434"}
                  </button>
                </div>
              )}
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
              {"\u0412\u0441\u0451, \u0447\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0442\u0432\u043E\u0435\u043C\u0443 \u043E\u0444\u0438\u0441\u0443"}
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
              {"\u0413\u043E\u0442\u043E\u0432\u044B \u043F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u0438\u0442\u044C \u043A\u043E\u0444\u0435-\u043A\u0443\u043B\u044C\u0442\u0443\u0440\u0443?"}
            </h2>
            <p className="text-coffee-200 text-lg mb-8 max-w-xl mx-auto">
              {"\u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0439\u0442\u0435\u0441\u044C \u043A 500+ \u043A\u043E\u043C\u0430\u043D\u0434\u0430\u043C, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0443\u0436\u0435 \u0441\u0442\u0440\u043E\u044F\u0442 \u043B\u0443\u0447\u0448\u0438\u0435 \u0441\u0432\u044F\u0437\u0438 \u0432 \u043E\u0444\u0438\u0441\u0435."}
            </p>
            <div className="flex gap-3 justify-center items-center max-w-md mx-auto">
              <input
                type="text"
                placeholder={"\u0412\u0430\u0448\u0435 \u0438\u043C\u044F"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                className="flex-1 px-6 py-3.5 rounded-full text-coffee-900 font-medium text-lg outline-none"
              />
              <motion.button
                onClick={handleNameNext}
                disabled={!name.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-coffee-900 px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-cream-100 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {"\u041D\u0430\u0447\u0430\u0442\u044C"}
              </motion.button>
            </div>
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
              &copy; {new Date().getFullYear()} OiC. {"\u0417\u0430\u0440\u044F\u0436\u0430\u0435\u043C \u043A\u043E\u043C\u0430\u043D\u0434\u044B, \u043F\u043E \u0447\u0430\u0448\u043A\u0435 \u0437\u0430 \u0440\u0430\u0437."}
            </p>
          </div>
        </footer>
      </main>
    </Providers>
  );
}
