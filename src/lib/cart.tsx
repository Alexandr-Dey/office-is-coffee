"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem } from "./types";
import { makeCartKey, type Size } from "./menu";

interface CartContextValue {
  cart: CartItem[];
  addCartItem: (item: Omit<CartItem, 'qty' | 'cartKey'> & { qty?: number }) => void;
  removeCartItem: (cartKey: string) => void;
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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((i: Record<string, unknown>) =>
      typeof i.name === "string" &&
      typeof i.totalPrice === "number" &&
      typeof i.qty === "number" &&
      i.qty > 0
    );
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  if (cart.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return loadCart();
  });
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    if (!loaded) {
      setCart(loadCart());
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded) saveCart(cart);
  }, [cart, loaded]);

  const addCartItem = useCallback((item: Omit<CartItem, 'qty' | 'cartKey'> & { qty?: number }) => {
    const modifierIds = item.modifiers.map(m => m.id);
    const cartKey = makeCartKey(item.itemId, item.size as Size, modifierIds);
    setCart((prev) => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        return prev.map(i => i.cartKey === cartKey ? { ...i, qty: i.qty + (item.qty ?? 1) } : i);
      }
      return [...prev, { ...item, qty: item.qty ?? 1, cartKey }];
    });
  }, []);

  const removeCartItem = useCallback((cartKey: string) => {
    setCart((prev) => prev.filter(i => i.cartKey !== cartKey));
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
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.totalPrice * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addCartItem, removeCartItem, updateQty, setItems, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
