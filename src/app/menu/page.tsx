"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════
   ДАННЫЕ МЕНЮ LOVE IS COFFEE
   ═══════════════════════════════════════════ */
interface MenuItem {
  name: string;
  price: number;
  desc: string;
  tag?: string;
}

interface MenuCategory {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
}

const MENU_DATA: MenuCategory[] = [
  {
    id: "coffee",
    title: "\u041A\u043E\u0444\u0435",
    icon: "\u2615",
    items: [
      { name: "\u042D\u0441\u043F\u0440\u0435\u0441\u0441\u043E", price: 150, desc: "\u041A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u044D\u0441\u043F\u0440\u0435\u0441\u0441\u043E, 30 \u043C\u043B" },
      { name: "\u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u044D\u0441\u043F\u0440\u0435\u0441\u0441\u043E", price: 190, desc: "\u0414\u0432\u043E\u0439\u043D\u0430\u044F \u043F\u043E\u0440\u0446\u0438\u044F, 60 \u043C\u043B" },
      { name: "\u0410\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u043E", price: 180, desc: "\u042D\u0441\u043F\u0440\u0435\u0441\u0441\u043E \u0441 \u0433\u043E\u0440\u044F\u0447\u0435\u0439 \u0432\u043E\u0434\u043E\u0439, 200 \u043C\u043B" },
      { name: "\u041A\u0430\u043F\u0443\u0447\u0438\u043D\u043E", price: 220, desc: "\u042D\u0441\u043F\u0440\u0435\u0441\u0441\u043E + \u0432\u0437\u0431\u0438\u0442\u043E\u0435 \u043C\u043E\u043B\u043E\u043A\u043E, 250 \u043C\u043B", tag: "\u0425\u0438\u0442" },
      { name: "\u041B\u0430\u0442\u0442\u0435", price: 250, desc: "\u041C\u044F\u0433\u043A\u0438\u0439 \u043A\u043E\u0444\u0435 \u0441 \u043C\u043E\u043B\u043E\u043A\u043E\u043C, 300 \u043C\u043B" },
      { name: "\u0424\u043B\u044D\u0442 \u0423\u0430\u0439\u0442", price: 260, desc: "\u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u044D\u0441\u043F\u0440\u0435\u0441\u0441\u043E + \u043C\u0438\u043A\u0440\u043E\u043F\u0435\u043D\u0430, 200 \u043C\u043B" },
      { name: "\u0420\u0430\u0444", price: 280, desc: "\u041A\u043E\u0444\u0435 \u0441\u043E \u0441\u043B\u0438\u0432\u043A\u0430\u043C\u0438 \u0438 \u0432\u0430\u043D\u0438\u043B\u044C\u043D\u044B\u043C \u0441\u0430\u0445\u0430\u0440\u043E\u043C, 300 \u043C\u043B", tag: "\u0425\u0438\u0442" },
      { name: "\u041C\u043E\u043A\u043A\u043E", price: 290, desc: "\u042D\u0441\u043F\u0440\u0435\u0441\u0441\u043E + \u0448\u043E\u043A\u043E\u043B\u0430\u0434 + \u043C\u043E\u043B\u043E\u043A\u043E, 300 \u043C\u043B" },
      { name: "\u041A\u0430\u043F\u0443\u0447\u0438\u043D\u043E \u043A\u0430\u0440\u0430\u043C\u0435\u043B\u044C", price: 260, desc: "\u041A\u0430\u043F\u0443\u0447\u0438\u043D\u043E \u0441 \u043A\u0430\u0440\u0430\u043C\u0435\u043B\u044C\u043D\u044B\u043C \u0441\u0438\u0440\u043E\u043F\u043E\u043C" },
      { name: "\u041B\u0430\u0442\u0442\u0435 \u043B\u0430\u0432\u0430\u043D\u0434\u0430", price: 280, desc: "\u041B\u0430\u0442\u0442\u0435 \u0441 \u043B\u0430\u0432\u0430\u043D\u0434\u043E\u0432\u044B\u043C \u0441\u0438\u0440\u043E\u043F\u043E\u043C", tag: "New" },
    ],
  },
  {
    id: "tea",
    title: "\u0427\u0430\u0439",
    icon: "\uD83C\uDF75",
    items: [
      { name: "\u0427\u0451\u0440\u043D\u044B\u0439 \u0447\u0430\u0439", price: 150, desc: "\u041A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0447\u0451\u0440\u043D\u044B\u0439 \u0447\u0430\u0439, 400 \u043C\u043B" },
      { name: "\u0417\u0435\u043B\u0451\u043D\u044B\u0439 \u0447\u0430\u0439", price: 160, desc: "\u041A\u0438\u0442\u0430\u0439\u0441\u043A\u0438\u0439 \u0437\u0435\u043B\u0451\u043D\u044B\u0439 \u0447\u0430\u0439, 400 \u043C\u043B" },
      { name: "\u041C\u0430\u0442\u0447\u0430 \u043B\u0430\u0442\u0442\u0435", price: 280, desc: "\u042F\u043F\u043E\u043D\u0441\u043A\u0438\u0439 \u043C\u0430\u0442\u0447\u0430 \u043D\u0430 \u043C\u043E\u043B\u043E\u043A\u0435, 300 \u043C\u043B", tag: "\u0425\u0438\u0442" },
      { name: "\u041E\u0431\u043B\u0435\u043F\u0438\u0445\u043E\u0432\u044B\u0439 \u0447\u0430\u0439", price: 250, desc: "\u0413\u043E\u0440\u044F\u0447\u0438\u0439 \u0447\u0430\u0439 \u0441 \u043E\u0431\u043B\u0435\u043F\u0438\u0445\u043E\u0439 \u0438 \u043C\u0451\u0434\u043E\u043C" },
      { name: "\u0418\u043C\u0431\u0438\u0440\u043D\u044B\u0439 \u0447\u0430\u0439", price: 220, desc: "\u0427\u0430\u0439 \u0441 \u0438\u043C\u0431\u0438\u0440\u0451\u043C, \u043B\u0438\u043C\u043E\u043D\u043E\u043C \u0438 \u043C\u0451\u0434\u043E\u043C" },
      { name: "\u0418\u0432\u0430\u043D-\u0447\u0430\u0439", price: 180, desc: "\u0422\u0440\u0430\u0434\u0438\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u0447\u0430\u0439, 400 \u043C\u043B" },
    ],
  },
  {
    id: "cold",
    title: "\u0425\u043E\u043B\u043E\u0434\u043D\u044B\u0435 \u043D\u0430\u043F\u0438\u0442\u043A\u0438",
    icon: "\uD83E\uDDCA",
    items: [
      { name: "\u0410\u0439\u0441 \u043B\u0430\u0442\u0442\u0435", price: 270, desc: "\u041B\u0430\u0442\u0442\u0435 \u0441\u043E \u043B\u044C\u0434\u043E\u043C, 350 \u043C\u043B", tag: "\u0425\u0438\u0442" },
      { name: "\u0410\u0439\u0441 \u0430\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u043E", price: 220, desc: "\u0410\u043C\u0435\u0440\u0438\u043A\u0430\u043D\u043E \u0441\u043E \u043B\u044C\u0434\u043E\u043C, 300 \u043C\u043B" },
      { name: "\u041A\u043E\u043B\u0434 \u0431\u0440\u044E", price: 300, desc: "\u041A\u043E\u0444\u0435 \u0445\u043E\u043B\u043E\u0434\u043D\u043E\u0439 \u0437\u0430\u0432\u0430\u0440\u043A\u0438, 300 \u043C\u043B" },
      { name: "\u041B\u0438\u043C\u043E\u043D\u0430\u0434 \u043A\u043B\u0430\u0441\u0441\u0438\u043A", price: 220, desc: "\u0414\u043E\u043C\u0430\u0448\u043D\u0438\u0439 \u043B\u0438\u043C\u043E\u043D\u0430\u0434, 400 \u043C\u043B" },
      { name: "\u041B\u0438\u043C\u043E\u043D\u0430\u0434 \u043C\u0430\u043D\u0433\u043E", price: 260, desc: "\u0422\u0440\u043E\u043F\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043B\u0438\u043C\u043E\u043D\u0430\u0434 \u0441 \u043C\u0430\u043D\u0433\u043E", tag: "New" },
      { name: "\u0424\u0440\u0430\u043F\u043F\u0435", price: 280, desc: "\u041A\u043E\u0444\u0435\u0439\u043D\u044B\u0439 \u043A\u043E\u043A\u0442\u0435\u0439\u043B\u044C \u0441\u043E \u043B\u044C\u0434\u043E\u043C" },
      { name: "\u0421\u043C\u0443\u0437\u0438 \u044F\u0433\u043E\u0434\u043D\u044B\u0439", price: 320, desc: "\u041C\u0438\u043A\u0441 \u043B\u0435\u0441\u043D\u044B\u0445 \u044F\u0433\u043E\u0434 \u0441 \u0439\u043E\u0433\u0443\u0440\u0442\u043E\u043C" },
    ],
  },
  {
    id: "food",
    title: "\u0415\u0434\u0430",
    icon: "\uD83E\uDD50",
    items: [
      { name: "\u041A\u0440\u0443\u0430\u0441\u0441\u0430\u043D", price: 180, desc: "\u0421\u0432\u0435\u0436\u0438\u0439 \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0438\u0439 \u043A\u0440\u0443\u0430\u0441\u0441\u0430\u043D" },
      { name: "\u041A\u0440\u0443\u0430\u0441\u0441\u0430\u043D \u0441 \u0432\u0435\u0442\u0447\u0438\u043D\u043E\u0439", price: 250, desc: "\u041A\u0440\u0443\u0430\u0441\u0441\u0430\u043D \u0441 \u0432\u0435\u0442\u0447\u0438\u043D\u043E\u0439 \u0438 \u0441\u044B\u0440\u043E\u043C" },
      { name: "\u0427\u0438\u0437\u043A\u0435\u0439\u043A", price: 320, desc: "\u041D\u044C\u044E-\u0419\u043E\u0440\u043A \u0447\u0438\u0437\u043A\u0435\u0439\u043A", tag: "\u0425\u0438\u0442" },
      { name: "\u0422\u0438\u0440\u0430\u043C\u0438\u0441\u0443", price: 350, desc: "\u0418\u0442\u0430\u043B\u044C\u044F\u043D\u0441\u043A\u0438\u0439 \u0434\u0435\u0441\u0435\u0440\u0442 \u0441 \u043A\u043E\u0444\u0435" },
      { name: "\u041C\u0430\u0444\u0444\u0438\u043D \u0448\u043E\u043A\u043E\u043B\u0430\u0434\u043D\u044B\u0439", price: 160, desc: "\u0414\u043E\u043C\u0430\u0448\u043D\u0438\u0439 \u043C\u0430\u0444\u0444\u0438\u043D \u0441 \u0448\u043E\u043A\u043E\u043B\u0430\u0434\u043E\u043C" },
      { name: "\u0411\u0440\u0430\u0443\u043D\u0438", price: 220, desc: "\u0428\u043E\u043A\u043E\u043B\u0430\u0434\u043D\u044B\u0439 \u0431\u0440\u0430\u0443\u043D\u0438 \u0441 \u043E\u0440\u0435\u0445\u0430\u043C\u0438" },
      { name: "\u041C\u0435\u0434\u043E\u0432\u0438\u043A", price: 280, desc: "\u041A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043C\u0435\u0434\u043E\u0432\u044B\u0439 \u0442\u043E\u0440\u0442" },
      { name: "\u041A\u0443\u043A\u0438 \u043E\u0432\u0441\u044F\u043D\u043E\u0435", price: 120, desc: "\u041E\u0432\u0441\u044F\u043D\u043E\u0435 \u043F\u0435\u0447\u0435\u043D\u044C\u0435 \u0441 \u0438\u0437\u044E\u043C\u043E\u043C" },
    ],
  },
  {
    id: "breakfast",
    title: "\u0417\u0430\u0432\u0442\u0440\u0430\u043A\u0438",
    icon: "\uD83C\uDF73",
    items: [
      { name: "\u0421\u044B\u0440\u043D\u0438\u043A\u0438", price: 290, desc: "\u0414\u043E\u043C\u0430\u0448\u043D\u0438\u0435 \u0441\u044B\u0440\u043D\u0438\u043A\u0438 \u0441\u043E \u0441\u043C\u0435\u0442\u0430\u043D\u043E\u0439", tag: "\u0425\u0438\u0442" },
      { name: "\u041E\u0432\u0441\u044F\u043D\u043A\u0430 \u0441 \u044F\u0433\u043E\u0434\u0430\u043C\u0438", price: 250, desc: "\u041E\u0432\u0441\u044F\u043D\u0430\u044F \u043A\u0430\u0448\u0430 \u0441 \u0441\u0435\u0437\u043E\u043D\u043D\u044B\u043C\u0438 \u044F\u0433\u043E\u0434\u0430\u043C\u0438" },
      { name: "\u0422\u043E\u0441\u0442 \u0441 \u0430\u0432\u043E\u043A\u0430\u0434\u043E", price: 320, desc: "\u0422\u043E\u0441\u0442 + \u0430\u0432\u043E\u043A\u0430\u0434\u043E + \u044F\u0439\u0446\u043E \u043F\u0430\u0448\u043E\u0442" },
      { name: "\u042F\u0438\u0447\u043D\u0438\u0446\u0430", price: 240, desc: "\u042F\u0438\u0447\u043D\u0438\u0446\u0430 \u0438\u0437 3 \u044F\u0438\u0446 \u0441 \u043E\u0432\u043E\u0449\u0430\u043C\u0438" },
      { name: "\u0411\u043E\u0443\u043B \u0441 \u0433\u0440\u0430\u043D\u043E\u043B\u043E\u0439", price: 280, desc: "\u0413\u0440\u0430\u043D\u043E\u043B\u0430 + \u0439\u043E\u0433\u0443\u0440\u0442 + \u0444\u0440\u0443\u043A\u0442\u044B" },
      { name: "\u041F\u0430\u043D\u043A\u0435\u0439\u043A\u0438", price: 270, desc: "\u041F\u0443\u0448\u0438\u0441\u0442\u044B\u0435 \u043F\u0430\u043D\u043A\u0435\u0439\u043A\u0438 \u0441 \u043A\u043B\u0435\u043D\u043E\u0432\u044B\u043C \u0441\u0438\u0440\u043E\u043F\u043E\u043C", tag: "New" },
    ],
  },
];

