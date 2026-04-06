"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CoffeeScene from "@/components/CoffeeScene";
import { useAuth } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

/* ═══ TYPES ═══ */
type Size = "S" | "M" | "L";
interface MenuItem {
  name: string;
  prices: Record<string, number>;
  tag?: string;
  milk?: boolean;
  seasonal?: boolean;
  activeFrom?: number;
  activeTo?: number;
  profile?: { acidity: number; sweetness: number; bitterness: number; body: number; aroma: number };
}
interface MenuCategory { id: string; shortTitle: string; icon: string; items: MenuItem[] }
interface CartItem { name: string; size: string; price: number; qty: number; milk?: string }

/* ═══ DATA ═══ */
const MILKS = ["Стандарт", "Овсяное", "Кокосовое", "Без молока"];
const currentMonth = new Date().getMonth() + 1;

const MENU: MenuCategory[] = [
  { id: "coffee", shortTitle: "Кофе", icon: "\u2615", items: [
    { name: "Капучино", prices: { S: 850, M: 1050, L: 1150 }, milk: true, profile: { acidity: 2, sweetness: 3, bitterness: 3, body: 4, aroma: 4 } },
    { name: "Латте", prices: { M: 900, L: 1050 }, milk: true, profile: { acidity: 1, sweetness: 4, bitterness: 2, body: 3, aroma: 3 } },
    { name: "Флэт уайт", prices: { S: 1000, M: 1150, L: 1250 }, milk: true, profile: { acidity: 2, sweetness: 2, bitterness: 4, body: 5, aroma: 4 } },
    { name: "Американо", prices: { S: 750, M: 850, L: 950 }, profile: { acidity: 3, sweetness: 1, bitterness: 4, body: 2, aroma: 3 } },
    { name: "Эспрессо", prices: { S: 450, M: 550 }, profile: { acidity: 3, sweetness: 1, bitterness: 5, body: 5, aroma: 5 } },
  ]},
  { id: "author", shortTitle: "Авторский", icon: "\u2728", items: [
    { name: "Раф классика", prices: { M: 1250, L: 1350 }, tag: "Хит", milk: true, profile: { acidity: 1, sweetness: 5, bitterness: 1, body: 5, aroma: 4 } },
    { name: "Раф медовый", prices: { M: 1250, L: 1350 }, tag: "Хит", milk: true, profile: { acidity: 1, sweetness: 5, bitterness: 1, body: 4, aroma: 5 } },
    { name: "Раф банан-карамель", prices: { M: 1350, L: 1450 }, tag: "Хит", milk: true, profile: { acidity: 1, sweetness: 5, bitterness: 1, body: 4, aroma: 4 } },
    { name: "Мокко", prices: { M: 1250, L: 1350 }, milk: true, profile: { acidity: 1, sweetness: 4, bitterness: 3, body: 4, aroma: 4 } },
    { name: "Латте халва", prices: { M: 950, L: 1050 }, milk: true, profile: { acidity: 1, sweetness: 5, bitterness: 1, body: 3, aroma: 5 } },
  ]},
  { id: "ice", shortTitle: "Айс", icon: "\u2744\uFE0F", items: [
    { name: "Айс американо", prices: { M: 950, L: 1050 }, profile: { acidity: 3, sweetness: 1, bitterness: 3, body: 2, aroma: 2 } },
    { name: "Фраппучино", prices: { M: 1350, L: 1450 }, tag: "Хит", milk: true, profile: { acidity: 1, sweetness: 5, bitterness: 1, body: 3, aroma: 3 } },
    { name: "Банановый кофе", prices: { M: 1350, L: 1450 }, tag: "Хит", milk: true, profile: { acidity: 1, sweetness: 5, bitterness: 1, body: 4, aroma: 3 } },
    { name: "Эспрессо тоник", prices: { M: 1150, L: 1250 }, profile: { acidity: 4, sweetness: 2, bitterness: 3, body: 2, aroma: 3 } },
  ]},
  { id: "tea", shortTitle: "Чай", icon: "\uD83C\uDF75", items: [
    { name: "Нарядный", prices: { one: 950 }, tag: "Хит" },
    { name: "Имбирный", prices: { one: 950 } },
    { name: "Облепиховый", prices: { one: 1050 }, tag: "Хит" },
    { name: "Глинтвейн", prices: { one: 1150 }, tag: "Хит", seasonal: true, activeFrom: 11, activeTo: 3 },
  ]},
  { id: "other", shortTitle: "Другое", icon: "\uD83E\uDD5B", items: [
    { name: "Матча", prices: { one: 1250 }, tag: "NEW" },
    { name: "Какао", prices: { one: 1150 } },
    { name: "Горячий шоколад", prices: { one: 1250 } },
    { name: "Лимонад", prices: { one: 950 } },
    { name: "Тыквенно-пряный латте", prices: { M: 1350, L: 1450 }, tag: "СЕЗОН", milk: true, seasonal: true, activeFrom: 9, activeTo: 11, profile: { acidity: 1, sweetness: 5, bitterness: 1, body: 5, aroma: 5 } },
  ]},
];

