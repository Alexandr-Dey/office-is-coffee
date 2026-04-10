"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CoffeeScene, { type BaristaState } from "@/components/CoffeeScene";
import { useAuth } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, getDoc, where } from "firebase/firestore";
import { CAFE_LAT, CAFE_LNG, CAFE_RADIUS_M, getDistanceM } from "@/lib/constants";
import type { MenuItem, CartItem } from "@/lib/types";
import { trackEvent } from "@/lib/mixpanel";
import { useToast } from "@/components/Toast";
import { useCart } from "@/lib/cart";
import QuickOrdersBlock from "@/components/QuickOrdersBlock";
import CookieButton from "@/components/CookieButton";
import { getDailyCookie, isCookieCollectedToday } from "@/lib/dailyCookie";
import { COOKIE_FACTS, type CookieFact } from "@/lib/cookieFacts";
import { doc as firestoreDoc, updateDoc } from "firebase/firestore";

/* ═══ CATEGORIES ═══ */
const CATEGORIES = [
  { id: "classic-coffee", name: "Кофе", icon: "☕", gradient: "from-[#1a7a44] to-[#2d9e5a]" },
  { id: "author-coffee", name: "Авторский", icon: "✨", gradient: "from-[#d42b4f] to-[#e85d7a]" },
  { id: "ice-coffee", name: "Айс кофе", icon: "❄️", gradient: "from-[#0ea5e9] to-[#38bdf8]" },
  { id: "cocoa", name: "Какао", icon: "🍫", gradient: "from-[#92400e] to-[#b45309]" },
  { id: "home-tea", name: "Домашний чай", icon: "🍵", gradient: "from-[#f59e0b] to-[#fbbf24]" },
  { id: "author-tea", name: "Авторский чай", icon: "🌿", gradient: "from-[#be123c] to-[#e11d48]" },
  { id: "matcha", name: "Матча", icon: "🌵", gradient: "from-[#65a30d] to-[#84cc16]" },
  { id: "ice-tea", name: "Айс ти", icon: "🧊", gradient: "from-[#06b6d4] to-[#22d3ee]" },
  { id: "milkshakes", name: "Коктейли", icon: "🥛", gradient: "from-[#ec4899] to-[#f472b6]" },
  { id: "fresh-juices", name: "Соки", icon: "🍊", gradient: "from-[#f97316] to-[#fb923c]" },
  { id: "fresh-smoothies", name: "Смузи фреш", icon: "🍓", gradient: "from-[#eab308] to-[#facc15]" },
  { id: "milk-smoothies", name: "Смузи молоко", icon: "🥛", gradient: "from-[#a855f7] to-[#c084fc]" },
  { id: "lemonades", name: "Лимонады", icon: "🍋", gradient: "from-[#14b8a6] to-[#2dd4bf]" },
];

type Size = "S" | "M" | "L";

/* ═══ MILK & ADDONS ═══ */
const MILKS: { name: string; surcharge: number }[] = [
  { name: "Стандарт", surcharge: 0 },
  { name: "Овсяное", surcharge: 500 },
  { name: "Кокосовое", surcharge: 500 },
  { name: "Миндальное", surcharge: 500 },
  { name: "Без молока", surcharge: 0 },
];

const SYRUPS = [
  { name: "Без сиропа", surcharge: 0 },
  { name: "Ваниль", surcharge: 200 },
  { name: "Карамель", surcharge: 200 },
  { name: "Лесной орех", surcharge: 200 },
  { name: "Кокос", surcharge: 200 },
];

/* ═══ SEASON CHECK ═══ */
function isSeasonActive(from?: string | null, to?: string | null): boolean {
  if (!from || !to) return true;
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const current = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (from <= to) return current >= from && current <= to;
  return current >= from || current <= to;
}

const SIZE_ORDER: Record<Size, number> = { S: 0, M: 1, L: 2 };
function getSizes(item: MenuItem): Size[] | null {
  const keys = (Object.keys(item.sizes) as Size[]).sort((a, b) => SIZE_ORDER[a] - SIZE_ORDER[b]);
  return keys.length > 0 ? keys : null;
}
function getDefault(item: MenuItem): Size | null {
  const s = getSizes(item);
  if (!s) return null;
  return s.includes("M") ? "M" : s[0];
}
function getPrice(item: MenuItem, sz: Size | null): number {
  if (!sz) return Object.values(item.sizes)[0] ?? 0;
  return item.sizes[sz] ?? 0;
}
function getMinPrice(item: MenuItem): number {
  return Math.min(...Object.values(item.sizes));
}

