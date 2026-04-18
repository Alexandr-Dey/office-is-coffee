"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CoffeeScene, { type BaristaState } from "@/components/CoffeeScene";
import { useAuth } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, getDoc, where as fbWhere, updateDoc } from "firebase/firestore";
import { CAFE_LAT, CAFE_LNG, CAFE_RADIUS_M, getDistanceM } from "@/lib/constants";
import { trackEvent } from "@/lib/mixpanel";
import type { CartItem } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { useCart } from "@/lib/cart";
import {
  CATEGORIES, MENU_ITEMS, GRADIENT_CLASSES, PASTEL_BG, PASTEL_BORDER,
  type MenuItem, type StopList, type CategoryId, type Size,
  getCategory, getAvailableSizes, getDefaultSize, getMinPrice, formatPrice,
  normalizeStopList, makeCartKey,
} from "@/lib/menu";
import { getDailyCookie, isCookieCollectedToday } from "@/lib/dailyCookie";
import { COOKIE_FACTS, type CookieFact } from "@/lib/cookieFacts";
import CookieButton from "@/components/CookieButton";

/* ═══ CATEGORY ICONS ═══ */
const CAT_ICONS: Record<CategoryId, string> = {
  coffee_classic: '☕',
  coffee_author: '✨',
  ice_coffee: '❄️',
  tea_home: '🍵',
  tea_author: '🌿',
  matcha: '🍃',
  ice_tea: '🧊',
  lemonade: '🍋',
  fresh: '🍊',
  smoothie: '🍓',
  milkshake: '🥛',
};

/* ═══ TIME-BASED GREETING ═══ */
function getAlmatyHour(): number {
  return (new Date().getUTCHours() + 5) % 24;
}

function getGreeting(name?: string): { text: string; emoji: string; suggestion: string } {
  const h = getAlmatyHour();
  const firstName = name?.split(" ")[0] ?? "";
  if (h >= 5 && h < 12) return {
    text: firstName ? `Доброе утро, ${firstName}` : "Доброе утро",
    emoji: "☀️",
    suggestion: "Начни день с кофе",
  };
  if (h >= 12 && h < 17) return {
    text: firstName ? `Добрый день, ${firstName}` : "Добрый день",
    emoji: "👋",
    suggestion: "Перерыв на кофе?",
  };
  if (h >= 17 && h < 22) return {
    text: firstName ? `Добрый вечер, ${firstName}` : "Добрый вечер",
    emoji: "🌇",
    suggestion: "Может чай или какао?",
  };
  return {
    text: firstName ? `Привет, ${firstName}` : "Привет",
    emoji: "🌙",
    suggestion: "Поздний кофе — особое настроение",
  };
}

function getStreakMessage(streak: number): string | null {
  if (streak === 0) return null;
  if (streak >= 14) return `🔥 ${streak}д`;
  if (streak >= 7) return `🏆 ${streak}д`;
  if (streak >= 3) return `🔥 ${streak}д`;
  return `☕ ${streak}д`;
}

