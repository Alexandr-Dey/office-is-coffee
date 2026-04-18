"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { motion } from "framer-motion";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/Toast";
import {
  MENU_ITEMS, CATEGORIES, MODIFIERS, GRADIENT_CLASSES, PASTEL_BG, PASTEL_BORDER,
  type MenuItem, type Modifier, type Size, type StopList, type CategoryId,
  getCategory, getModifiersForItem, getAvailableSizes,
  getDefaultSize, formatPrice, normalizeStopList, calculateItemTotal,
  isColdCategory,
} from "@/lib/menu";

/* ═══ CATEGORY ICONS ═══ */
const CAT_ICONS: Record<CategoryId, string> = {
  coffee_classic: '☕', coffee_author: '✨', ice_coffee: '❄️',
  tea_home: '🍵', tea_author: '🌿', matcha: '🍃',
  ice_tea: '🧊', lemonade: '🍋', fresh: '🍊',
  smoothie: '🍓', milkshake: '🥛',
};

const spring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function MenuItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { cart, addCartItem, totalItems } = useCart();
  const { showToast } = useToast();

  const itemId = params.id as string;
  const item = MENU_ITEMS.find(i => i.id === itemId);

  // ВСЕ хуки ВЫШЕ early return — иначе rules-of-hooks нарушение
  const [stopList, setStopList] = useState<StopList>({ items: [], modifiers: [] });
  const [isFavorite, setIsFavorite] = useState(false);
  const [size, setSize] = useState<Size>(item ? getDefaultSize(item) : 'M');
  const [selectedMilk, setSelectedMilk] = useState<string | null>(null);
  const [selectedSyrups, setSelectedSyrups] = useState<string[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Load favorites
  useEffect(() => {
    if (!user || !item) return;
    let cancelled = false;
    getDoc(doc(getFirebaseDb(), "users", user.uid)).then((snap) => {
      if (cancelled || !snap.exists()) return;
      const favs: string[] = snap.data().favoriteItems ?? [];
      setIsFavorite(favs.includes(item.id));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user, item]);

  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) setStopList(normalizeStopList(snap.data().stopList));
    }, () => {});
    return () => unsub();
  }, []);

  if (!item) {
    notFound();
    return null; // notFound() бросает, но TS этого не знает
  }

  const cat = getCategory(item.category);
  const gradient = GRADIENT_CLASSES[cat.gradient];
  const icon = CAT_ICONS[item.category];
  const sizes = getAvailableSizes(item);
  const isStopped = stopList.items.includes(item.id);

  const allModifiers = getModifiersForItem(item)
    .filter(m => !stopList.modifiers.includes(m.id));

  const milkOptions = allModifiers.filter(m => m.group === 'milk');
  const syrupOptions = allModifiers.filter(m => m.group === 'syrup');
  const addonOptions = allModifiers.filter(m => m.group === 'addon');

  const hasMilk = cat.allowedModifierGroups.includes('milk') && milkOptions.length > 0;
  const hasSyrup = cat.allowedModifierGroups.includes('syrup') && syrupOptions.length > 0;
  const hasAddon = cat.allowedModifierGroups.includes('addon') && addonOptions.length > 0;

  const basePrice = item.prices[size] ?? 0;

  // Сироп бесплатен в холодных напитках
  const syrupIsFree = isColdCategory(item.category);

  const chosenModifiers: Modifier[] = [];
  if (selectedMilk) {
    const milk = milkOptions.find(m => m.id === selectedMilk);
    if (milk) chosenModifiers.push(milk);
  }
  for (const id of selectedSyrups) {
    const s = syrupOptions.find(m => m.id === id);
    if (s) chosenModifiers.push(syrupIsFree ? { ...s, price: 0 } : s);
  }
  for (const id of selectedAddons) {
    const a = addonOptions.find(m => m.id === id);
    if (a) chosenModifiers.push(a);
  }

  const totalPrice = calculateItemTotal(basePrice, chosenModifiers);

  const toggleSyrup = (id: string) => {
    setSelectedSyrups(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    const userRef = doc(getFirebaseDb(), "users", user.uid);
    const snap = await getDoc(userRef).catch(() => null);
    if (!snap || !snap.exists()) return;
    const current: string[] = snap.data().favoriteItems ?? [];
    const updated = newVal
      ? [...current, item.id]
      : current.filter(f => f !== item.id);
    await updateDoc(userRef, { favoriteItems: updated }).catch(() => {});
  };

  // Сколько этого напитка уже в корзине (любой размер/модификаторы)
  const inCartCount = cart.filter(c => c.itemId === item.id).reduce((s, c) => s + c.qty, 0);

  const handleAdd = () => {
    addCartItem({
      itemId: item.id,
      name: item.name,
      category: item.category,
      size,
      basePrice,
      modifiers: chosenModifiers.map(m => ({ id: m.id, name: m.name, price: m.price })),
      totalPrice,
    });
    showToast(`${item.name} добавлен в корзину`, "success");
    router.push("/menu");
  };

  const pastelBg = PASTEL_BG[cat.gradient];
  const pastelBorder = PASTEL_BORDER[cat.gradient];

  return (
    <main className={`min-h-screen ${pastelBg} pb-40`}>
      {/* ═══ HERO ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className={`relative bg-gradient-to-br ${gradient} px-6 pt-4 pb-8`}
        style={{ minHeight: 280 }}
      >
        {/* Back button */}
        <button
          onClick={() => router.push("/menu")}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg z-10"
        >
          ←
        </button>

        {/* Favorite */}
        <button
          onClick={toggleFavorite}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg z-10"
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>

        {/* Stopped badge */}
        {isStopped && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-pink text-white rounded-full px-4 py-1 text-sm font-bold z-10">
            Нет в наличии
          </div>
        )}

        {/* Drink image / emoji */}
        <div className="flex justify-center mt-12 mb-6">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="w-[120px] h-[120px] object-contain drop-shadow-lg" />
          ) : (
            <div className="w-[120px] h-[120px] rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-6xl">
              {icon}
            </div>
          )}
        </div>

        {/* Title + description */}
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <h1 className="font-display text-4xl font-bold text-white">{item.name}</h1>
            {item.description && (
              <p className="text-white/80 text-sm mt-1">{item.description}</p>
            )}
          </div>
          {sizes.length <= 1 && (
            <p className="text-2xl font-bold text-white ml-4">{formatPrice(basePrice)}</p>
          )}
        </div>
      </motion.div>

      {/* ═══ CONTENT ═══ */}
      <div className={`${pastelBg} rounded-t-3xl -mt-4 relative z-10 pt-2`}>

        {/* SIZE PICKER */}
        {sizes.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.06 }}
            className="px-6 mt-6"
          >
            <p className="text-xs font-bold text-brand-text/50 uppercase tracking-wider mb-3">Размер</p>
            <div className="flex gap-3">
              {sizes.map(s => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSize(s)}
                  className={`flex-1 py-4 rounded-2xl text-center transition-all ${
                    size === s
                      ? `bg-gradient-to-br ${gradient} text-white shadow-lg`
                      : `bg-white text-brand-text border ${pastelBorder}`
                  }`}
                >
                  <span className="block text-xl font-semibold">{s}</span>
                  <span className="block text-sm mt-0.5">{formatPrice(item.prices[s] ?? 0)}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* MILK (single-select) */}
        {hasMilk && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.12 }}
            className="px-6 mt-6"
          >
            <p className="text-xs font-bold text-brand-text/50 uppercase tracking-wider mb-3">Молоко</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMilk(null)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  selectedMilk === null
                    ? `bg-gradient-to-br ${gradient} text-white shadow-md`
                    : `bg-white text-brand-text border ${pastelBorder}`
                }`}
              >
                Стандарт
              </button>
              {milkOptions.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMilk(selectedMilk === m.id ? null : m.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    selectedMilk === m.id
                      ? `bg-gradient-to-br ${gradient} text-white shadow-md`
                      : `bg-white text-brand-text border ${pastelBorder}`
                  }`}
                >
                  {m.name}
                  <span className="text-xs opacity-60 ml-1">+{formatPrice(m.price)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* SYRUPS (multi-select) */}
        {hasSyrup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.18 }}
            className="px-6 mt-6"
          >
            <p className="text-xs font-bold text-brand-text/50 uppercase tracking-wider mb-3">
              Сироп{syrupIsFree && <span className="ml-2 text-brand-mint normal-case font-medium">бесплатно ❄️</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {syrupOptions.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleSyrup(m.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    selectedSyrups.includes(m.id)
                      ? `bg-gradient-to-br ${gradient} text-white shadow-md`
                      : `bg-white text-brand-text border ${pastelBorder}`
                  }`}
                >
                  {m.name}
                  {!syrupIsFree && <span className="text-xs opacity-60 ml-1">+{formatPrice(m.price)}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ADDONS (multi-select) */}
        {hasAddon && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.24 }}
            className="px-6 mt-6"
          >
            <p className="text-xs font-bold text-brand-text/50 uppercase tracking-wider mb-3">Добавки</p>
            <div className="flex flex-wrap gap-2">
              {addonOptions.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleAddon(m.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    selectedAddons.includes(m.id)
                      ? `bg-gradient-to-br ${gradient} text-white shadow-md`
                      : `bg-white text-brand-text border ${pastelBorder}`
                  }`}
                >
                  {m.name}
                  <span className="text-xs opacity-60 ml-1">+{formatPrice(m.price)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══ STICKY FOOTER (поднят над BottomNav) ═══ */}
      <div className="fixed bottom-16 left-0 right-0 z-[60] bg-white border-t border-[#d0f0e0] px-6 py-3 pb-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="max-w-[480px] mx-auto flex items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-xs text-brand-text/40">Позиция</p>
            <p className="text-xl font-bold text-brand-dark">{formatPrice(totalPrice)}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            disabled={isStopped}
            className={`flex-1 py-3.5 text-white font-semibold rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${gradient}`}
          >
            {isStopped ? "Нет в наличии" : inCartCount > 0 ? `Ещё один · уже ${inCartCount} в корзине` : "Добавить в корзину"}
          </motion.button>
          {totalItems > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/order")}
              className="py-3.5 px-4 bg-brand-dark text-white font-semibold rounded-2xl text-base flex items-center gap-1.5"
            >
              <span>🛒</span>
              <span className="bg-brand-pink text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </motion.button>
          )}
        </div>
      </div>
    </main>
  );
}
