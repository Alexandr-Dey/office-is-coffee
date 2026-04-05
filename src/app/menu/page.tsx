"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════
   ДАННЫЕ МЕНЮ LOVE IS COFFEE
   ═══════════════════════════════════════════ */
type Size = "S" | "M" | "L";

interface MenuItem {
  name: string;
  prices: Record<string, number>;
  tag?: string;
}

interface MenuCategory {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
}

interface CartItem {
  name: string;
  size: string;
  price: number;
  qty: number;
}

const MENU_DATA: MenuCategory[] = [
  {
    id: "coffee",
    title: "Кофейная классика",
    icon: "\u2615",
    items: [
      { name: "Капучино", prices: { S: 850, M: 1050, L: 1150 } },
      { name: "Латте", prices: { M: 900, L: 1050 } },
      { name: "Флэт уайт", prices: { S: 1000, M: 1150, L: 1250 } },
      { name: "Американо", prices: { S: 750, M: 850, L: 950 } },
      { name: "Эспрессо", prices: { S: 450, M: 550 } },
    ],
  },
  {
    id: "author",
    title: "Авторский кофе",
    icon: "\u2728",
    items: [
      { name: "Раф классика", prices: { M: 1250, L: 1350 }, tag: "Хит" },
      { name: "Раф медовый", prices: { M: 1250, L: 1350 }, tag: "Хит" },
      { name: "Раф банан-карамель", prices: { M: 1350, L: 1450 }, tag: "Хит" },
      { name: "Мокко", prices: { M: 1250, L: 1350 } },
      { name: "Айриш кофе", prices: { M: 950, L: 1050 } },
      { name: "Латте халва", prices: { M: 950, L: 1050 } },
    ],
  },
  {
    id: "ice",
    title: "Айс кофе",
    icon: "\u2744\uFE0F",
    items: [
      { name: "Айс американо", prices: { M: 950, L: 1050 } },
      { name: "Айс капучино", prices: { M: 1250, L: 1350 } },
      { name: "Фраппучино", prices: { M: 1350, L: 1450 }, tag: "Хит" },
      { name: "Банановый кофе", prices: { M: 1350, L: 1450 }, tag: "Хит" },
      { name: "Эспрессо тоник", prices: { M: 1150, L: 1250 } },
    ],
  },
  {
    id: "tea",
    title: "Домашний чай",
    icon: "\uD83C\uDF75",
    items: [
      { name: "Нарядный", prices: { one: 950 }, tag: "Хит" },
      { name: "Имбирный", prices: { one: 950 } },
      { name: "Облепиховый", prices: { one: 1050 }, tag: "Хит" },
      { name: "Малиновый", prices: { one: 1150 } },
      { name: "Глинтвейн", prices: { one: 1150 }, tag: "Хит" },
    ],
  },
  {
    id: "matcha",
    title: "Матча",
    icon: "\uD83C\uDF35",
    items: [
      { name: "Зелёная матча", prices: { one: 1250 } },
      { name: "Голубая матча", prices: { one: 1250 } },
    ],
  },
  {
    id: "cocoa",
    title: "Какао",
    icon: "\uD83E\uDD5B",
    items: [
      { name: "Какао", prices: { one: 1150 } },
      { name: "Горячий шоколад", prices: { one: 1250 } },
    ],
  },
  {
    id: "cocktail",
    title: "Молочные коктейли",
    icon: "\uD83E\uDD64",
    items: [
      { name: "Банановый коктейль", prices: { one: 1450 } },
      { name: "Клубничный коктейль", prices: { one: 1350 } },
      { name: "Шоколадный коктейль", prices: { one: 1350 } },
    ],
  },
  {
    id: "lemonade",
    title: "Лимонады",
    icon: "\uD83C\uDF4B",
    items: [
      { name: "Домашний лимонад", prices: { one: 950 } },
      { name: "Мохито", prices: { one: 1050 } },
      { name: "Арбуз-киви", prices: { one: 1050 } },
      { name: "Яблоко-маракуйя", prices: { one: 1150 }, tag: "Хит" },
    ],
  },
];

/* helpers */
function getSizes(item: MenuItem): Size[] | null {
  const keys = Object.keys(item.prices);
  if (keys.length === 1 && keys[0] === "one") return null;
  return keys as Size[];
}
function getDefaultSize(item: MenuItem): Size | null {
  const sizes = getSizes(item);
  if (!sizes) return null;
  if (sizes.includes("M")) return "M";
  return sizes[0];
}
function getPrice(item: MenuItem, size: Size | null): number {
  if (size === null) return item.prices["one"];
  return item.prices[size];
}

