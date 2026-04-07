"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRequireCEO } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
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

export default function CEOMenuPage() {
  const { user, loading } = useRequireCEO();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(getFirebaseDb(), "menu_items"), orderBy("sortOrder", "asc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    });
  }, []);

  const handleSave = async (data: Partial<MenuItem> & { id: string }) => {
    const { id, ...rest } = data;
    await setDoc(doc(getFirebaseDb(), "menu_items", id), {
      ...rest,
      id,
      updatedAt: serverTimestamp(),
    }, { merge: true });
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

  // Group items by category
  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const filtered = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search.toLowerCase()))
    : null;

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-40 bg-white border-b border-[#d0f0e0]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/ceo" className="text-brand-text/50 text-sm">{"\u2190 CEO"}</a>
          <span className="font-display text-lg font-bold text-brand-text">{"Управление меню"}</span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingItem(null); setShowEditor(true); }}
            className="bg-brand-dark text-white px-3 py-1.5 rounded-full text-sm font-bold"
          >
            {"+ Добавить"}
          </motion.button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm mb-4"
        />

        <p className="text-xs text-brand-text/40 mb-4">{"Всего позиций: "}{items.length}</p>

        {filtered ? (
          <div className="space-y-2">
            {filtered.map(item => (
              <ItemRow key={item.id} item={item} onEdit={() => { setEditingItem(item); setShowEditor(true); }} onDelete={() => handleDelete(item.id)} />
            ))}
            {filtered.length === 0 && <p className="text-center text-brand-text/40 py-4">{"Ничего не найдено"}</p>}
          </div>
        ) : (
          Object.entries(grouped).map(([catId, catItems]) => (
            <div key={catId} className="mb-6">
              <h3 className="font-bold text-brand-text text-sm mb-2">
                {CATEGORY_NAMES[catId] ?? catId} <span className="text-brand-text/30 font-normal">({catItems.length})</span>
              </h3>
              <div className="space-y-2">
                {catItems.map(item => (
                  <ItemRow key={item.id} item={item} onEdit={() => { setEditingItem(item); setShowEditor(true); }} onDelete={() => handleDelete(item.id)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showEditor && (
          <MenuItemEditor
            item={editingItem}
            onSave={handleSave}
            onClose={() => setShowEditor(false)}
          />
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
          {item.tags.includes("hit") && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-pink/10 text-brand-pink">{"Хит"}</span>}
          {item.tags.includes("season") && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-600">{"Сезон"}</span>}
        </div>
        <p className="text-xs text-brand-text/40">
          {"от "}{minPrice}{"\u20B8"} · {Object.keys(item.sizes).join("/")}
          {item.availableMilk && " · молоко"}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-3">
        <button onClick={onEdit} className="text-brand-dark text-xs font-semibold px-2 py-1 rounded-lg hover:bg-brand-bg">
          {"Ред."}
        </button>
        <button onClick={onDelete} className="text-red-400 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50">
          {"\u2715"}
        </button>
      </div>
    </div>
  );
}
