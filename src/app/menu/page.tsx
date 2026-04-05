"use client";

import { useState, useEffect, useRef } from "react";
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

/* category icon mapping for drink cards */
const CATEGORY_CARD_ICON: Record<string, string> = {
  coffee: "\u2615",
  author: "\u2728",
  ice: "\uD83E\uDDCA",
  tea: "\uD83C\uDF75",
  matcha: "\uD83C\uDF75",
  cocoa: "\uD83E\uDD5B",
  cocktail: "\uD83E\uDD64",
  lemonade: "\uD83C\uDF4B",
};

/* short tab labels for Drinkit-style tabs */
const SHORT_TITLES: Record<string, string> = {
  coffee: "\u041A\u043E\u0444\u0435",
  author: "\u0410\u0432\u0442\u043E\u0440\u0441\u043A\u0438\u0439",
  ice: "\u0410\u0439\u0441",
  tea: "\u0427\u0430\u0439",
  matcha: "\u041C\u0430\u0442\u0447\u0430",
  cocoa: "\u041A\u0430\u043A\u0430\u043E",
  cocktail: "\u041A\u043E\u043A\u0442\u0435\u0439\u043B\u0438",
  lemonade: "\u041B\u0438\u043C\u043E\u043D\u0430\u0434\u044B",
};

/* ═══════════════════════════════════════════
   КАРТОЧКА НАПИТКА (Drinkit style)
   ═══════════════════════════════════════════ */
function DrinkCard({
  item,
  categoryId,
  idx,
  onAdd,
}: {
  item: MenuItem;
  categoryId: string;
  idx: number;
  onAdd: (name: string, size: string, price: number) => void;
}) {
  const sizes = getSizes(item);
  const [selectedSize, setSelectedSize] = useState<Size | null>(getDefaultSize(item));
  const [added, setAdded] = useState(false);
  const price = getPrice(item, selectedSize);
  const icon = CATEGORY_CARD_ICON[categoryId] ?? "\u2615";

  const handleAdd = () => {
    onAdd(item.name, selectedSize ?? "\u2014", price);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.3 }}
      className="bg-white rounded-2xl border border-coffee-100 shadow-sm p-4 flex flex-col items-center text-center relative"
    >
      {/* emoji icon */}
      <span className="text-4xl mb-2 block">{icon}</span>

      {/* name */}
      <h3 className="font-bold text-coffee-900 text-sm leading-tight mb-1">{item.name}</h3>

      {/* hit tag */}
      {item.tag && (
        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-coffee-100 text-coffee-700 mb-2">
          {item.tag}
        </span>
      )}

      {/* size pills */}
      {sizes && (
        <div className="flex gap-1.5 mb-3 mt-1">
          {sizes.map((sz) => (
            <button
              key={sz}
              onClick={() => setSelectedSize(sz)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                selectedSize === sz
                  ? "bg-coffee-600 text-white shadow-sm"
                  : "bg-coffee-50 text-coffee-500 hover:bg-coffee-100"
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      )}

      {!sizes && <div className="mb-3" />}

      {/* price */}
      <span className="text-lg font-bold text-coffee-800 mb-3">
        {price} {"\u20B8"}
      </span>

      {/* add button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleAdd}
        className={`w-10 h-10 rounded-full text-lg font-bold transition-all flex items-center justify-center ${
          added
            ? "bg-green-500 text-white"
            : "bg-coffee-600 text-white hover:bg-coffee-700"
        }`}
      >
        {added ? "\u2713" : "+"}
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   СТРАНИЦА МЕНЮ (Drinkit style)
   ═══════════════════════════════════════════ */
export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("coffee");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

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

  /* scroll active tab into view */
  useEffect(() => {
    if (tabsRef.current) {
      const activeBtn = tabsRef.current.querySelector("[data-active='true']") as HTMLElement | null;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-cream-50">
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      {/* ── Header ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-coffee-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">{"\u2615"}</span>
            <span className="font-display text-xl font-bold text-coffee-900">OiC</span>
          </a>
          <a
            href="/office"
            className="text-sm text-coffee-500 hover:text-coffee-700 transition-colors"
          >
            {"\u2190 \u0412 \u043E\u0444\u0438\u0441"}
          </a>
        </div>
      </nav>

      {/* ── Sticky category tabs ── */}
      <div className="fixed top-[53px] w-full z-40 bg-cream-50/95 backdrop-blur-sm border-b border-coffee-100">
        <div
          ref={tabsRef}
          className="max-w-2xl mx-auto px-3 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide"
        >
          {MENU_DATA.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                data-active={isActive}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-coffee-600 text-white shadow-sm"
                    : "bg-white text-coffee-600 border border-coffee-200 hover:border-coffee-400"
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                {SHORT_TITLES[cat.id] ?? cat.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Drink cards grid ── */}
      <div className="pt-[120px] pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-3 sm:gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
            >
              {currentCategory.items.map((item, idx) => (
                <DrinkCard
                  key={item.name}
                  item={item}
                  categoryId={currentCategory.id}
                  idx={idx}
                  onAdd={addToCart}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Cart preview (expandable) ── */}
      <AnimatePresence>
        {showCart && cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-2xl shadow-2xl border border-coffee-100 p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base font-bold text-coffee-900">
                {"\u0422\u0432\u043E\u0439 \u0437\u0430\u043A\u0430\u0437"}
              </h3>
              <button
                onClick={() => setShowCart(false)}
                className="text-coffee-400 hover:text-coffee-600 text-sm"
              >
                {"\u2715"}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={`${item.name}_${item.size}`} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-coffee-900">{item.name}</span>
                    {item.size !== "\u2014" && (
                      <span className="ml-1 text-coffee-400 text-xs">({item.size})</span>
                    )}
                    {item.qty > 1 && (
                      <span className="ml-1 text-coffee-600 font-bold text-xs">{"\u00D7"}{item.qty}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-coffee-800">{item.price * item.qty} {"\u20B8"}</span>
                    <button
                      onClick={() => removeFromCart(item.name, item.size)}
                      className="text-coffee-400 hover:text-coffee-600 text-xs font-bold"
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

      {/* ── Sticky bottom cart bar ── */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md rounded-t-2xl border-t border-coffee-100 shadow-lg z-40"
          >
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowCart(!showCart)}
                className="flex items-center gap-2 text-coffee-700"
              >
                <span className="relative">
                  <span className="text-2xl">{"\uD83D\uDED2"}</span>
                  <span className="absolute -top-1.5 -right-2 bg-coffee-600 text-white min-w-[20px] h-5 rounded-full flex items-center justify-center text-[11px] font-bold px-1">
                    {totalItems}
                  </span>
                </span>
                <span className="text-sm font-medium ml-1">
                  {showCart ? "\u0421\u043A\u0440\u044B\u0442\u044C" : "\u0417\u0430\u043A\u0430\u0437"}
                </span>
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={goToOrder}
                className="flex-1 max-w-xs py-3 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-xl shadow-md text-sm text-center transition-colors"
              >
                {"\u041E\u0444\u043E\u0440\u043C\u0438\u0442\u044C \u2022 "}{totalPrice} {"\u20B8"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