/* ═══════════════════════════════════════════
   КОМПОНЕНТ ПОЗИЦИИ МЕНЮ (с кнопкой "Добавить")
   ═══════════════════════════════════════════ */
function MenuItemRow({
  item,
  idx,
  onAdd,
}: {
  item: MenuItem;
  idx: number;
  onAdd: (name: string, size: string, price: number) => void;
}) {
  const sizes = getSizes(item);
  const [selectedSize, setSelectedSize] = useState<Size | null>(getDefaultSize(item));
  const [added, setAdded] = useState(false);
  const price = getPrice(item, selectedSize);

  const handleAdd = () => {
    onAdd(item.name, selectedSize ?? "\u2014", price);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="flex items-center justify-between px-5 py-4 hover:bg-cream-50 transition-colors"
    >
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 flex-wrap">
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
        {sizes && (
          <div className="flex gap-1.5 mt-1.5">
            {sizes.map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  selectedSize === sz
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-coffee-50 text-coffee-500 hover:bg-coffee-100"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base font-bold text-red-600 whitespace-nowrap">
          {price} {"\u20B8"}
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            added
              ? "bg-green-500 text-white"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {added ? "\u2713" : "+"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   СТРАНИЦА МЕНЮ
   ═══════════════════════════════════════════ */
export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("coffee");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const currentCategory = MENU_DATA.find((c) => c.id === activeCategory) ?? MENU_DATA[0];

  const addToCart = (name: string, size: string, price: number) => {
    setCart((prev) => {
      const key = `${name}_${size}`;
      const existing = prev.find((i) => `${i.name}_${i.size}` === key);
      if (existing) {
        return prev.map((i) =>
          `${i.name}_${i.size}` === key ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { name, size, price, qty: 1 }];
    });
  };

  const removeFromCart = (name: string, size: string) => {
    setCart((prev) => prev.filter((i) => !(i.name === name && i.size === size)));
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  /* сохраняем корзину в sessionStorage для /order */
  useEffect(() => {
    if (cart.length > 0) {
      sessionStorage.setItem("oic_cart", JSON.stringify(cart));
    }
  }, [cart]);

  const goToOrder = () => {
    sessionStorage.setItem("oic_cart", JSON.stringify(cart));
    window.location.href = "/order";
  };

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

      <div className="pt-20 pb-32 px-4">
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
              {"\u0412\u044B\u0431\u0435\u0440\u0438 \u043D\u0430\u043F\u0438\u0442\u043E\u043A, \u0440\u0430\u0437\u043C\u0435\u0440 \u0438 \u0434\u043E\u0431\u0430\u0432\u044C \u0432 \u0437\u0430\u043A\u0430\u0437"}
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
                  <MenuItemRow key={item.name} item={item} idx={idx} onAdd={addToCart} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Корзина (раскрывающаяся панель) */}
      <AnimatePresence>
        {showCart && cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-coffee-100 p-5 z-50"
          >
            <h3 className="font-display text-lg font-bold text-coffee-900 mb-3">
              {"\u0422\u0432\u043E\u0439 \u0437\u0430\u043A\u0430\u0437"}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={`${item.name}_${item.size}`} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-coffee-900">{item.name}</span>
                    {item.size !== "\u2014" && (
                      <span className="ml-1 text-coffee-400 text-xs">({item.size})</span>
                    )}
                    {item.qty > 1 && (
                      <span className="ml-1 text-red-500 font-bold text-xs">{"\u00D7"}{item.qty}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-coffee-800">{item.price * item.qty} {"\u20B8"}</span>
                    <button
                      onClick={() => removeFromCart(item.name, item.size)}
                      className="text-red-400 hover:text-red-600 text-xs font-bold"
                    >
                      {"\u2715"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Нижняя панель с суммой */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-coffee-100 shadow-lg z-40"
          >
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setShowCart(!showCart)}
                className="flex items-center gap-2 text-coffee-700"
              >
                <span className="bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                  {totalItems}
                </span>
                <span className="text-sm font-medium">
                  {showCart ? "\u0421\u043A\u0440\u044B\u0442\u044C" : "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0437\u0430\u043A\u0430\u0437"}
                </span>
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={goToOrder}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-2xl shadow-lg text-sm"
              >
                <span>{"\u041E\u0444\u043E\u0440\u043C\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437"}</span>
                <span className="bg-white/20 px-3 py-1 rounded-lg">{totalPrice} {"\u20B8"}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