/* ═══════════════════════════════════════════
   СТРАНИЦА МЕНЮ
   ═══════════════════════════════════════════ */
export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("coffee");

  const currentCategory = MENU_DATA.find((c) => c.id === activeCategory) ?? MENU_DATA[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      {/* навбар */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-2xl">{"\u2615"}</span>
            <span className="font-display text-xl font-bold text-coffee-900">OiC</span>
          </motion.a>
          <motion.a
            href="/office"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-coffee-500 hover:text-coffee-700 transition-colors"
          >
            {"\u2190 \u0412 \u043E\u0444\u0438\u0441"}
          </motion.a>
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-full mb-4">
              <span className="text-lg">{"\u2764"}</span>
              <span className="font-bold text-lg">Love is Coffee</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-coffee-900 mb-2">
              {"\u041C\u0435\u043D\u044E"}
            </h1>
            <p className="text-coffee-500 text-sm">
              {"\u0421\u0432\u0435\u0436\u0435\u0441\u0432\u0430\u0440\u0435\u043D\u043D\u044B\u0439 \u043A\u043E\u0444\u0435, \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0438\u0435 \u043D\u0430\u043F\u0438\u0442\u043A\u0438 \u0438 \u0434\u043E\u043C\u0430\u0448\u043D\u044F\u044F \u0432\u044B\u043F\u0435\u0447\u043A\u0430"}
            </p>
          </motion.div>

          {/* Табы категорий */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {MENU_DATA.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-white text-coffee-700 border border-coffee-200 hover:border-red-300"
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.title}
              </button>
            ))}
          </motion.div>

          {/* Список позиций */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <div className="bg-white rounded-2xl border border-coffee-100 shadow-sm overflow-hidden divide-y divide-coffee-50">
                {currentCategory.items.map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center justify-between px-5 py-4 hover:bg-cream-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-coffee-900">{item.name}</span>
                        {item.tag && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.tag === "New"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-coffee-400 mt-0.5">{item.desc}</p>
                    </div>
                    <span className="text-base font-bold text-red-600 whitespace-nowrap">
                      {item.price} {"\u20BD"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Подсказка внизу */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-8"
          >
            <motion.a
              href="/office"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-2xl shadow-lg text-sm"
            >
              {"\u2190 \u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u0432 \u043E\u0444\u0438\u0441"}
            </motion.a>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
