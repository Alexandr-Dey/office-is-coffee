"use client";

// ═══ MENU PRICE OVERRIDES ═══
// Firestore-слой поверх хардкода MENU_ITEMS. Хранит только изменённые цены.
// Бариста/CEO редактируют через UI на /barista/menu и /ceo/menu.
// Клиенты не видят маркер «изменено» — только актуальная цена.

import {
  createContext, useContext, useEffect, useState, useMemo, type ReactNode,
} from "react";
import {
  collection, onSnapshot, Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import type { MenuItem, Size } from "./menu";

export type PriceMap = Partial<Record<Size, number>>;

export interface PriceHistoryEntry {
  at: Timestamp;
  by: string;
  byName: string;
  byRole: "barista" | "ceo";
  oldPrices: PriceMap;
  newPrices: PriceMap;
}

export interface PriceOverride {
  prices: PriceMap;
  updatedAt: Timestamp;
  updatedBy: string;
  updatedByName: string;
  updatedByRole: "barista" | "ceo";
  priceHistory: PriceHistoryEntry[];
}

interface MenuOverridesContextValue {
  overrides: Record<string, PriceOverride>;
  loading: boolean;
}

const MenuOverridesContext = createContext<MenuOverridesContextValue>({
  overrides: {},
  loading: true,
});

export function MenuOverridesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, PriceOverride>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(getFirebaseDb(), "menu_overrides"),
      (snap) => {
        const map: Record<string, PriceOverride> = {};
        snap.forEach((d) => {
          map[d.id] = d.data() as PriceOverride;
        });
        setOverrides(map);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  const value = useMemo(() => ({ overrides, loading }), [overrides, loading]);
  return (
    <MenuOverridesContext.Provider value={value}>
      {children}
    </MenuOverridesContext.Provider>
  );
}

export function useMenuOverrides() {
  return useContext(MenuOverridesContext);
}

// ═══ PURE HELPERS ═══

export function getEffectivePrices(
  item: MenuItem,
  overrides: Record<string, PriceOverride>,
): PriceMap {
  const o = overrides[item.id];
  if (!o || !o.prices) return item.prices;
  return { ...item.prices, ...o.prices };
}

export function useEffectivePrices(item: MenuItem): PriceMap {
  const { overrides } = useMenuOverrides();
  return getEffectivePrices(item, overrides);
}

export function useEffectiveMinPrice(item: MenuItem): number {
  const prices = useEffectivePrices(item);
  const vals = Object.values(prices).filter((p): p is number => p !== undefined);
  return vals.length > 0 ? Math.min(...vals) : 0;
}

// ═══ VALIDATION & GUARDS ═══

export const PRICE_MIN = 100;
export const PRICE_MAX = 5000;
export const PRICE_DELTA_WARN = 0.30; // 30%
export const PRICE_HISTORY_MAX = 20;

export function validatePrice(raw: number): { ok: boolean; error?: string } {
  if (!Number.isFinite(raw) || raw <= 0) return { ok: false, error: "Введи число больше 0" };
  if (!Number.isInteger(raw)) return { ok: false, error: "Цена должна быть целым числом" };
  if (raw < PRICE_MIN) return { ok: false, error: `Меньше ${PRICE_MIN}₸ — проверь опечатку (например, лишнюю цифру не ввёл)` };
  if (raw > PRICE_MAX) return { ok: false, error: `Больше ${PRICE_MAX}₸ — проверь опечатку (возможно, лишний 0)` };
  return { ok: true };
}

export function computePriceDelta(oldPrice: number, newPrice: number): {
  abs: number;
  pct: number;
  warn: boolean;
} {
  const abs = newPrice - oldPrice;
  const pct = oldPrice === 0 ? 0 : abs / oldPrice;
  return { abs, pct, warn: Math.abs(pct) > PRICE_DELTA_WARN };
}

export function trimHistory(history: PriceHistoryEntry[]): PriceHistoryEntry[] {
  if (history.length <= PRICE_HISTORY_MAX) return history;
  return history.slice(-PRICE_HISTORY_MAX);
}
