"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { MenuItem } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { id: "classic-coffee", name: "Кофейная классика" },
  { id: "author-coffee", name: "Авторский кофе" },
  { id: "ice-coffee", name: "Айс кофе" },
  { id: "cocoa", name: "Какао и горячий шоколад" },
  { id: "home-tea", name: "Домашний чай" },
  { id: "author-tea", name: "Авторский чай" },
  { id: "matcha", name: "Матча" },
  { id: "ice-tea", name: "Айс ти" },
  { id: "milkshakes", name: "Молочные коктейли" },
  { id: "fresh-juices", name: "Свежевыжатые соки" },
  { id: "fresh-smoothies", name: "Смузи на фреше" },
  { id: "milk-smoothies", name: "Смузи на молоке" },
  { id: "lemonades", name: "Лимонады" },
];

interface Props {
  item: MenuItem | null;
  onSave: (data: Partial<MenuItem> & { id: string }) => Promise<void>;
  onClose: () => void;
}

export default function MenuItemEditor({ item, onSave, onClose }: Props) {
  const [name, setName] = useState(item?.name ?? "");
  const [id, setId] = useState(item?.id ?? "");
  const [category, setCategory] = useState(item?.category ?? "classic-coffee");
  const [ingredients, setIngredients] = useState(item?.ingredients ?? "");
  const [sizeS, setSizeS] = useState<string>(item?.sizes.S?.toString() ?? "");
  const [sizeM, setSizeM] = useState<string>(item?.sizes.M?.toString() ?? "");
  const [sizeL, setSizeL] = useState<string>(item?.sizes.L?.toString() ?? "");
  const [availableMilk, setAvailableMilk] = useState(item?.availableMilk ?? false);
  const [tagHit, setTagHit] = useState(item?.tags.includes("hit") ?? false);
  const [tagNew, setTagNew] = useState(item?.tags.includes("new") ?? false);
  const [tagSeason, setTagSeason] = useState(item?.tags.includes("season") ?? false);
  const [activeFrom, setActiveFrom] = useState(item?.activeFrom ?? "");
  const [activeTo, setActiveTo] = useState(item?.activeTo ?? "");
  const [sortOrder, setSortOrder] = useState(item?.sortOrder?.toString() ?? "100");
  const [saving, setSaving] = useState(false);

  const isNew = !item;

  useEffect(() => {
    if (isNew && name) {
      setId(name.toLowerCase().replace(/[^a-zа-яёА-ЯЁ0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }, [name, isNew]);

  const handleSave = async () => {
    if (!name.trim() || !id.trim()) return;
    setSaving(true);
    const sizes: Record<string, number> = {};
    if (sizeS) sizes.S = parseInt(sizeS);
    if (sizeM) sizes.M = parseInt(sizeM);
    if (sizeL) sizes.L = parseInt(sizeL);

    const tags: string[] = [];
    if (tagHit) tags.push("hit");
    if (tagNew) tags.push("new");
    if (tagSeason) tags.push("season");

    await onSave({
      id,
      name: name.trim(),
      category,
      ingredients: ingredients.trim() || null,
      sizes,
      availableMilk,
      tags,
      activeFrom: activeFrom || null,
      activeTo: activeTo || null,
      sortOrder: parseInt(sortOrder) || 100,
    });
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-brand-text mb-4">
          {isNew ? "Новая позиция" : `Редактировать: ${item.name}`}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text/70 mb-1">Название</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm" />
          </div>

          {isNew && (
            <div>
              <label className="block text-sm font-medium text-brand-text/70 mb-1">ID (slug)</label>
              <input type="text" value={id} onChange={e => setId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm font-mono" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-text/70 mb-1">Категория</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm bg-white">
              {CATEGORY_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text/70 mb-1">Ингредиенты</label>
            <input type="text" value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="апельсин, лимон, мята"
              className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text/70 mb-1">{"Цены (оставь пустым если размер недоступен)"}</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-xs text-brand-text/50">S</span>
                <input type="number" value={sizeS} onChange={e => setSizeS(e.target.value)} placeholder="—"
                  className="w-full px-3 py-2 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm" />
              </div>
              <div>
                <span className="text-xs text-brand-text/50">M</span>
                <input type="number" value={sizeM} onChange={e => setSizeM(e.target.value)} placeholder="—"
                  className="w-full px-3 py-2 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm" />
              </div>
              <div>
                <span className="text-xs text-brand-text/50">L</span>
                <input type="number" value={sizeL} onChange={e => setSizeL(e.target.value)} placeholder="—"
                  className="w-full px-3 py-2 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={availableMilk} onChange={e => setAvailableMilk(e.target.checked)}
                className="w-4 h-4 accent-brand-dark" />
              <span className="text-sm text-brand-text">Молоко доступно</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text/70 mb-1">Теги</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={tagHit} onChange={e => setTagHit(e.target.checked)} className="w-4 h-4 accent-brand-pink" />
                <span className="text-sm text-brand-pink font-medium">{"Хит"}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={tagNew} onChange={e => setTagNew(e.target.checked)} className="w-4 h-4 accent-brand-mint" />
                <span className="text-sm text-brand-dark font-medium">NEW</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={tagSeason} onChange={e => setTagSeason(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-orange-600 font-medium">{"Сезон"}</span>
              </label>
            </div>
          </div>

          {tagSeason && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-brand-text/50 mb-1">{"Доступен с (MM-DD)"}</label>
                <input type="text" value={activeFrom} onChange={e => setActiveFrom(e.target.value)} placeholder="09-01"
                  className="w-full px-3 py-2 rounded-xl border border-[#d0f0e0] outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs text-brand-text/50 mb-1">{"Доступен до (MM-DD)"}</label>
                <input type="text" value={activeTo} onChange={e => setActiveTo(e.target.value)} placeholder="11-30"
                  className="w-full px-3 py-2 rounded-xl border border-[#d0f0e0] outline-none text-sm" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-text/70 mb-1">Порядок сортировки</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#d0f0e0] focus:border-brand-mint outline-none text-sm" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-[#d0f0e0] text-brand-text font-semibold">
            Отмена
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 py-3 rounded-2xl bg-brand-dark text-white font-bold disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
