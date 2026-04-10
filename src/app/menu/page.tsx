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
import QuickOrdersBlock from "@/components/QuickOrdersBlock";

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

function getSizes(item: MenuItem): Size[] | null {
  const keys = Object.keys(item.sizes) as Size[];
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
function DrinkDetail({ item, catGradient, onAdd, onClose }: {
  item: MenuItem; catGradient: string;
  onAdd: (name: string, size: string, price: number, milk?: string, syrup?: string) => void;
  onClose: () => void;
}) {
  const sizes = getSizes(item);
  const [sz, setSz] = useState<Size | null>(getDefault(item));
  const [milk, setMilk] = useState(0);
  const [syrup, setSyrup] = useState(0);
  const basePrice = getPrice(item, sz);
  const milkSurcharge = item.availableMilk ? MILKS[milk].surcharge : 0;
  const syrupSurcharge = SYRUPS[syrup].surcharge;
  const totalPrice = basePrice + milkSurcharge + syrupSurcharge;

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
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 max-h-[85vh] overflow-y-auto"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${catGradient} flex items-center justify-center text-2xl text-white shrink-0`}>
            {CATEGORIES.find(c => c.id === item.category)?.icon ?? "☕"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl font-bold text-brand-text">{item.name}</h2>
              {item.tags.includes("hit") && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-pink/10 text-brand-pink">{"Хит"}</span>}
              {item.tags.includes("new") && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-mint/20 text-brand-dark">NEW</span>}
              {item.tags.includes("season") && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-600">{"Сезон"}</span>}
            </div>
            {item.ingredients && <p className="text-xs text-brand-text/50 mt-1">{item.ingredients}</p>}
          </div>
          {item.radarData && <RadarChart profile={item.radarData} />}
        </div>

        {sizes && (
          <div className="mt-4">
            <p className="text-xs text-brand-text/50 mb-2">Размер</p>
            <div className="flex gap-2">
              {sizes.map((s) => (
                <button key={s} onClick={() => setSz(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    sz === s ? "bg-brand-dark text-white shadow-md" : "bg-gray-100 text-brand-text/50"
                  }`}>{s} — {item.sizes[s]}₸</button>
              ))}
            </div>
          </div>
        )}

        {item.availableMilk && (
          <div className="mt-4">
            <p className="text-xs text-brand-text/50 mb-2">Молоко</p>
            <div className="flex gap-2 flex-wrap">
              {MILKS.map((m, i) => (
                <button key={m.name} onClick={() => setMilk(i)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    milk === i ? "bg-brand-mint/20 text-brand-dark border border-brand-mint" : "bg-gray-100 text-gray-500"
                  }`}>
                  {m.name}
                  {m.surcharge > 0 && <span className="text-xs opacity-60 ml-1">+{m.surcharge}₸</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs text-brand-text/50 mb-2">Сироп</p>
          <div className="flex gap-2 flex-wrap">
            {SYRUPS.map((s, i) => (
              <button key={s.name} onClick={() => setSyrup(i)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  syrup === i ? "bg-brand-mint/20 text-brand-dark border border-brand-mint" : "bg-gray-100 text-gray-500"
                }`}>
                {s.name}
                {s.surcharge > 0 && <span className="text-xs opacity-60 ml-1">+{s.surcharge}₸</span>}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
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
          className="w-full mt-6 py-4 bg-brand-dark text-white font-bold rounded-2xl text-lg shadow-lg"
        >
          Добавить — {totalPrice}₸
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══ DRINK CARD ═══ */
function DrinkCard({ item, gradient, catIcon, onAdd, onDetail, idx, stopped }: {
  item: MenuItem; gradient: string; catIcon: string; idx: number; stopped?: boolean;
  onAdd: (name: string, size: string, price: number, milk?: string) => void;
  onDetail: () => void;
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
      className={`rounded-2xl p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow ${unavailable ? "opacity-50 cursor-not-allowed" : ""} bg-gradient-to-br ${gradient} text-white`}
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    >
      <div className="text-3xl mb-2">{catIcon}</div>
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="font-semibold text-sm">{item.name}</span>
        {item.tags.includes("hit") && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/25 text-white">{"Хит"}</span>}
        {item.tags.includes("new") && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/25 text-white">NEW</span>}
        {item.tags.includes("season") && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/25 text-white">{"Сезон"}</span>}
      </div>
      {unavailable && <span className="text-[10px] text-white/70 font-medium">Закончился</span>}
      {item.ingredients && !unavailable && <p className="text-[10px] text-white/60 line-clamp-1">{item.ingredients}</p>}
      {sizes && !unavailable && (
        <div className="flex gap-1 mb-1 mt-1">
          {sizes.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/15 text-white/80">{s}</span>
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
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    getDocs(q).then((snap) => {
      if (!snap.empty && snap.docs[0]) {
        const d = snap.docs[0].data();
        if (d && d.items) {
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
        <p className="text-xs text-brand-text/50">{"Обычный?"}</p>
        <p className="text-sm font-medium text-brand-text truncate max-w-[200px]">{lastOrder.name}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => { sessionStorage.setItem("oic_is_repeat", "true"); onRepeat(lastOrder.items); }}
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
  const [cat, setCat] = useState("classic-coffee");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
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
  const currentItems = menuItems.filter(i => i.category === cat);

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
  const addToCart = (name: string, size: string, price: number, milk?: string, syrup?: string) => {
    trackEvent("Item Added to Cart", { name, size, price, milk, syrup });
    showToast(`${name} добавлен в корзину`, "success");
    setCart((prev) => {
      const key = `${name}_${size}_${milk ?? ""}_${syrup ?? ""}`;
      const ex = prev.find((i) => `${i.name}_${i.size}_${i.milk ?? ""}_${i.syrup ?? ""}` === key);
      if (ex) return prev.map((i) => `${i.name}_${i.size}_${i.milk ?? ""}_${i.syrup ?? ""}` === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { name, size, price, qty: 1, milk, syrup }];
    });
  };

  const repeatOrder = (items: CartItem[]) => { setCart(items); };
  const removeFromCart = (name: string, size: string, milk?: string, syrup?: string) => {
    setCart((prev) => prev.filter((i) => !(i.name === name && i.size === size && (i.milk ?? "") === (milk ?? "") && (i.syrup ?? "") === (syrup ?? ""))));
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  useEffect(() => { if (cart.length > 0) sessionStorage.setItem("oic_cart", JSON.stringify(cart)); }, [cart]);
  const router = useRouter();
  const goToOrder = () => { sessionStorage.setItem("oic_cart", JSON.stringify(cart)); router.push("/order"); };

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

      {/* Quick orders block */}
      <QuickOrdersBlock />

      {/* Content overlaps bottom of scene */}
      <div className="relative z-10 -mt-8 px-3 space-y-3">
        <LoyaltyBanner count={loyaltyCount} />
        <QuickRepeat onRepeat={repeatOrder} />
      </div>

      {geoNearby && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-3 bg-brand-dark text-white rounded-2xl px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm">📍 Кофейня рядом!</span>
          <button onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })} className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">{"Быстрый заказ"}</button>
        </motion.div>
      )}

      {/* Hero hit */}
      <section className="px-3 mt-3" aria-label="Хит сезона">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-mint/20 rounded-full" aria-hidden="true" />
          <div className="absolute right-10 bottom-2 w-16 h-16 bg-brand-mint/15 rounded-full" aria-hidden="true" />
          <div className="absolute left-1/2 top-0 w-24 h-24 bg-brand-mint/10 rounded-full -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
          <p className="text-[10px] uppercase tracking-wider text-brand-mint font-bold mb-1">Хит сезона</p>
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

      {/* Tabs */}
      <nav ref={tabsRef} data-menu-tabs aria-label="Категории меню" className="px-3 mt-4 relative">
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
            <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentItems.map((item, idx) => (
                <DrinkCard
                  key={item.id} item={item} catIcon={currentCat.icon} idx={idx}
                  gradient={currentCat.gradient}
                  stopped={stopList.includes(item.name) || stopList.includes(item.id)}
                  onAdd={addToCart}
                  onDetail={() => setDetailItem({ item, gradient: currentCat.gradient })}
                />
              ))}
              {currentItems.length === 0 && (
                <p className="col-span-2 text-center text-brand-text/40 py-8">{"Нет напитков в этой категории"}</p>
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
          />
        )}
      </AnimatePresence>

      {/* Cart popup */}
      <AnimatePresence>
        {showCart && cart.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-20 left-3 right-3 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-[#d0f0e0] p-4 z-50">
            <h3 className="font-bold text-brand-dark mb-2">{"Твой заказ"}</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {cart.map((i, idx) => (
                <div key={`${i.name}_${i.size}_${i.milk ?? ""}_${i.syrup ?? ""}_${idx}`} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-brand-text">{i.name}</span>
                    {i.size !== "—" && <span className="text-brand-text/40 text-xs ml-1">({i.size})</span>}
                    {i.milk && <span className="text-brand-mint text-xs ml-1">{i.milk}</span>}
                    {i.syrup && <span className="text-amber-500 text-xs ml-1">{i.syrup}</span>}
                    {i.qty > 1 && <span className="text-brand-pink text-xs font-bold ml-1">×{i.qty}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-dark">{i.price * i.qty} ₸</span>
                    <button onClick={() => removeFromCart(i.name, i.size, i.milk, i.syrup)} className="text-brand-pink/50 hover:text-brand-pink text-xs min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
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
            className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#d0f0e0] z-40">
            <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
              <button onClick={() => setShowCart(!showCart)} className="flex items-center gap-2">
                <span className="bg-brand-dark text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">{totalItems}</span>
                <span className="text-sm font-medium text-brand-text">{showCart ? "Скрыть" : "Показать"}</span>
              </button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={goToOrder}
                disabled={!cafeOpen}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-white font-bold rounded-full text-sm shadow-lg disabled:opacity-50">
                <span>Оформить</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{totalPrice} ₸</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
