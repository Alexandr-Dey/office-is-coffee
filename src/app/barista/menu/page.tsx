"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRequireBarista } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import MenuItemEditor from "@/components/MenuItemEditor";
import type { MenuItem } from "@/lib/types";

const CATEGORY_NAMES: Record<string, string> = {
  "classic-coffee": "Кофейная классика",
  "author-coffee": "Авторский кофе",
  "ice-coffee": "Айс кофе",
  "cocoa": "Какао и горячий шоколад",
  "home-tea": "Домашний чай",
  "author-tea": "Авторский чай",
  "matcha": "Матча",
  "ice-tea": "Айс ти",
  "milkshakes": "Молочные коктейли",
  "fresh-juices": "Свежевыжатые соки",
  "fresh-smoothies": "Смузи на фреше",
  "milk-smoothies": "Смузи на молоке",
  "lemonades": "Лимонады",
};

export default function BaristaMenuPage() {
  const { user, loading } = useRequireBarista();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [stopList, setStopList] = useState<string[]>([]);
  const [tab, setTab] = useState<"stoplist" | "popular" | "menu">("stoplist");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(getFirebaseDb(), "menu_items"), orderBy("sortOrder", "asc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    });
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) setStopList(snap.data().stopList ?? []);
    }, () => {});
    return () => unsub();
  }, []);

  const toggleFeatured = async (itemId: string, current: boolean) => {
    await setDoc(doc(getFirebaseDb(), "menu_items", itemId), { featured: !current }, { merge: true }).catch(() => {});
  };

  const toggleStop = async (name: string) => {
    const newList = stopList.includes(name) ? stopList.filter(s => s !== name) : [...stopList, name];
    setStopList(newList);
    await setDoc(doc(getFirebaseDb(), "cafe_status", "aksay_main"), { stopList: newList }, { merge: true }).catch(() => {});
  };

  const handleSave = async (data: Partial<MenuItem> & { id: string }) => {
    const { id, ...rest } = data;
    await setDoc(doc(getFirebaseDb(), "menu_items", id), { ...rest, id, updatedAt: serverTimestamp() }, { merge: true });
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm(`Удалить "${items.find(i => i.id === itemId)?.name}"?`)) return;
    await deleteDoc(doc(getFirebaseDb(), "menu_items", itemId));
  };

  if (loading) {
    return <main className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
    </main>;
  }

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const filtered = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#d0f0e0]">
        <div className="max-w-[480px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-lg font-bold text-brand-text">📝 Меню</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-text/40">{items.length} позиций</span>
              {stopList.length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  🛑 {stopList.length}
                </span>
              )}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-2">
            <button onClick={() => setTab("stoplist")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[44px] transition-all ${
                tab === "stoplist" ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-text"
              }`}>
              🛑 Стоп
            </button>
            <button onClick={() => setTab("popular")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[44px] transition-all ${
                tab === "popular" ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-text"
              }`}>
              🔥 Популярное
            </button>
            <button onClick={() => setTab("menu")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[44px] transition-all ${
                tab === "menu" ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-text"
              }`}>
              📋 Все
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-4 py-4">
        {tab === "stoplist" && (
          <>
            {/* Milk alternatives section */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-brand-text/60 uppercase tracking-wider mb-2">🥛 Альтернативное молоко</h3>
              <div className="space-y-2">
                {["Овсяное молоко", "Кокосовое молоко", "Миндальное молоко"].map((milk) => {
                  const stopped = stopList.includes(milk);
                  return (
                    <div key={milk} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#d0f0e0]">
                      <span className={`text-sm font-medium ${stopped ? "text-red-400 line-through" : "text-brand-text"}`}>
                        {milk}
                      </span>
                      <button onClick={() => toggleStop(milk)}
                        className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${stopped ? "bg-red-400" : "bg-brand-mint"}`}>
                        <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${stopped ? "" : "translate-x-5"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Menu items section */}
            <h3 className="text-xs font-bold text-brand-text/60 uppercase tracking-wider mb-2">☕ Напитки</h3>
            <div className="space-y-2">
              {items.map((item) => {
                const stopped = stopList.includes(item.name) || stopList.includes(item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#d0f0e0]">
                    <span className={`text-sm font-medium ${stopped ? "text-red-400 line-through" : "text-brand-text"}`}>
                      {item.name}
                    </span>
                    <button onClick={() => toggleStop(item.name)}
                      className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${stopped ? "bg-red-400" : "bg-brand-mint"}`}>
                      <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${stopped ? "" : "translate-x-5"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "popular" && (
          <>
            <p className="text-xs text-brand-text/50 mb-3">Выбери напитки для блока «Популярное» на главной</p>
            <div className="space-y-2">
              {items.map((item) => {
                const isFeatured = !!(item as MenuItem & { featured?: boolean }).featured;
                return (
                  <div key={item.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#d0f0e0]">
                    <div className="flex items-center gap-2">
                      {isFeatured && <span className="text-xs">🔥</span>}
                      <span className={`text-sm font-medium ${isFeatured ? "text-brand-dark" : "text-brand-text/60"}`}>{item.name}</span>
                    </div>
                    <button onClick={() => toggleFeatured(item.id, isFeatured)}
                      className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${isFeatured ? "bg-orange-400" : "bg-gray-200"}`}>
                      <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${isFeatured ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "menu" && (
          <>
            <div className="flex gap-2 mb-4">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm min-h-[44px]" />
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { setEditingItem(null); setShowEditor(true); }}
                className="bg-brand-dark text-white px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px]">
                + Добавить
              </motion.button>
            </div>

            {filtered ? (
              <div className="space-y-2">
                {filtered.map(item => (
                  <ItemRow key={item.id} item={item}
                    onEdit={() => { setEditingItem(item); setShowEditor(true); }}
                    onDelete={() => handleDelete(item.id)} />
                ))}
                {filtered.length === 0 && <p className="text-center text-brand-text/40 py-4">Ничего не найдено</p>}
              </div>
            ) : (
              Object.entries(grouped).map(([catId, catItems]) => (
                <div key={catId} className="mb-6">
                  <h3 className="font-bold text-brand-text text-sm mb-2">
                    {CATEGORY_NAMES[catId] ?? catId} <span className="text-brand-text/30 font-normal">({catItems.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {catItems.map(item => (
                      <ItemRow key={item.id} item={item}
                        onEdit={() => { setEditingItem(item); setShowEditor(true); }}
                        onDelete={() => handleDelete(item.id)} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showEditor && (
          <MenuItemEditor item={editingItem} onSave={handleSave} onClose={() => setShowEditor(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function ItemRow({ item, onEdit, onDelete }: { item: MenuItem; onEdit: () => void; onDelete: () => void }) {
  const minPrice = Math.min(...Object.values(item.sizes));
  return (
    <div className="bg-white rounded-xl border border-[#d0f0e0] px-4 py-3 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-brand-text truncate">{item.name}</span>
          {item.tags.includes("hit") && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-pink/10 text-brand-pink">Хит</span>}
          {item.tags.includes("season") && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-600">Сезон</span>}
        </div>
        <p className="text-xs text-brand-text/40">
          от {minPrice}₸ · {Object.keys(item.sizes).join("/")}
          {item.availableMilk && " · молоко"}
        </p>
      </div>
      <div className="flex items-center gap-1 ml-3">
        <button onClick={onEdit} className="text-brand-dark text-xs font-semibold px-3 py-2 rounded-lg hover:bg-brand-bg min-h-[44px]">
          Ред.
        </button>
        <button onClick={onDelete} className="text-red-400 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-50 min-h-[44px]">
          ✕
        </button>
      </div>
    </div>
  );
}
