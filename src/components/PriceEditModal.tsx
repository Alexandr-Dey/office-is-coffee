"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import type { MenuItem, Size } from "@/lib/menu";
import {
  validatePrice, computePriceDelta, trimHistory,
  type PriceOverride, type PriceHistoryEntry,
} from "@/lib/menu.overrides";

interface Props {
  item: MenuItem;
  size: Size;
  currentPrice: number;          // эффективная цена (с учётом override)
  basePrice: number;             // из menu.ts (для показа "базовая")
  user: { uid: string; displayName: string; role: "barista" | "ceo" };
  override?: PriceOverride;      // текущий override документ если есть
  onClose: () => void;
}

export default function PriceEditModal({
  item, size, currentPrice, basePrice, user, override, onClose,
}: Props) {
  const { showToast } = useToast();
  const [input, setInput] = useState(String(currentPrice));
  const [saving, setSaving] = useState(false);
  const [confirmedWarn, setConfirmedWarn] = useState(false);

  const parsed = parseInt(input, 10);
  const validation = validatePrice(parsed);
  const delta = validation.ok ? computePriceDelta(currentPrice, parsed) : null;
  const changed = validation.ok && parsed !== currentPrice;
  const needsWarnConfirm = !!delta?.warn && !confirmedWarn;
  const canSave = changed && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    if (needsWarnConfirm) {
      setConfirmedWarn(true);
      return;
    }
    setSaving(true);
    try {
      const prevPrices: Record<string, number> = {};
      const nextPrices: Record<string, number> = {};
      prevPrices[size] = currentPrice;
      nextPrices[size] = parsed;

      const historyEntry: PriceHistoryEntry = {
        at: Timestamp.now(),
        by: user.uid,
        byName: user.displayName,
        byRole: user.role,
        oldPrices: prevPrices,
        newPrices: nextPrices,
      };

      const mergedHistory = trimHistory([
        ...(override?.priceHistory ?? []),
        historyEntry,
      ]);

      const mergedPrices = { ...(override?.prices ?? {}), [size]: parsed };

      await setDoc(
        doc(getFirebaseDb(), "menu_overrides", item.id),
        {
          prices: mergedPrices,
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
          updatedByName: user.displayName,
          updatedByRole: user.role,
          priceHistory: mergedHistory,
        },
        { merge: true },
      );

      showToast(`${item.name} ${size}: ${currentPrice}₸ → ${parsed}₸`, "success");
      onClose();
    } catch (e) {
      console.error("Save price error:", e);
      showToast("Не удалось сохранить цену");
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-8"
      >
        <h3 className="font-display text-xl font-bold text-brand-text">{item.name}</h3>
        <p className="text-xs text-brand-text/50 mb-4">Размер {size}</p>

        <div className="bg-brand-bg rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-brand-text/60">Сейчас</span>
          <span className="font-bold text-brand-text text-lg">{currentPrice}₸</span>
        </div>

        <label className="block text-xs font-bold text-brand-text/50 uppercase tracking-wider mb-2">
          Новая цена, ₸
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={input}
          onChange={(e) => { setInput(e.target.value); setConfirmedWarn(false); }}
          className="w-full px-4 py-3 rounded-xl border border-[#d0f0e0] focus:border-brand-mint focus:ring-1 focus:ring-brand-mint outline-none text-2xl font-bold mb-2"
          autoFocus
          min={100}
          max={5000}
          step={50}
        />

        {validation.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 text-sm text-red-700 font-medium">
            {validation.error}
          </div>
        )}

        {delta && changed && (
          <div className={`rounded-xl p-3 mb-3 text-sm ${
            delta.warn
              ? "bg-amber-50 border border-amber-300 text-amber-900"
              : "bg-brand-bg text-brand-text/70"
          }`}>
            {delta.warn && (
              <p className="font-bold mb-1">⚠️ Большое изменение — проверь опечатку</p>
            )}
            <p>
              {delta.abs > 0 ? "+" : ""}{delta.abs}₸
              <span className="ml-2 text-xs opacity-70">
                ({delta.pct > 0 ? "+" : ""}{(delta.pct * 100).toFixed(1)}%)
              </span>
            </p>
          </div>
        )}

        {needsWarnConfirm && (
          <div className="bg-amber-100 border border-amber-400 rounded-xl px-3 py-2 mb-3 text-sm text-amber-900 font-medium">
            Нажми «Подтвердить» ещё раз, чтобы применить.
          </div>
        )}

        {basePrice !== currentPrice && (
          <p className="text-xs text-brand-text/40 mb-3">
            Базовая цена в коде: {basePrice}₸
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 bg-gray-100 text-brand-text font-bold rounded-xl text-sm disabled:opacity-50 min-h-[48px]"
          >
            Отмена
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={!canSave}
            className={`flex-1 py-3 text-white font-bold rounded-xl text-sm disabled:opacity-40 min-h-[48px] ${
              needsWarnConfirm ? "bg-amber-500" : "bg-brand-dark"
            }`}
          >
            {saving ? "Сохраняю…" : needsWarnConfirm ? "Подтвердить" : "Сохранить"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
