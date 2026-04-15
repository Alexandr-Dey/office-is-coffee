"use client";

import { useState } from "react";
import { useRequireCEO } from "@/lib/auth";
import {
  CATEGORIES, MENU_ITEMS, MODIFIERS, formatPrice,
  type MenuItem, type CategoryId,
} from "@/lib/menu";

export default function CEOMenuPage() {
  const { loading } = useRequireCEO();
  const [search, setSearch] = useState("");

  if (loading) {
    return <main className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
    </main>;
  }

  const filtered = search.trim().length >= 2
    ? MENU_ITEMS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : MENU_ITEMS;

  const grouped = CATEGORIES.map(cat => ({
    cat,
    items: filtered.filter(i => i.category === cat.id),
  })).filter(g => g.items.length > 0);

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-40 bg-white border-b border-[#d0f0e0]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/ceo" className="text-brand-text/50 text-sm">← CEO</a>
          <span className="font-display text-lg font-bold text-brand-text">Меню</span>
          <span className="text-xs text-brand-text/40">{MENU_ITEMS.length} позиций</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm mb-4"
        />

        {grouped.map(({ cat, items }) => (
          <div key={cat.id} className="mb-6">
            <h3 className="font-bold text-brand-text text-sm mb-2">
              {cat.name} <span className="text-brand-text/30 font-normal">({items.length})</span>
            </h3>
            <div className="space-y-2">
              {items.map(item => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}

        {grouped.length === 0 && <p className="text-center text-brand-text/40 py-4">Ничего не найдено</p>}

        <div className="mt-8 mb-6">
          <h3 className="font-bold text-brand-text text-sm mb-2">
            Модификаторы <span className="text-brand-text/30 font-normal">({MODIFIERS.length})</span>
          </h3>
          {(['milk', 'syrup', 'addon'] as const).map(group => {
            const mods = MODIFIERS.filter(m => m.group === group);
            const label = group === 'milk' ? 'Молоко' : group === 'syrup' ? 'Сиропы' : 'Добавки';
            return (
              <div key={group} className="mb-3">
                <p className="text-xs font-bold text-brand-text/50 uppercase mb-1">{label}</p>
                {mods.map(m => (
                  <div key={m.id} className="flex justify-between bg-white rounded-xl px-4 py-2 border border-[#d0f0e0] mb-1">
                    <span className="text-sm text-brand-text">{m.name}</span>
                    <span className="text-sm text-brand-text/50">{formatPrice(m.price)}</span>
                  </div>
                ))}
              </div>
            );
          })}
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

  return (
    <div className="bg-white rounded-xl border border-[#d0f0e0] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-brand-text">{item.name}</span>
        {item.countsForLoyalty && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-mint/10 text-brand-dark">Лояльность</span>}
      </div>
      {item.description && <p className="text-xs text-brand-text/40">{item.description}</p>}
      <p className="text-xs text-brand-dark mt-1">{prices}</p>
    </div>
  );
}