/* ═══ RADAR CHART ═══ */
function RadarChart({ profile }: { profile: NonNullable<MenuItem["radarData"]> }) {
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
        <polygon key={level}
          points={angles.map((a) => `${cx + (r * level / 5) * Math.cos(a)},${cy + (r * level / 5) * Math.sin(a)}`).join(" ")}
          fill="none" stroke="#d0f0e0" strokeWidth="0.5" />
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
function DrinkDetail({ item, catGradient, onAdd, onClose, isFavorite, onToggleFavorite }: {
  item: MenuItem; catGradient: string;
  onAdd: (name: string, size: string, price: number, milk?: string, syrup?: string) => void;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const sizes = getSizes(item);
  const [sz, setSz] = useState<Size | null>(getDefault(item));
  const [milk, setMilk] = useState(0);
  const [syrup, setSyrup] = useState(0);
  const basePrice = getPrice(item, sz);
  const milkSurcharge = item.availableMilk ? MILKS[milk].surcharge : 0;
  const syrupSurcharge = SYRUPS[syrup].surcharge;
  const totalPrice = basePrice + milkSurcharge + syrupSurcharge;

  const catIcon = CATEGORIES.find(c => c.id === item.category)?.icon ?? "☕";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", damping: 25 }}
      className="fixed inset-0 z-[100] bg-brand-bg flex flex-col"
    >
      {/* Hero header */}
      <div className={`bg-gradient-to-br ${catGradient} px-5 pt-4 pb-8 relative`}>
        <div className="flex items-center justify-between mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg backdrop-blur-sm">
            ←
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.85 }} onClick={onToggleFavorite}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg backdrop-blur-sm">
              {isFavorite ? "❤️" : "🤍"}
            </motion.button>
          </div>
        </div>
        <div className="flex gap-1.5 mt-2">
            {item.tags.includes("hit") && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/25 text-white">Хит</span>}
            {item.tags.includes("new") && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/25 text-white">NEW</span>}
            {item.tags.includes("season") && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/25 text-white">Сезон</span>}
        </div>
        <div className="flex items-end gap-4 mt-3">
          <div>
            <p className="text-5xl mb-2">{catIcon}</p>
            <h2 className="font-display text-2xl font-bold text-white">{item.name}</h2>
            {item.ingredients && <p className="text-sm text-white/70 mt-1">{item.ingredients}</p>}
          </div>
          {item.radarData && (
            <div className="ml-auto opacity-90">
              <RadarChart profile={item.radarData} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto -mt-4">
        <div className="bg-brand-bg rounded-t-3xl px-5 pt-5 pb-4">

          {/* Size picker */}
          {sizes && (
            <div className="mb-5">
              <p className="text-xs font-bold text-brand-text/50 uppercase tracking-wider mb-2">Размер</p>
              <div className="flex gap-2">
                {sizes.map((s) => (
                  <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => setSz(s)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
                      sz === s
                        ? "bg-brand-dark text-white shadow-lg"
                        : "bg-white text-brand-text/60 border border-[#d0f0e0]"
                    }`}>
                    <span className="block text-lg">{s}</span>
                    <span className="block text-xs mt-0.5 opacity-70">{item.sizes[s]}₸</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Milk picker */}
          {item.availableMilk && (
            <div className="mb-5">
              <p className="text-xs font-bold text-brand-text/50 uppercase tracking-wider mb-2">Молоко</p>
              <div className="flex gap-2 flex-wrap">
                {MILKS.map((m, i) => (
                  <motion.button key={m.name} whileTap={{ scale: 0.95 }} onClick={() => setMilk(i)}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                      milk === i
                        ? "bg-brand-dark text-white shadow-md"
                        : "bg-white text-brand-text/60 border border-[#d0f0e0]"
                    }`}>
                    {m.name}
                    {m.surcharge > 0 && <span className="text-xs opacity-60 ml-1">+{m.surcharge}₸</span>}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Syrup picker */}
          <div className="mb-2">
            <p className="text-xs font-bold text-brand-text/50 uppercase tracking-wider mb-2">Сироп</p>
            <div className="flex gap-2 flex-wrap">
              {SYRUPS.map((s, i) => (
                <motion.button key={s.name} whileTap={{ scale: 0.95 }} onClick={() => setSyrup(i)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    syrup === i
                      ? "bg-brand-dark text-white shadow-md"
                      : "bg-white text-brand-text/60 border border-[#d0f0e0]"
                  }`}>
                  {s.name}
                  {s.surcharge > 0 && <span className="text-xs opacity-60 ml-1">+{s.surcharge}₸</span>}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="px-5 py-4 bg-white border-t border-[#d0f0e0] pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-brand-text/40">Итого</p>
            <p className="text-2xl font-bold text-brand-dark">{totalPrice}₸</p>
          </div>
          {milkSurcharge > 0 && <span className="text-xs text-brand-mint bg-brand-mint/10 px-2 py-1 rounded-lg">+молоко {milkSurcharge}₸</span>}
          {syrupSurcharge > 0 && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">+сироп {syrupSurcharge}₸</span>}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            onAdd(
              item.name,
              sz ?? "—",
              totalPrice,
              item.availableMilk ? MILKS[milk].name : undefined,
              SYRUPS[syrup].surcharge > 0 ? SYRUPS[syrup].name : undefined,
            );
            onClose();
          }}
          className="w-full py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-xl min-h-[52px]"
        >
          Добавить в корзину
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══ DRINK CARD ═══ */
function DrinkCard({ item, gradient, catIcon, onAdd, onDetail, idx, stopped, cookieData }: {
  item: MenuItem; gradient: string; catIcon: string; idx: number; stopped?: boolean;
  onAdd: (name: string, size: string, price: number, milk?: string) => void;
  onDetail: () => void;
  cookieData?: { fact: CookieFact; collected: boolean; onCollect: () => void } | null;
}) {
  const sizes = getSizes(item);
  const [sz] = useState<Size | null>(getDefault(item));
  const [added, setAdded] = useState(false);
  const price = getPrice(item, sz);
  const unavailable = stopped || (item.tags.includes("season") && !isSeasonActive(item.activeFrom, item.activeTo));

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unavailable) return;
    onAdd(item.name, sz ?? "—", price, item.availableMilk ? MILKS[0].name : undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={unavailable ? undefined : onDetail}
      aria-label={`${item.name}, от ${getMinPrice(item)} ₸`}
      className={`rounded-2xl p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow relative ${unavailable ? "opacity-50 cursor-not-allowed" : ""} bg-gradient-to-br ${gradient} text-white`}
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    >
      {cookieData && (
        <CookieButton fact={cookieData.fact} collected={cookieData.collected} onCollect={cookieData.onCollect} />
      )}
      <div className="text-3xl mb-2">{catIcon}</div>
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="font-semibold text-sm">{item.name}</span>
        {item.tags.includes("hit") && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/25 text-white">{"Хит"}</span>}
        {item.tags.includes("new") && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/25 text-white">NEW</span>}
        {item.tags.includes("season") && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/25 text-white">{"Сезон"}</span>}
      </div>
      {unavailable && <span className="text-xs text-white/70 font-medium">Закончился</span>}
      {item.ingredients && !unavailable && <p className="text-xs text-white/60 line-clamp-1">{item.ingredients}</p>}
      {sizes && !unavailable && (
        <div className="flex gap-1 mb-1 mt-1">
          {sizes.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white/30 text-white">{s}</span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="font-bold text-white">от {getMinPrice(item)} ₸</span>
        {!unavailable && (
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleQuickAdd}
            aria-label={`Добавить ${item.name} в корзину`}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              added ? "bg-white text-green-600" : "bg-white/25 text-white hover:bg-white/40"
            }`}>{added ? "✓" : "+"}</motion.button>
        )}
      </div>
    </motion.article>
  );
}

/* ═══ LOYALTY ═══ */
function LoyaltyBanner({ count }: { count: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#d0f0e0] px-4 py-3 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <div className="flex gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className={`text-lg ${i < count ? "" : "opacity-20"}`}>{i < count ? "☕" : "○"}</span>
        ))}
      </div>
      <span className="text-xs text-brand-text/50">каждый 8-й бесплатный</span>
    </div>
  );
}

/* ═══ QUICK ORDER STRIP ═══ */
interface RecentOrder {
  key: string;
  label: string;
  sub: string;
  items: Array<{ name: string; size: string; price: number; qty: number; milk?: string; addons?: string[] }>;
  total: number;
}

function QuickOrderStrip({ menuItems, onRepeat, onDetail, categories, favorites }: {
  menuItems: MenuItem[];
  onRepeat: (items: CartItem[]) => void;
  onDetail: (item: MenuItem, gradient: string) => void;
  categories: typeof CATEGORIES;
  favorites: string[];
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (!user) return;
    // Try with index first, fallback without orderBy
    const q = query(
      collection(getFirebaseDb(), "orders"),
      where("userId", "==", user.uid),
      where("status", "==", "paid"),
      limit(15)
    );
    getDocs(q).then((snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => ((b as Record<string, unknown>).createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0 - (((a as Record<string, unknown>).createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0));

      const seen = new Set<string>();
      const unique: RecentOrder[] = [];
      for (const data of docs) {
        const d = data as Record<string, unknown>;
        const items = d.items as Array<{ name: string; size: string; price: number; qty: number; milk?: string; addons?: string[] }>;
        if (!items || items.length === 0) continue;
        const key = items.map(i => `${i.name}_${i.size}`).sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const label = items.length === 1
          ? `${items[0].name} ${items[0].size || ""}`.trim()
          : `${items[0].name} +${items.length - 1}`;
        const milk = items[0].milk;
        const sub = milk && milk !== "Стандарт" && milk !== "standard" ? milk : "";
        unique.push({ key, label, sub, items, total: (d.total as number) ?? 0 });
        if (unique.length >= 1) break; // Only 1 repeat card
      }
      setRecentOrders(unique);
    }).catch(() => {});
  }, [user]);

  // Favorite items from user profile
  const favoriteItems = menuItems.filter(i => favorites.includes(i.id));
  // Popular = featured minus favorites (favorites replace them)
  const featured = menuItems
    .filter(i => (i as MenuItem & { featured?: boolean }).featured && !favorites.includes(i.id));

  // Final cards: repeat (1) → favorites → popular (fill remaining)
  const popularCards = [...favoriteItems, ...featured];

  if (recentOrders.length === 0 && popularCards.length === 0) return null;

  const handleRepeat = (order: RecentOrder) => {
    const cartItems: CartItem[] = order.items.map(i => ({
      name: i.name,
      size: i.size,
      price: i.price,
      qty: i.qty,
      milk: i.milk,
      syrup: i.addons && i.addons.length > 0 ? i.addons[0] : undefined,
    }));
    onRepeat(cartItems);
    router.push("/order");
  };

  return (
    <section className="mt-2" aria-label="Быстрый заказ">
      <div className="px-3 mb-2">
        <h2 className="text-sm font-bold text-brand-text">⚡ Быстрый заказ</h2>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-3 pb-2">
        {/* Repeat last order — bright card */}
        {recentOrders.map((order) => (
          <motion.button
            key={order.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleRepeat(order)}
            className="flex-shrink-0 w-36 rounded-2xl p-3 text-left bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-white"
            style={{ boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}
          >
            <span className="text-lg">🔁</span>
            <p className="text-xs font-bold truncate mt-1">{order.label}</p>
            {order.sub && <p className="text-[10px] text-white/70 truncate">{order.sub}</p>}
            <p className="text-sm font-bold mt-1">{order.total}₸ →</p>
          </motion.button>
        ))}
        {/* Favorites (❤️) then popular */}
        {popularCards.map((item) => {
          const itemCat = categories.find(c => c.id === item.category);
          const isFav = favorites.includes(item.id);
          const minPrice = Math.min(...Object.values(item.sizes));
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDetail(item, itemCat?.gradient ?? "from-[#1a7a44] to-[#2d9e5a]")}
              className={`flex-shrink-0 w-28 rounded-2xl p-3 text-white text-left bg-gradient-to-br ${itemCat?.gradient ?? "from-[#1a7a44] to-[#2d9e5a]"}`}
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{itemCat?.icon ?? "☕"}</span>
                {isFav && <span className="text-xs">❤️</span>}
              </div>
              <p className="text-xs font-bold truncate mt-1">{item.name}</p>
              <p className="text-[10px] text-white/70 mt-0.5">от {minPrice}₸</p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

/* ═══ PAGE ═══ */
export default function MenuPage() {
  const { user } = useAuth();
  const { cart, addItem, removeItem, setItems, clearCart, totalItems, totalPrice } = useCart();
  const [cat, setCat] = useState("classic-coffee");
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");
  const [detailItem, setDetailItem] = useState<{ item: MenuItem; gradient: string } | null>(null);
  const [loyaltyCount, setLoyaltyCount] = useState(0);
  const [cafeOpen, setCafeOpen] = useState(true);
  const [stopList, setStopList] = useState<string[]>([]);
  const [geoNearby, setGeoNearby] = useState(false);
  const [activeOrderStatus, setActiveOrderStatus] = useState<"idle" | "new" | "pending" | "accepted" | "ready">("idle");
  const [streakDays, setStreakDays] = useState(0);
  const [lastOrderDate, setLastOrderDate] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [cookieCollected, setCookieCollected] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastCookieDate, setLastCookieDate] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  /* Load menu from Firestore */
  useEffect(() => {
    const q = query(collection(getFirebaseDb(), "menu_items"), orderBy("sortOrder", "asc"));
    return onSnapshot(q, (snap) => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
      setMenuLoading(false);
    }, () => setMenuLoading(false));
  }, []);

  const currentCat = CATEGORIES.find(c => c.id === cat) ?? CATEGORIES[0];
  const isSearching = search.trim().length >= 2;
  const searchResults = isSearching
    ? menuItems.filter(i => {
        const q = search.toLowerCase();
        return i.name.toLowerCase().includes(q)
          || (i.ingredients ?? "").toLowerCase().includes(q)
          || (i.description ?? "").toLowerCase().includes(q)
          || (CATEGORIES.find(c => c.id === i.category)?.name ?? "").toLowerCase().includes(q);
      })
    : [];
  const currentItems = isSearching ? searchResults : menuItems.filter(i => i.category === cat);

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
        setStreakDays(snap.data().streak ?? 0);
        setLastOrderDate(snap.data().lastOrderDate ?? null);
        const lcd = snap.data().lastCookieDate ?? null;
        setLastCookieDate(lcd);
        setCookieCollected(isCookieCollectedToday(lcd));
        setFavorites(snap.data().favoriteItems ?? []);
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  /* Geolocation check — once on mount, not on every snapshot */
  useEffect(() => {
    if (!navigator.geolocation || !user) return;
    let cancelled = false;
    getDoc(doc(getFirebaseDb(), "users", user.uid)).then((snap) => {
      if (cancelled) return;
      if (snap.exists() && snap.data().geolocationAllowed) {
        navigator.geolocation.getCurrentPosition((pos) => {
          if (cancelled) return;
          const dist = getDistanceM(pos.coords.latitude, pos.coords.longitude, CAFE_LAT, CAFE_LNG);
          if (dist <= CAFE_RADIUS_M) setGeoNearby(true);
        }, () => {});
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  /* Listen to CURRENT USER's active orders for scene state */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(getFirebaseDb(), "orders"),
      where("userId", "==", user.uid),
      where("status", "in", ["new", "pending", "accepted", "ready"]),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const s = snap.docs[0].data().status;
        setActiveOrderStatus(s === "new" ? "pending" : s);
      } else {
        setActiveOrderStatus("idle");
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  /* Track category change */
  useEffect(() => {
    trackEvent("Menu Viewed", { category: cat });
  }, [cat]);

  const { showToast } = useToast();

  const dailyCookie = getDailyCookie(menuItems);
  const dailyFact = dailyCookie ? COOKIE_FACTS.find(f => f.id === dailyCookie.factId) : null;

  const handleCollectCookie = async () => {
    if (!user || !dailyCookie || cookieCollected) return;
    setCookieCollected(true);
    const db = getFirebaseDb();
    const userRef = firestoreDoc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const currentCount = snap.exists() ? snap.data()?.cookiesCount ?? 0 : 0;
    await updateDoc(userRef, {
      lastCookieDate: dailyCookie.date,
      cookiesCount: currentCount + 1,
      pendingCookie: true,
    }).catch(() => {});
    showToast("🍪 Печенька в профиле!", "success");
  };
  const toggleFavorite = async (itemId: string) => {
    if (!user) return;
    const newFavs = favorites.includes(itemId)
      ? favorites.filter(f => f !== itemId)
      : [...favorites, itemId];
    setFavorites(newFavs);
    await updateDoc(firestoreDoc(getFirebaseDb(), "users", user.uid), { favoriteItems: newFavs }).catch(() => {});
  };

  const addToCart = (name: string, size: string, price: number, milk?: string, syrup?: string) => {
    trackEvent("Item Added to Cart", { name, size, price, milk, syrup });
    showToast(`${name} добавлен в корзину`, "success");
    addItem(name, size, price, milk, syrup);
  };

  const repeatOrder = (items: CartItem[]) => { setItems(items); };
  const removeFromCart = (name: string, size: string, milk?: string, syrup?: string) => {
    removeItem(name, size, milk, syrup);
  };

  const router = useRouter();
  const goToOrder = () => { router.push("/order"); };

  return (
    <main className="min-h-screen bg-brand-bg pb-40">
      {!cafeOpen && (
        <div className="bg-red-50 text-red-600 text-center py-2 text-sm font-medium" role="alert">
          Кофейня закрыта · Открывается в 07:30
        </div>
      )}

      <header className="px-3 pt-2 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold text-brand-text">Love is Coffee</h1>
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${cafeOpen ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true" />
          <span className="text-xs text-brand-text/50">{cafeOpen ? "Открыто" : "Закрыто"}</span>
        </div>
      </header>
      {/* Scene */}
      <div className="h-[45vh] relative overflow-hidden">
        <CoffeeScene
          orderStatus={activeOrderStatus === "new" ? "pending" : activeOrderStatus as BaristaState}
          streakDays={streakDays}
          lastOrderDate={lastOrderDate}
        />
      </div>

      {/* Quick order strip: recent orders + popular */}
      <QuickOrderStrip
        menuItems={menuItems}
        onRepeat={repeatOrder}
        onDetail={(item, gradient) => setDetailItem({ item, gradient })}
        categories={CATEGORIES}
        favorites={favorites}
      />

      {/* Loyalty */}
      <div className="relative z-10 px-3 mt-2">
        <LoyaltyBanner count={loyaltyCount} />
      </div>

      {/* Hero hit */}
      <section className="px-3 mt-3" aria-label="Хит сезона">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-mint/20 rounded-full" aria-hidden="true" />
          <div className="absolute right-10 bottom-2 w-16 h-16 bg-brand-mint/15 rounded-full" aria-hidden="true" />
          <div className="absolute left-1/2 top-0 w-24 h-24 bg-brand-mint/10 rounded-full -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
          <p className="text-xs uppercase tracking-wider text-brand-mint font-bold mb-1">Хит сезона</p>
          <h2 className="font-display text-xl font-bold mb-1">Раф классика</h2>
          <p className="text-sm text-white/70 mb-3">Нежный сливочный кофе с ванилью</p>
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">1 250 ₸</span>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => { if (cafeOpen) addToCart("Раф классика", "M", 1250, MILKS[0].name); }}
              disabled={!cafeOpen}
              aria-label="Добавить Раф классика в корзину"
              className="bg-white text-brand-dark px-5 py-2.5 rounded-full text-sm font-bold disabled:opacity-50 min-h-[44px]">В корзину</motion.button>
          </div>
        </motion.div>
      </section>

      {/* Search */}
      <div className="px-3 mt-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text/30 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти напиток..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#d0f0e0] bg-white text-sm text-brand-text outline-none focus:border-brand-mint focus:ring-1 focus:ring-brand-mint min-h-[44px]"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text/30 min-w-[32px] min-h-[32px] flex items-center justify-center">✕</button>
          )}
        </div>
        {isSearching && (
          <p className="text-xs text-brand-text/40 mt-1.5 px-1">
            {searchResults.length > 0 ? `Найдено: ${searchResults.length}` : "Ничего не найдено"}
          </p>
        )}
      </div>

      {/* Tabs — hidden during search */}
      {!isSearching && (
      <nav ref={tabsRef} data-menu-tabs aria-label="Категории меню" className="px-3 mt-3 relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-1" role="tablist">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)}
                role="tab"
                aria-selected={cat === c.id}
                aria-label={`Категория ${c.name}`}
                className={`px-4 py-2.5 min-h-[44px] rounded-[20px] text-sm font-medium whitespace-nowrap transition-all ${
                  cat === c.id ? "bg-[#1a7a44] text-white shadow-md" : "bg-[#f0fdf4] text-[#2d9e5a]"
                }`}><span className="mr-1">{c.icon}</span>{c.name}</button>
            ))}
          </div>
        </div>
        {/* Scroll fade indicator */}
        <div className="absolute right-3 top-0 bottom-0 w-8 bg-gradient-to-l from-brand-bg to-transparent pointer-events-none" aria-hidden="true" />
      </nav>
      )}

      {/* Grid */}
      <section className="px-3 mt-3" aria-label="Каталог напитков" role="tabpanel">
        {menuLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl h-40 bg-[#e5e7eb] animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={isSearching ? "search" : cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentItems.map((item, idx) => {
                const itemCat = CATEGORIES.find(c => c.id === item.category) ?? currentCat;
                return (
                  <DrinkCard
                    key={item.id} item={item} catIcon={itemCat.icon} idx={idx}
                    gradient={itemCat.gradient}
                    stopped={stopList.includes(item.name) || stopList.includes(item.id)}
                    onAdd={addToCart}
                    onDetail={() => setDetailItem({ item, gradient: itemCat.gradient })}
                    cookieData={dailyCookie && dailyFact && item.id === dailyCookie.menuItemId ? {
                      fact: dailyFact,
                      collected: cookieCollected,
                      onCollect: handleCollectCookie,
                    } : null}
                  />
                );
              })}
              {currentItems.length === 0 && (
                <p className="col-span-2 text-center text-brand-text/40 py-8">{isSearching ? "Ничего не найдено" : "Нет напитков в этой категории"}</p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Detail sheet */}
      <AnimatePresence>
        {detailItem && (
          <DrinkDetail
            item={detailItem.item}
            catGradient={detailItem.gradient}
            onAdd={addToCart}
            onClose={() => setDetailItem(null)}
            isFavorite={favorites.includes(detailItem.item.id)}
            onToggleFavorite={() => toggleFavorite(detailItem.item.id)}
          />
        )}
      </AnimatePresence>

      {/* Floating cart button */}
      <AnimatePresence>
        {totalItems > 0 && !showCart && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-[80px] right-4 z-[60] w-14 h-14 bg-brand-dark text-white rounded-full shadow-xl flex items-center justify-center"
            style={{ maxWidth: "calc((480px - 100%) / 2 + 100% - 16px)" }}
          >
            <span className="text-xl">🛒</span>
            <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full cart bottom sheet */}
      <AnimatePresence>
        {showCart && cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 flex items-end justify-center"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-w-[480px] max-h-[80vh] flex flex-col"
            >
              <div className="p-5 pb-0">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-brand-dark">🛒 Корзина</h3>
                  <button onClick={() => setShowCart(false)} className="text-brand-text/40 text-sm min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-2">
                {cart.map((item, idx) => (
                  <div key={`${item.name}_${item.size}_${item.milk ?? ""}_${item.syrup ?? ""}_${idx}`}
                    className="flex items-center gap-3 py-3 border-b border-[#d0f0e0] last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-lg flex-shrink-0">☕</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-brand-text truncate">{item.name}</p>
                      <p className="text-xs text-brand-text/40">
                        {item.size !== "—" && `${item.size}`}
                        {item.milk && item.milk !== "Стандарт" && ` · ${item.milk}`}
                        {item.syrup && ` · ${item.syrup}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-brand-dark">{item.price * item.qty}₸</p>
                      {item.qty > 1 && <p className="text-[10px] text-brand-text/40">×{item.qty}</p>}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.name, item.size, item.milk, item.syrup)}
                      className="text-red-400 hover:text-red-600 min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                    >✕</button>
                  </div>
                ))}
              </div>

              <div className="p-5 pt-3 border-t border-[#d0f0e0] bg-white">
                <div className="flex justify-between mb-3">
                  <span className="text-brand-text font-medium">Итого</span>
                  <span className="text-xl font-bold text-brand-dark">{totalPrice}₸</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowCart(false); goToOrder(); }}
                  disabled={!cafeOpen}
                  className="w-full py-3.5 bg-brand-dark text-white font-bold rounded-xl text-base shadow-lg disabled:opacity-50 min-h-[48px]"
                >
                  {cafeOpen ? `Оформить заказ · ${totalPrice}₸` : "Кофейня закрыта"}
                </motion.button>
                <button
                  onClick={() => { clearCart(); setShowCart(false); }}
                  className="w-full py-2 text-red-400 text-sm font-medium mt-2"
                >
                  Очистить корзину
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
