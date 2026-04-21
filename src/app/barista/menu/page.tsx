"use client";

import { useState } from "react";
import { useRequireBarista } from "@/lib/auth";
import {
  CATEGORIES, MENU_ITEMS, MODIFIERS, formatPrice,
  type MenuItem, type CategoryId,
} from "@/lib/menu";

export default function BaristaMenuPage() {
  const { loading } = useRequireBarista();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<CategoryId | null>(null);

  if (loading) {
    return <main className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
    </main>;
  }

  const filtered = search.trim().length >= 2
    ? MENU_ITEMS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : activeCat
      ? MENU_ITEMS.filter(i => i.category === activeCat)
      : MENU_ITEMS;

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-[#d0f0e0]">
        <div className="max-w-[480px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <a href="/admin" className="text-brand-text/50 text-sm">← Заказы</a>
            <h1 className="font-display text-lg font-bold text-brand-text">📝 Меню</h1>
            <span className="text-xs text-brand-text/40">{MENU_ITEMS.length} позиций</span>
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm min-h-[44px]" />
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-4 py-4">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
          <button onClick={() => setActiveCat(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              !activeCat ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-text border border-[#d0f0e0]"
            }`}>Все</button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                activeCat === c.id ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-text border border-[#d0f0e0]"
              }`}>{c.name}</button>
          ))}
        </div>

        {/* Items list */}
        <div className="space-y-2">
          {filtered.map(item => (
            <ItemRow key={item.id} item={item} />
          ))}
          {filtered.length === 0 && <p className="text-center text-brand-text/40 py-4">Ничего не найдено</p>}
        </div>

        {/* Modifiers reference */}
        <div className="mt-8">
          <h3 className="font-bold text-brand-text text-sm mb-2">Модификаторы</h3>
          <div className="space-y-1">
            {MODIFIERS.map(m => (
              <div key={m.id} className="flex justify-between bg-white rounded-xl px-4 py-2 border border-[#d0f0e0]">
                <span className="text-sm text-brand-text">{m.name}</span>
                <span className="text-sm text-brand-text/50">{formatPrice(m.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function ItemRow({ item }: { item: MenuItem }) {
  const prices = Object.entries(item.prices)
    .filter((e): e is [string, number] => e[1] !== undefined)
    .map(([s, p]) => `${s}: ${formatPrice(p)}`)
    .join(" · ");

  const cat = CATEGORIES.find(c => c.id === item.category);

  return (
    <div className="bg-white rounded-xl border border-[#d0f0e0] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-brand-text">{item.name}</span>
          {item.composition && <p className="text-xs text-brand-text/40 truncate">{item.composition}</p>}
        </div>
        <span className="text-xs text-brand-text/40 ml-2">{cat?.name}</span>
      </div>
      <p className="text-xs text-brand-dark mt-1">{prices}</p>
    </div>
  );
}
