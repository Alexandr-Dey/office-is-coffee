"use client";

import { useState } from "react";
import { useRequireCEO } from "@/lib/auth";
import {
  CATEGORIES, MENU_ITEMS, MODIFIERS, formatPrice,
  type MenuItem, type Size,
} from "@/lib/menu";
import {
  useMenuOverrides, getEffectivePrices,
  type PriceOverride,
} from "@/lib/menu.overrides";
import PriceEditModal from "@/components/PriceEditModal";
import PriceHistoryModal from "@/components/PriceHistoryModal";

interface EditState {
  item: MenuItem;
  size: Size;
  currentPrice: number;
  basePrice: number;
  override?: PriceOverride;
}

interface HistoryState {
  item: MenuItem;
  override: PriceOverride;
}

export default function CEOMenuPage() {
  const { user, loading } = useRequireCEO();
  const { overrides, loading: overridesLoading } = useMenuOverrides();
  const [search, setSearch] = useState("");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [historyState, setHistoryState] = useState<HistoryState | null>(null);

  if (loading || !user) {
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

  const overriddenCount = Object.keys(overrides).length;

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-40 bg-white border-b border-[#d0f0e0]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/ceo" className="text-brand-text/50 text-sm min-h-[44px] flex items-center">← CEO</a>
          <span className="font-display text-lg font-bold text-brand-text">Меню</span>
          <span className="text-xs text-brand-text/40">{MENU_ITEMS.length} позиций</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-xs text-amber-900">
          💡 Тап на цену → редактирование. Изменения видят все клиенты сразу.
          {overriddenCount > 0 && (
            <> <span className="font-bold">Изменено вручную: {overriddenCount}</span></>
          )}
        </div>

        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm mb-4 min-h-[44px]"
        />

        {overridesLoading ? (
          <p className="text-center text-brand-text/40 py-4 text-sm">Загрузка…</p>
        ) : (
          grouped.map(({ cat, items }) => (
            <div key={cat.id} className="mb-6">
              <h3 className="font-bold text-brand-text text-sm mb-2">
                {cat.name} <span className="text-brand-text/30 font-normal">({items.length})</span>
              </h3>
              <div className="space-y-2">
                {items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    override={overrides[item.id]}
                    onEditPrice={(size, currentPrice, basePrice) => setEditState({
                      item, size, currentPrice, basePrice, override: overrides[item.id],
                    })}
                    onShowHistory={(override) => setHistoryState({ item, override })}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {grouped.length === 0 && !overridesLoading && (
          <p className="text-center text-brand-text/40 py-4">Ничего не найдено</p>
        )}

        <div className="mt-8 mb-6">
          <h3 className="font-bold text-brand-text text-sm mb-2">
            Модификаторы (не редактируются) <span className="text-brand-text/30 font-normal">({MODIFIERS.length})</span>
          </h3>
          {(['milk', 'syrup', 'honey'] as const).map(group => {
            const mods = MODIFIERS.filter(m => m.group === group);
            const label = group === 'milk' ? 'Молоко' : group === 'syrup' ? 'Сиропы' : 'Мёд';
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

      {editState && (
        <PriceEditModal
          item={editState.item}
          size={editState.size}
          currentPrice={editState.currentPrice}
          basePrice={editState.basePrice}
          override={editState.override}
          user={{ uid: user.uid, displayName: user.displayName, role: "ceo" }}
          onClose={() => setEditState(null)}
        />
      )}

      {historyState && (
        <PriceHistoryModal
          item={historyState.item}
          override={historyState.override}
          user={{ uid: user.uid, displayName: user.displayName, role: "ceo" }}
          onClose={() => setHistoryState(null)}
        />
      )}
    </main>
  );
}

function ItemRow({ item, override, onEditPrice, onShowHistory }: {
  item: MenuItem;
  override?: PriceOverride;
  onEditPrice: (size: Size, currentPrice: number, basePrice: number) => void;
  onShowHistory: (override: PriceOverride) => void;
}) {
  const effectivePrices = getEffectivePrices(item, override ? { [item.id]: override } : {});

  return (
    <div className="bg-white rounded-xl border border-[#d0f0e0] px-3 py-2.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-brand-text">{item.name}</span>
            {item.countsForLoyalty && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-mint/10 text-brand-dark">Лояльность</span>
            )}
            {override && (
              <button
                onClick={() => onShowHistory(override)}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 font-bold"
                title={`Изменено: ${override.updatedByName}`}
              >
                ✏️ изменено
              </button>
            )}
          </div>
          {item.composition && <p className="text-xs text-brand-text/40 truncate mt-0.5">{item.composition}</p>}
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(["S", "M", "L"] as Size[]).map(s => {
          const price = effectivePrices[s];
          if (price === undefined) return null;
          const basePrice = item.prices[s] ?? price;
          const isOverridden = override?.prices?.[s] !== undefined;
          return (
            <button
              key={s}
              onClick={() => onEditPrice(s, price, basePrice)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold min-h-[36px] flex items-center gap-1 transition-colors ${
                isOverridden
                  ? "bg-amber-50 border border-amber-300 text-amber-900"
                  : "bg-brand-bg border border-[#d0f0e0] text-brand-text hover:bg-brand-mint/10"
              }`}
            >
              <span className="text-[10px] opacity-60">{s}</span>
              <span>{formatPrice(price)}</span>
              {isOverridden && <span className="text-[10px]">✏️</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
