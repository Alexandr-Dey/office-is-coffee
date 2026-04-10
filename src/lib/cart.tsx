"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem } from "./types";

interface CartContextValue {
  cart: CartItem[];
  addItem: (name: string, size: string, price: number, milk?: string, syrup?: string) => void;
  removeItem: (name: string, size: string, milk?: string, syrup?: string) => void;
  updateQty: (index: number, delta: number) => void;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "oic_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  if (cart.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Also keep sessionStorage for backward compat with order page
  if (cart.length > 0) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setCart(loadCart());
    setLoaded(true);
  }, []);

  // Save to localStorage on change (skip initial empty state)
  useEffect(() => {
    if (loaded) saveCart(cart);
  }, [cart, loaded]);

  const addItem = useCallback((name: string, size: string, price: number, milk?: string, syrup?: string) => {
    setCart((prev) => {
      const key = `${name}_${size}_${milk ?? ""}_${syrup ?? ""}`;
      const ex = prev.find((i) => `${i.name}_${i.size}_${i.milk ?? ""}_${i.syrup ?? ""}` === key);
      if (ex) return prev.map((i) => `${i.name}_${i.size}_${i.milk ?? ""}_${i.syrup ?? ""}` === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { name, size, price, qty: 1, milk, syrup }];
    });
  }, []);

  const removeItem = useCallback((name: string, size: string, milk?: string, syrup?: string) => {
    setCart((prev) => prev.filter((i) => !(i.name === name && i.size === size && (i.milk ?? "") === (milk ?? "") && (i.syrup ?? "") === (syrup ?? ""))));
  }, []);

  const updateQty = useCallback((index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      const newQty = next[index].qty + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== index);
      next[index] = { ...next[index], qty: newQty };
      return next;
    });
  }, []);

  const setItems = useCallback((items: CartItem[]) => {
    setCart(items);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    // Clear storage immediately (don't wait for effect)
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQty, setItems, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
