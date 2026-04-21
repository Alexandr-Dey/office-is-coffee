"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { doc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import type { MenuItem, Size } from "@/lib/menu";
import {
  trimHistory,
  type PriceOverride, type PriceHistoryEntry, type PriceMap,
} from "@/lib/menu.overrides";

interface Props {
  item: MenuItem;
  override: PriceOverride;
  user: { uid: string; displayName: string; role: "barista" | "ceo" };
  onClose: () => void;
}

function formatTs(ts: Timestamp): string {
  const d = ts.toDate();
  return d.toLocaleString("ru", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function renderPrices(p: PriceMap): string {
  return (["S", "M", "L"] as Size[])
    .filter((s) => p[s] !== undefined)
    .map((s) => `${s}: ${p[s]}₸`)
    .join(", ");
}

export default function PriceHistoryModal({ item, override, user, onClose }: Props) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const entries = [...override.priceHistory].reverse();

  const handleUndoLast = async () => {
    if (busy) return;
    const last = override.priceHistory[override.priceHistory.length - 1];
    if (!last) return;

    setBusy(true);
    try {
      // Пишем обратную запись в историю, чтобы audit оставался полным
      const undoEntry: PriceHistoryEntry = {
        at: Timestamp.now(),
        by: user.uid,
        byName: user.displayName,
        byRole: user.role,
        oldPrices: last.newPrices,
        newPrices: last.oldPrices,
      };
      // Сливаем: применяем old из последней записи поверх override
      const reverted: PriceMap = { ...override.prices, ...last.oldPrices };

      await setDoc(
        doc(getFirebaseDb(), "menu_overrides", item.id),
        {
          prices: reverted,
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
          updatedByName: user.displayName,
          updatedByRole: user.role,
          priceHistory: trimHistory([...override.priceHistory, undoEntry]),
        },
        { merge: true },
      );
      showToast("Цена откачена", "success");
      onClose();
    } catch (e) {
      console.error("Undo error:", e);
      showToast("Не удалось откатить");
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (busy) return;
    if (!confirm(`Сбросить все цены «${item.name}» до базовых?`)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(getFirebaseDb(), "menu_overrides", item.id));
      showToast("Сброшено до базовых цен", "success");
      onClose();
    } catch (e) {
      console.error("Reset error:", e);
      showToast("Не удалось сбросить");
      setBusy(false);
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
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
      >
        <h3 className="font-display text-lg font-bold text-brand-text mb-1">
          История цен
        </h3>
        <p className="text-sm text-brand-text/60 mb-4">{item.name}</p>

        <div className="bg-brand-bg rounded-xl p-3 mb-4 text-xs text-brand-text/70">
          <p>Последнее изменение: <span className="font-bold text-brand-text">{override.updatedByName}</span> ({override.updatedByRole})</p>
          <p>{formatTs(override.updatedAt)}</p>
        </div>

        <div className="space-y-2 mb-4">
          {entries.length === 0 && (
            <p className="text-sm text-brand-text/40 text-center py-4">Нет записей</p>
          )}
          {entries.map((e, i) => (
            <div key={i} className="border border-[#d0f0e0] rounded-xl px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-brand-text">{e.byName}</span>
                <span className="text-[10px] text-brand-text/40">{formatTs(e.at)}</span>
              </div>
              <p className="text-xs text-brand-text/60">
                <span className="line-through">{renderPrices(e.oldPrices)}</span>
                {" → "}
                <span className="font-bold text-brand-text">{renderPrices(e.newPrices)}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {entries.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleUndoLast}
              disabled={busy}
              className="w-full py-3 bg-amber-100 text-amber-900 font-bold rounded-xl text-sm disabled:opacity-50 min-h-[48px]"
            >
              ↶ Откатить последнее изменение
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleReset}
            disabled={busy}
            className="w-full py-3 bg-red-50 text-red-700 border border-red-200 font-bold rounded-xl text-sm disabled:opacity-50 min-h-[48px]"
          >
            Сбросить до базовых цен
          </motion.button>
          <button
            onClick={onClose}
            disabled={busy}
            className="w-full py-3 bg-gray-100 text-brand-text font-bold rounded-xl text-sm disabled:opacity-50 min-h-[48px]"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