/* ═══ LOYALTY ═══ */
function LoyaltyBanner({ count, streak }: {
  count: number; streak: number;
}) {
  const progress = (count / 8) * 100;
  const nextFree = 8 - count;
  const streakMsg = getStreakMessage(streak);

  return (
    <div className="bg-white rounded-2xl border border-[#d0f0e0] px-3 py-2 flex items-center gap-2" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      {/* Cups */}
      <div className="flex gap-0.5 flex-shrink-0">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${
            i < count ? "bg-brand-dark" : i === count ? "bg-brand-mint/30 border border-dashed border-brand-mint" : "bg-gray-100"
          }`}>{i < count ? "☕" : ""}</div>
        ))}
      </div>

      {/* Progress */}
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-brand-dark to-brand-mint rounded-full" />
        </div>
        <p className="text-[10px] text-brand-text/40 mt-0.5 truncate">
          {count === 7 ? "🎉 Следующий бесплатный!" : `${count}/8 · ещё ${nextFree}`}
        </p>
      </div>

      {/* Streak */}
      {streakMsg && (
        <span className="text-[10px] font-bold text-brand-dark bg-brand-mint/15 px-1.5 py-0.5 rounded-full flex-shrink-0">
          {streakMsg}
        </span>
      )}
    </div>
  );
}

/* ═══ DRINK CARD ═══ */
const DrinkCard = memo(function DrinkCard({ item, onQuickAdd, onDetail, idx, stopped, cookieData }: {
  item: MenuItem; idx: number; stopped: boolean;
  onQuickAdd: () => void;
  onDetail: () => void;
  cookieData?: { fact: CookieFact; collected: boolean; onCollect: () => void } | null;
}) {
  const cat = getCategory(item.category);
  const gradient = GRADIENT_CLASSES[cat.gradient];
  const icon = CAT_ICONS[item.category];
  const sizes = getAvailableSizes(item);
  const [added, setAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stopped) return;
    onQuickAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      onClick={stopped ? undefined : onDetail}
      aria-label={`${item.name}, от ${getMinPrice(item)} ₸`}
      className={`rounded-2xl p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow relative ${PASTEL_BG[cat.gradient]} border ${PASTEL_BORDER[cat.gradient]} ${
        stopped ? "opacity-50 grayscale cursor-not-allowed" : ""
      }`}
      style={{ boxShadow: "0 2px 12px rgba(30,120,70,0.06)" }}
    >
      {cookieData && (
        <CookieButton fact={cookieData.fact} collected={cookieData.collected} onCollect={cookieData.onCollect} />
      )}
      {stopped && (
        <span className="absolute top-2 right-2 bg-brand-pink text-white rounded-full px-2 py-0.5 text-xs font-bold">
          Нет в наличии
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl mb-2`}>{icon}</div>
      <span className="font-semibold text-sm text-brand-text">{item.name}</span>
      {item.description && !stopped && (
        <p className="text-xs text-brand-text/50 line-clamp-1 mt-0.5">{item.description}</p>
      )}
      {sizes.length > 1 && !stopped && (
        <div className="flex gap-1 mb-1 mt-1">
          {sizes.map(s => (
            <span key={s} className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-brand-bg text-brand-text/60">{s}</span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="font-bold text-brand-dark">от {formatPrice(getMinPrice(item))}</span>
        {!stopped && (
          <motion.button
            whileTap={{ scale: 0.8 }}
            animate={added ? { scale: [1, 1.3, 1] } : {}}
            onClick={handleQuickAdd}
            aria-label={`Добавить ${item.name} в корзину`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
              added ? `bg-gradient-to-br ${gradient} text-white shadow-md` : "bg-white text-brand-dark border border-[#e0e0e0] hover:shadow-md"
            }`}>{added ? "✓" : "+"}</motion.button>
        )}
      </div>
    </motion.article>
  );
});

/* ═══ QUICK ORDER STRIP ═══ */
interface RecentOrder {
  key: string;
  label: string;
  sub: string;
  items: Array<{ itemId?: string; name: string; size: string; basePrice?: number; totalPrice?: number; price?: number; qty: number; modifiers?: { id: string; name: string; price: number }[]; category?: string }>;
  total: number;
}

function QuickOrderStrip({ onRepeat, onDetail, favorites, popularIds, stopList }: {
  onRepeat: (items: CartItem[]) => void;
  onDetail: (item: MenuItem) => void;
  favorites: string[];
  popularIds: string[];
  stopList: string[];
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const q = query(
      collection(getFirebaseDb(), "orders"),
      fbWhere("userId", "==", user.uid),
      fbWhere("status", "==", "paid"),
      limit(15)
    );
    getDocs(q).then((snap) => {
      if (cancelled) return;
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = ((a as Record<string, unknown>).createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
          const tb = ((b as Record<string, unknown>).createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
          return tb - ta;
        });

      const seen = new Set<string>();
      const unique: RecentOrder[] = [];
      for (const data of docs) {
        const d = data as Record<string, unknown>;
        const items = d.items as RecentOrder["items"];
        if (!items || items.length === 0) continue;
        const key = items.map(i => `${i.name}_${i.size}`).sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const label = items.length === 1
          ? `${items[0].name} (${items[0].size})`.trim()
          : `${items[0].name} +${items.length - 1}`;
        const mods = items[0].modifiers;
        const sub = mods && mods.length > 0 ? mods.map(m => m.name).join(", ") : "";
        unique.push({ key, label, sub, items, total: (d.total as number) ?? 0 });
        if (unique.length >= 1) break;
      }
      setRecentOrders(unique);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const favoriteItems = MENU_ITEMS.filter(i => favorites.includes(i.id));
  // Популярные — исключаем те что уже в избранном чтобы не дублировать
  const favSet = new Set(favorites);
  const popularItems = popularIds
    .map(id => MENU_ITEMS.find(i => i.id === id))
    .filter((i): i is MenuItem => !!i && !stopList.includes(i.id) && !favSet.has(i.id));

  if (recentOrders.length === 0 && favoriteItems.length === 0 && popularItems.length === 0) return null;

  const handleRepeat = (order: RecentOrder) => {
    const cartItems: CartItem[] = order.items.map(i => {
      const mods = i.modifiers ?? [];
      const itemId = i.itemId ?? i.name;
      // Подтягиваем актуальную категорию из MENU_ITEMS если в legacy-заказе её нет
      const menuMatch = MENU_ITEMS.find(m => m.id === itemId);
      const category = i.category ?? menuMatch?.category ?? 'coffee_classic';
      const cartKey = makeCartKey(itemId, i.size as Size, mods.map(m => m.id));
      return {
        itemId,
        name: i.name,
        category,
        size: i.size,
        basePrice: i.basePrice ?? i.totalPrice ?? i.price ?? 0,
        modifiers: mods,
        totalPrice: i.totalPrice ?? i.price ?? 0,
        qty: i.qty,
        cartKey,
      };
    });
    onRepeat(cartItems);
    router.push("/order");
  };

  return (
    <section className="mt-2 px-3" aria-label="Быстрый заказ">
      <h2 className="text-sm font-bold text-brand-text mb-2">⚡ Быстрый заказ</h2>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
        {recentOrders.map((order) => (
          <motion.button
            key={order.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleRepeat(order)}
            className="flex-shrink-0 w-40 rounded-2xl p-3 text-left bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-white"
            style={{ boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}
          >
            <span className="text-lg">🔁</span>
            <p className="text-xs font-bold truncate mt-1">{order.label}</p>
            {order.sub && <p className="text-[10px] text-white/70 truncate">{order.sub}</p>}
            <p className="text-sm font-bold mt-1">{formatPrice(order.total)} →</p>
          </motion.button>
        ))}
        {favoriteItems.map((item) => {
          const itemCat = getCategory(item.category);
          const grad = GRADIENT_CLASSES[itemCat.gradient];
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDetail(item)}
              className={`flex-shrink-0 w-32 rounded-2xl p-3 text-white text-left bg-gradient-to-br ${grad}`}
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{CAT_ICONS[item.category]}</span>
                <span className="text-xs">❤️</span>
              </div>
              <p className="text-xs font-bold truncate mt-1">{item.name}</p>
              <p className="text-[10px] text-white/70 mt-0.5">от {formatPrice(getMinPrice(item))}</p>
            </motion.button>
          );
        })}
        {popularItems.map((item) => {
          const itemCat = getCategory(item.category);
          const grad = GRADIENT_CLASSES[itemCat.gradient];
          return (
            <motion.button
              key={`pop-${item.id}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDetail(item)}
              className={`flex-shrink-0 w-32 rounded-2xl p-3 text-white text-left bg-gradient-to-br ${grad}`}
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{CAT_ICONS[item.category]}</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">🔥</span>
              </div>
              <p className="text-xs font-bold truncate mt-1">{item.name}</p>
              <p className="text-[10px] text-white/70 mt-0.5">от {formatPrice(getMinPrice(item))}</p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

/* ═══ SCENE TIP — подсказка тапнуть баристу ═══ */
const TIPS = [
  "❤️ Тапни на баристу — полетят сердечки!",
  "👆 Нажми на баристу в сцене",
  "💕 Покажи баристе любовь — тапни!",
];
const TIP_SESSION_KEY = "oic_scene_tip";

function SceneTip() {
  const [visible, setVisible] = useState(false);
  const [tipText, setTipText] = useState("");

  useEffect(() => {
    // Показываем раз в сессию, через 3 секунды после загрузки
    if (sessionStorage.getItem(TIP_SESSION_KEY)) return;
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setTipText(tip);
    const showTimer = setTimeout(() => setVisible(true), 3000);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(TIP_SESSION_KEY, "1");
    }, 7000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          onClick={() => { setVisible(false); sessionStorage.setItem(TIP_SESSION_KEY, "1"); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm text-brand-text text-xs font-semibold px-4 py-2 rounded-full shadow-lg cursor-pointer border border-[#d0f0e0]"
        >
          {tipText}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══ TYPING PLACEHOLDER ═══ */
function useTypingPlaceholder(words: string[]): string {
  const [text, setText] = useState(words[0]);

  useEffect(() => {
    let wordIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = words[wordIdx];
      if (!deleting) {
        charIdx++;
        setText(word.slice(0, charIdx));
        if (charIdx === word.length) {
          // Pause at full word, then start deleting
          timeout = setTimeout(() => { deleting = true; tick(); }, 2000);
          return;
        }
        timeout = setTimeout(tick, 80 + Math.random() * 40);
      } else {
        charIdx--;
        setText(word.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          wordIdx = (wordIdx + 1) % words.length;
          timeout = setTimeout(tick, 400);
          return;
        }
        timeout = setTimeout(tick, 40);
      }
    };

    timeout = setTimeout(tick, 1500);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return text;
}

/* ═══ KEYBOARD LAYOUT MAPS ═══ */
// EN QWERTY → RU ЙЦУКЕН (user typed on wrong layout)
const EN_RU: Record<string, string> = {
  q:'й',w:'ц',e:'у',r:'к',t:'е',y:'н',u:'г',i:'ш',o:'щ',p:'з',
  '[':'х',']':'ъ',a:'ф',s:'ы',d:'в',f:'а',g:'п',h:'р',j:'о',k:'л',
  l:'д',';':'ж',"'":"э",z:'я',x:'ч',c:'с',v:'м',b:'и',n:'т',m:'ь',
  ',':'б','.':'ю',
};
function enToRu(s: string): string {
  let r = '';
  for (const c of s) r += EN_RU[c] ?? c;
  return r === s ? '' : r; // empty if nothing changed
}

// KZ layout has extra letters — map common KZ keys to closest RU
const KZ_RU: Record<string, string> = {
  'ә':'а','ғ':'г','қ':'к','ң':'н','ө':'о','ү':'у','ұ':'у','і':'и','һ':'х',
};
function kzToRu(s: string): string {
  let r = '';
  let changed = false;
  for (const c of s) {
    if (KZ_RU[c]) { r += KZ_RU[c]; changed = true; }
    else r += c;
  }
  return changed ? r : '';
}

/* ═══ PAGE ═══ */
export default function MenuPage() {
  const { user } = useAuth();
  const { cart, addCartItem, removeCartItem, updateQty, setItems, clearCart, totalItems, totalPrice } = useCart();
  const [cat, setCat] = useState<CategoryId>("coffee_classic");
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");
  const animatedPlaceholder = useTypingPlaceholder([
    "Капучино...",
    "Раф медовый...",
    "Айс латте...",
    "Матча...",
    "Облепиховый чай...",
    "Фраппучино...",
    "Глинтвейн...",
    "Мокко...",
  ]);
  const [loyaltyCount, setLoyaltyCount] = useState(0);
  const [cafeOpen, setCafeOpen] = useState(true);
  const [stopList, setStopList] = useState<StopList>({ items: [], modifiers: [] });
  const [distanceToCafe, setDistanceToCafe] = useState<number | null>(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState<"idle" | "new" | "pending" | "accepted" | "ready">("idle");
  const [streakDays, setStreakDays] = useState(0);
  const [lastOrderDate, setLastOrderDate] = useState<string | null>(null);
  const [cookieCollected, setCookieCollected] = useState(false);
  const [lastCookieDate, setLastCookieDate] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [popularIds, setPopularIds] = useState<string[]>([]);
  const [totalOrders, setTotalOrders] = useState<number | undefined>(undefined);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const router = useRouter();

  /* Ensure push token is fresh on every visit */
  useEffect(() => {
    if (!user) return;
    import("@/lib/push").then(({ ensurePushToken }) => ensurePushToken(user.uid)).catch(() => {});
  }, [user]);

  const currentCat = CATEGORIES.find(c => c.id === cat) ?? CATEGORIES[0];
  const isSearching = search.trim().length >= 2;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.toLowerCase();
    // Генерируем варианты: оригинал + EN→RU раскладка + KZ→RU раскладка
    const variants = [q, enToRu(q), kzToRu(q)].filter(Boolean);
    return MENU_ITEMS.filter(i => {
      const name = i.name.toLowerCase();
      const desc = (i.description ?? "").toLowerCase();
      const catName = getCategory(i.category).name.toLowerCase();
      return variants.some(v =>
        name.includes(v) || desc.includes(v) || catName.includes(v)
      );
    });
  }, [search, isSearching]);
  const currentItems = useMemo(
    () => isSearching ? searchResults : MENU_ITEMS.filter(i => i.category === cat),
    [isSearching, searchResults, cat]
  );

  /* Listen to cafe status + stop list */
  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCafeOpen(data.isOpen ?? true);
        setStopList(normalizeStopList(data.stopList));
        setPopularIds(data.popularItems ?? []);
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
        // totalOrders — accumulated loyalty resets × 8 + current count
        const resets = snap.data().loyaltyResets ?? 0;
        const current = snap.data().loyaltyCount ?? 0;
        if (resets > 0 || current > 0) setTotalOrders(resets * 8 + current);
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  /* Geolocation — показываем расстояние до кофейни */
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const getPosition = () => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const dist = getDistanceM(pos.coords.latitude, pos.coords.longitude, CAFE_LAT, CAFE_LNG);
        setDistanceToCafe(Math.round(dist));
      }, () => {}, { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false });
    };

    // Permissions API (Chrome/Firefox) — проверяем без промпта
    if (typeof navigator.permissions !== "undefined") {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") getPosition();
        // prompt/denied — не спрашиваем автоматически
      }).catch(() => {
        // Safari не поддерживает permissions.query для geolocation
        // Пробуем напрямую — если уже дано разрешение, сработает без промпта
        // Если не дано — Safari покажет системный промпт (это нормально, один раз)
        getPosition();
      });
    } else {
      // Старый браузер без Permissions API — пробуем напрямую
      getPosition();
    }
  }, []);

  /* Active orders for scene */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(getFirebaseDb(), "orders"),
      fbWhere("userId", "==", user.uid),
      fbWhere("status", "in", ["new", "pending", "accepted", "ready"]),
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

  useEffect(() => {
    trackEvent("Menu Viewed", { category: cat });
  }, [cat]);

  const dailyCookie = getDailyCookie(MENU_ITEMS);
  const dailyFact = dailyCookie ? COOKIE_FACTS.find(f => f.id === dailyCookie.factId) : null;

  const handleCollectCookie = async () => {
    if (!user || !dailyCookie || cookieCollected) return;
    setCookieCollected(true);
    const db = getFirebaseDb();
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const currentCount = snap.exists() ? snap.data()?.cookiesCount ?? 0 : 0;
    await updateDoc(userRef, {
      lastCookieDate: dailyCookie.date,
      cookiesCount: currentCount + 1,
      pendingCookie: true,
    }).catch(() => {});
    showToast("🍪 Печенька в профиле!", "success");
  };

  const handleQuickAdd = (item: MenuItem) => {
    const size = getDefaultSize(item);
    const basePrice = item.prices[size] ?? 0;
    trackEvent("Item Added to Cart", { name: item.name, size, price: basePrice });
    showToast(`${item.name} добавлен в корзину`, "success");
    addCartItem({
      itemId: item.id,
      name: item.name,
      category: item.category,
      size,
      basePrice,
      modifiers: [],
      totalPrice: basePrice,
    });
  };

  const openDetail = (item: MenuItem) => {
    router.push(`/menu/${item.id}`);
  };

  const goToOrder = () => { router.push("/order"); };
  const greeting = getGreeting(user?.displayName ?? undefined);

  return (
    <main className="min-h-screen bg-brand-bg pb-40">
      {!cafeOpen && (
        <div className="bg-red-50 text-red-600 text-center py-2 text-sm font-medium" role="alert">
          Кофейня закрыта · Открывается в 07:30
        </div>
      )}

      <header className="px-3 pt-2 flex items-center justify-between">
        <h1 className="font-display text-base font-bold text-brand-text truncate">
          {greeting.emoji} {greeting.text}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          {distanceToCafe !== null && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              distanceToCafe <= CAFE_RADIUS_M
                ? "bg-green-100 text-green-700"
                : distanceToCafe <= 1000
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
            }`}>
              📍 {distanceToCafe < 1000 ? `${distanceToCafe} м` : `${(distanceToCafe / 1000).toFixed(1)} км`}
            </span>
          )}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${cafeOpen ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true" />
            <span className="text-[11px] text-brand-text/50">{cafeOpen ? "Открыто" : "Закрыто"}</span>
          </div>
        </div>
      </header>

      {/* Scene */}
      <div className="h-[45vh] relative overflow-hidden">
        <CoffeeScene
          orderStatus={activeOrderStatus === "new" ? "pending" : activeOrderStatus as BaristaState}
          streakDays={streakDays}
          lastOrderDate={lastOrderDate}
          cafeOpen={cafeOpen}
        />
        <SceneTip />
      </div>

      {/* Loyalty */}
      <div className="px-3 -mt-8 relative z-10">
        <p className="text-[11px] font-bold text-brand-dark mb-1 px-1">☕ Каждый 8-й кофе — наш подарок</p>
        <LoyaltyBanner count={loyaltyCount} streak={streakDays} />
      </div>

      {/* Quick order + favorites + popular — single scrollable strip */}
      <QuickOrderStrip
        onRepeat={(items) => setItems(items)}
        onDetail={(item) => openDetail(item)}
        favorites={favorites}
        popularIds={popularIds}
        stopList={stopList.items}
      />

      {/* Search */}
      <div className="px-3 mt-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text/30 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={animatedPlaceholder}
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

      {/* Category tabs */}
      {!isSearching && (
        <nav ref={tabsRef} aria-label="Категории меню" className="px-3 mt-3 relative">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1" role="tablist">
              {CATEGORIES.map((c) => {
                const isActive = cat === c.id;
                return (
                  <button key={c.id} onClick={() => setCat(c.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Категория ${c.name}`}
                    className={`px-3 py-2 min-h-[40px] rounded-[16px] text-xs font-medium whitespace-nowrap transition-all ${
                      isActive ? `bg-gradient-to-r ${GRADIENT_CLASSES[c.gradient]} text-white shadow-md` : `${PASTEL_BG[c.gradient]} text-brand-text/60 border ${PASTEL_BORDER[c.gradient]}`
                    }`}>
                    <span className="mr-1">{CAT_ICONS[c.id]}</span>{c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="absolute right-3 top-0 bottom-0 w-8 bg-gradient-to-l from-brand-bg to-transparent pointer-events-none" aria-hidden="true" />
        </nav>
      )}

      {/* Category title */}
      {!isSearching && (
        <div className="px-3 mt-3">
          <h2 className="font-display text-xl font-bold text-brand-text">{currentCat.name}</h2>
        </div>
      )}

      {/* Grid */}
      <section className="px-3 mt-2" aria-label="Каталог напитков" role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div key={isSearching ? "search" : cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentItems.map((item, idx) => (
              <DrinkCard
                key={item.id}
                item={item}
                idx={idx}
                stopped={stopList.items.includes(item.id)}
                onQuickAdd={() => handleQuickAdd(item)}
                onDetail={() => openDetail(item)}
                cookieData={dailyCookie && dailyFact && item.id === dailyCookie.menuItemId ? {
                  fact: dailyFact,
                  collected: cookieCollected,
                  onCollect: handleCollectCookie,
                } : null}
              />
            ))}
            {currentItems.length === 0 && (
              <p className="col-span-2 text-center text-brand-text/40 py-8">
                {isSearching ? "Ничего не найдено" : "Нет напитков в этой категории"}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Floating cart button */}
      <AnimatePresence>
        {totalItems > 0 && !showCart && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-[80px] z-[60] bg-brand-dark text-white rounded-full shadow-xl flex items-center gap-2 px-5 h-14"
            style={{ right: "max(16px, calc(50% - 240px + 16px))" }}
          >
            <span className="text-xl">🛒</span>
            <span className="text-sm font-bold">{formatPrice(totalPrice)}</span>
            <span className="bg-brand-pink text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart bottom sheet */}
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
                  <div key={item.cartKey}
                    className="flex items-center gap-3 py-3 border-b border-[#d0f0e0] last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-lg flex-shrink-0">
                      {CAT_ICONS[item.category as CategoryId] ?? "☕"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-brand-text truncate">
                        {item.name} <span className="text-brand-text/40">({item.size})</span>
                      </p>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-brand-text/40 truncate">
                          + {item.modifiers.map(m => m.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => updateQty(idx, -1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-brand-text/60 font-bold text-sm">−</button>
                      <span className="w-6 text-center text-sm font-bold text-brand-dark">{item.qty}</span>
                      <button onClick={() => updateQty(idx, 1)}
                        className="w-8 h-8 rounded-lg bg-brand-mint/20 flex items-center justify-center text-brand-dark font-bold text-sm">+</button>
                    </div>
                    <p className="font-bold text-sm text-brand-dark flex-shrink-0 w-16 text-right">{formatPrice(item.totalPrice * item.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="p-5 pt-3 border-t border-[#d0f0e0] bg-white">
                <div className="flex justify-between mb-3">
                  <span className="text-brand-text font-medium">Итого</span>
                  <span className="text-xl font-bold text-brand-dark">{formatPrice(totalPrice)}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowCart(false); goToOrder(); }}
                  disabled={!cafeOpen}
                  className="w-full py-3.5 bg-brand-dark text-white font-bold rounded-xl text-base shadow-lg disabled:opacity-50 min-h-[48px]"
                >
                  {cafeOpen ? `Оформить заказ · ${formatPrice(totalPrice)}` : "Кофейня закрыта"}
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