function isSeasonActive(from?: number, to?: number): boolean {
  if (!from || !to) return true;
  if (from <= to) return currentMonth >= from && currentMonth <= to;
  return currentMonth >= from || currentMonth <= to;
}

function getSizes(item: MenuItem): Size[] | null {
  const k = Object.keys(item.prices);
  return k.length === 1 && k[0] === "one" ? null : (k as Size[]);
}
function getDefault(item: MenuItem): Size | null {
  const s = getSizes(item);
  if (!s) return null;
  return s.includes("M" as Size) ? "M" : s[0];
}
function getPrice(item: MenuItem, sz: Size | null): number {
  return sz === null ? item.prices["one"] : item.prices[sz];
}

/* ═══ RADAR CHART ═══ */
function RadarChart({ profile }: { profile: { acidity: number; sweetness: number; bitterness: number; body: number; aroma: number } }) {
  const labels = ["Кислотность", "Сладость", "Горечь", "Тело", "Аромат"];
  const values = [profile.acidity, profile.sweetness, profile.bitterness, profile.body, profile.aroma];
  const cx = 60, cy = 55, r = 40;
  const angles = values.map((_, i) => (Math.PI * 2 * i) / 5 - Math.PI / 2);

  const points = values.map((v, i) => ({
    x: cx + (r * v / 5) * Math.cos(angles[i]),
    y: cy + (r * v / 5) * Math.sin(angles[i]),
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <svg width="120" height="110" viewBox="0 0 120 110" className="flex-shrink-0">
      {[1, 2, 3, 4, 5].map((level) => (
        <polygon
          key={level}
          points={angles.map((a) => `${cx + (r * level / 5) * Math.cos(a)},${cy + (r * level / 5) * Math.sin(a)}`).join(" ")}
          fill="none" stroke="#d0f0e0" strokeWidth="0.5"
        />
      ))}
      {angles.map((a, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#d0f0e0" strokeWidth="0.5" />
          <text x={cx + (r + 12) * Math.cos(a)} y={cy + (r + 12) * Math.sin(a)} textAnchor="middle" dominantBaseline="central" fontSize="5" fill="#0f3a20" opacity="0.5">{labels[i]}</text>
        </g>
      ))}
      <polygon points={path.replace(/[MLZ]/g, (m) => m === "Z" ? "" : "").split(/[ML]/).filter(Boolean).join(" ")} fill="rgba(62,207,130,0.25)" stroke="#3ecf82" strokeWidth="1.5" />
    </svg>
  );
}

/* ═══ DRINK DETAIL SHEET ═══ */
function DrinkDetail({ item, catIcon, onAdd, onClose }: {
  item: MenuItem; catIcon: string;
  onAdd: (name: string, size: string, price: number, milk?: string) => void;
  onClose: () => void;
}) {
  const sizes = getSizes(item);
  const [sz, setSz] = useState<Size | null>(getDefault(item));
  const [milk, setMilk] = useState(0);
  const price = getPrice(item, sz);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <div className="flex items-start gap-4">
          <span className="text-5xl">{catIcon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl font-bold text-brand-text">{item.name}</h2>
              {item.tag && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  item.tag === "NEW" ? "bg-brand-mint/20 text-brand-dark" :
                  item.tag === "СЕЗОН" ? "bg-orange-100 text-orange-600" :
                  "bg-brand-pink/10 text-brand-pink"
                }`}>{item.tag}</span>
              )}
            </div>
            {item.seasonal && <p className="text-xs text-orange-500 mt-0.5">Сезонный напиток</p>}
          </div>
          {item.profile && <RadarChart profile={item.profile} />}
        </div>

        {sizes && (
          <div className="mt-4">
            <p className="text-xs text-brand-text/50 mb-2">Размер</p>
            <div className="flex gap-2">
              {sizes.map((s) => (
                <button key={s} onClick={() => setSz(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    sz === s ? "bg-brand-dark text-white shadow-md" : "bg-gray-100 text-brand-text/50"
                  }`}>{s} — {item.prices[s]} \u20B8</button>
              ))}
            </div>
          </div>
        )}

        {item.milk && (
          <div className="mt-4">
            <p className="text-xs text-brand-text/50 mb-2">Молоко</p>
            <div className="flex gap-2 flex-wrap">
              {MILKS.map((m, i) => (
                <button key={m} onClick={() => setMilk(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    milk === i ? "bg-brand-mint/20 text-brand-dark border border-brand-mint" : "bg-gray-100 text-gray-500"
                  }`}>{m}</button>
              ))}
            </div>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { onAdd(item.name, sz ?? "\u2014", price, item.milk ? MILKS[milk] : undefined); onClose(); }}
          className="w-full mt-6 py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-lg"
        >
          Добавить — {price} \u20B8
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══ DRINK CARD ═══ */
function DrinkCard({ item, catIcon, onAdd, onDetail, idx, stopped }: {
  item: MenuItem; catIcon: string; idx: number; stopped?: boolean;
  onAdd: (name: string, size: string, price: number, milk?: string) => void;
  onDetail: () => void;
}) {
  const sizes = getSizes(item);
  const [sz] = useState<Size | null>(getDefault(item));
  const [added, setAdded] = useState(false);
  const price = getPrice(item, sz);
  const unavailable = stopped || (item.seasonal && !isSeasonActive(item.activeFrom, item.activeTo));

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unavailable) return;
    onAdd(item.name, sz ?? "\u2014", price, item.milk ? "Стандарт" : undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={unavailable ? undefined : onDetail}
      className={`bg-white rounded-2xl border border-[#d0f0e0] p-4 flex flex-col cursor-pointer hover:shadow-md transition-shadow ${unavailable ? "opacity-50 cursor-not-allowed" : ""}`}
      style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}
    >
      <div className="text-3xl mb-2">{catIcon}</div>
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="font-semibold text-sm text-brand-text">{item.name}</span>
        {item.tag && (
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            item.tag === "NEW" ? "bg-brand-mint/20 text-brand-dark" :
            item.tag === "СЕЗОН" ? "bg-orange-100 text-orange-600" :
            "bg-brand-pink/10 text-brand-pink"
          }`}>{item.tag}</span>
        )}
      </div>
      {unavailable && <span className="text-[10px] text-red-400 font-medium">Закончился</span>}
      {sizes && !unavailable && (
        <div className="flex gap-1 mb-1 mt-1">
          {sizes.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-100 text-brand-text/40">{s}</span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="font-bold text-brand-dark">{price} \u20B8</span>
        {!unavailable && (
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleQuickAdd}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors ${
              added ? "bg-green-500" : "bg-brand-dark hover:bg-brand-mid"
            }`}>{added ? "\u2713" : "+"}</motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ═══ LOYALTY ═══ */
function LoyaltyBanner({ count }: { count: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#d0f0e0] px-4 py-3 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <div className="flex gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className={`text-lg ${i < count ? "" : "opacity-20"}`}>{i < count ? "\u2615" : "\u25CB"}</span>
        ))}
      </div>
      <span className="text-[11px] text-brand-text/50">каждый 8-й бесплатный</span>
    </div>
  );
}

/* ═══ QUICK REPEAT ═══ */
function QuickRepeat({ onRepeat }: { onRepeat: (items: CartItem[]) => void }) {
  const [lastOrder, setLastOrder] = useState<{ items: CartItem[]; name: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(getFirebaseDb(), "orders"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    getDocs(q).then((snap) => {
      if (!snap.empty) {
        const d = snap.docs[0].data();
        if (d.userId === user.uid || d.name === user.displayName) {
          setLastOrder({ items: d.items, name: d.items.map((i: CartItem) => i.name).join(", ") });
        }
      }
    }).catch(() => {});
  }, [user]);

  if (!lastOrder) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#d0f0e0] px-4 py-3 flex items-center justify-between"
      style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}
    >
      <div>
        <p className="text-xs text-brand-text/50">Обычный?</p>
        <p className="text-sm font-medium text-brand-text truncate max-w-[200px]">{lastOrder.name}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onRepeat(lastOrder.items)}
        className="px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-bold"
      >
        Повторить
      </motion.button>
    </motion.div>
  );
}

/* ═══ PAGE ═══ */
export default function MenuPage() {
  const { user } = useAuth();
  const [cat, setCat] = useState("coffee");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [detailItem, setDetailItem] = useState<{ item: MenuItem; icon: string } | null>(null);
  const [loyaltyCount, setLoyaltyCount] = useState(0);
  const [cafeOpen, setCafeOpen] = useState(true);
  const [stopList, setStopList] = useState<string[]>([]);
  const [geoNearby, setGeoNearby] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const current = MENU.find((c) => c.id === cat) ?? MENU[0];

  /* Listen to cafe status */
  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCafeOpen(data.isOpen ?? true);
        setStopList(data.stopList ?? []);
      }
    }, () => {});
    return () => unsub();
  }, []);

  /* Loyalty from Firestore */
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(getFirebaseDb(), "users", user.uid), (snap) => {
      if (snap.exists()) {
        setLoyaltyCount(snap.data().loyaltyCount ?? 0);
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  /* Geolocation check */
  useEffect(() => {
    if (!navigator.geolocation) return;
    const geoAllowed = localStorage.getItem("oic_geo_allowed");
    if (geoAllowed !== "true") return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = 43.2220, lng = 76.8512;
      const dist = getDistanceKm(pos.coords.latitude, pos.coords.longitude, lat, lng) * 1000;
      if (dist <= 300) setGeoNearby(true);
    }, () => {});
  }, []);

  const addToCart = (name: string, size: string, price: number, milk?: string) => {
    setCart((prev) => {
      const key = `${name}_${size}_${milk ?? ""}`;
      const ex = prev.find((i) => `${i.name}_${i.size}_${i.milk ?? ""}` === key);
      if (ex) return prev.map((i) => `${i.name}_${i.size}_${i.milk ?? ""}` === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { name, size, price, qty: 1, milk }];
    });
  };

  const repeatOrder = (items: CartItem[]) => {
    setCart(items);
  };

  const removeFromCart = (name: string, size: string, milk?: string) => {
    setCart((prev) => prev.filter((i) => !(i.name === name && i.size === size && (i.milk ?? "") === (milk ?? ""))));
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  useEffect(() => { if (cart.length > 0) sessionStorage.setItem("oic_cart", JSON.stringify(cart)); }, [cart]);
  const goToOrder = () => { sessionStorage.setItem("oic_cart", JSON.stringify(cart)); window.location.href = "/order"; };

  return (
    <main className="min-h-screen bg-brand-bg pb-32">
      {/* Cafe status bar */}
      {!cafeOpen && (
        <div className="bg-red-50 text-red-600 text-center py-2 text-sm font-medium">
          Кофейня закрыта \u00B7 Открывается в 07:30
        </div>
      )}

      <div className="px-3 pt-3"><CoffeeScene /></div>

      <div className="px-3 mt-3 space-y-3">
        <LoyaltyBanner count={loyaltyCount} />
        <QuickRepeat onRepeat={repeatOrder} />
      </div>

      {/* Geo nearby banner */}
      {geoNearby && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-3 bg-brand-dark text-white rounded-2xl px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm">\uD83D\uDCCD Кофейня рядом!</span>
          <button onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })} className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">Быстрый заказ</button>
        </motion.div>
      )}

      {/* Hero hit */}
      <div className="px-3 mt-3">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-mint/20 rounded-full" />
          <div className="absolute right-10 bottom-2 w-16 h-16 bg-brand-mint/15 rounded-full" />
          <div className="absolute left-1/2 top-0 w-24 h-24 bg-brand-mint/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <p className="text-[10px] uppercase tracking-wider text-brand-mint font-bold mb-1">Хит сезона</p>
          <p className="font-display text-xl font-bold mb-1">Раф классика</p>
          <p className="text-sm text-white/70 mb-3">Нежный сливочный кофе с ванилью</p>
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">1250 \u20B8</span>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => { if (cafeOpen) addToCart("Раф классика", "M", 1250, "Стандарт"); }}
              disabled={!cafeOpen}
              className="bg-white text-brand-dark px-4 py-1.5 rounded-full text-sm font-bold disabled:opacity-50">В корзину</motion.button>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} className="px-3 mt-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1">
          {MENU.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                cat === c.id ? "bg-brand-dark text-white shadow-md" : "bg-white text-brand-text border border-[#d0f0e0]"
              }`}><span className="mr-1">{c.icon}</span>{c.shortTitle}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-3 mt-3">
        <AnimatePresence mode="wait">
          <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {current.items.map((item, idx) => (
              <DrinkCard
                key={item.name} item={item} catIcon={current.icon} idx={idx}
                stopped={stopList.includes(item.name)}
                onAdd={addToCart}
                onDetail={() => setDetailItem({ item, icon: current.icon })}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Detail sheet */}
      <AnimatePresence>
        {detailItem && (
          <DrinkDetail
            item={detailItem.item}
            catIcon={detailItem.icon}
            onAdd={addToCart}
            onClose={() => setDetailItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Cart popup */}
      <AnimatePresence>
        {showCart && cart.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-20 left-3 right-3 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-[#d0f0e0] p-4 z-50">
            <h3 className="font-bold text-brand-dark mb-2">Твой заказ</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {cart.map((i) => (
                <div key={`${i.name}_${i.size}_${i.milk}`} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-brand-text">{i.name}</span>
                    {i.size !== "\u2014" && <span className="text-brand-text/40 text-xs ml-1">({i.size})</span>}
                    {i.milk && <span className="text-brand-mint text-xs ml-1">{i.milk}</span>}
                    {i.qty > 1 && <span className="text-brand-pink text-xs font-bold ml-1">\u00D7{i.qty}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-dark">{i.price * i.qty} \u20B8</span>
                    <button onClick={() => removeFromCart(i.name, i.size, i.milk)} className="text-brand-pink/50 hover:text-brand-pink text-xs">\u2715</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom cart bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#d0f0e0] z-40">
            <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
              <button onClick={() => setShowCart(!showCart)} className="flex items-center gap-2">
                <span className="bg-brand-dark text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">{totalItems}</span>
                <span className="text-sm font-medium text-brand-text">{showCart ? "Скрыть" : "Показать"}</span>
              </button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={goToOrder}
                disabled={!cafeOpen}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-white font-bold rounded-full text-sm shadow-lg disabled:opacity-50">
                <span>Оформить</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{totalPrice} \u20B8</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
