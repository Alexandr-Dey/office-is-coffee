"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import confetti from "canvas-confetti";
import { trackEvent } from "@/lib/mixpanel";
import type { CartItem } from "@/lib/types";
import Link from "next/link";
import { formatPrice, MENU_ITEMS } from "@/lib/menu";

export default function OrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [payMethod, setPayMethod] = useState<"deposit" | "cash">("cash");
  const [depositBalance, setDepositBalance] = useState(0);
  const [cafeOpen, setCafeOpen] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [loyaltyLoaded, setLoyaltyLoaded] = useState(false);

  useEffect(() => {
    if (user?.displayName) setName(user.displayName);

    let cancelled = false;
    if (user) {
      // Лояльность нужно загрузить ДО создания заказа — чтобы isFree был корректным
      getDoc(doc(getFirebaseDb(), "users", user.uid)).then((snap) => {
        if (cancelled) return;
        if (snap.exists() && snap.data().loyaltyCount === 7) setIsFree(true);
        setLoyaltyLoaded(true);
      }).catch(() => { if (!cancelled) setLoyaltyLoaded(true); });
      getDoc(doc(getFirebaseDb(), "deposits", user.uid)).then((snap) => {
        if (cancelled) return;
        if (snap.exists()) setDepositBalance(snap.data().balance ?? 0);
      }).catch(() => {});
    } else {
      setLoyaltyLoaded(true); // anon — не нужно ждать
    }
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (!cancelled && snap.exists()) setCafeOpen(snap.data().isOpen ?? true);
    }, () => {});
    return () => { cancelled = true; unsub(); };
  }, [user]);

  const total = isFree ? 0 : cart.reduce((s, i) => s + i.totalPrice * i.qty, 0);

  const handleConfirm = async () => {
    if (cart.length === 0) return;
    if (!name.trim()) {
      setOrderError("Укажи своё имя — бариста позовёт когда готово ☕");
      return;
    }
    if (payMethod === "deposit" && !user) {
      setOrderError("Для оплаты депозитом нужно войти через Google");
      return;
    }
    // Валидация: все позиции должны быть в актуальном меню
    const invalidItem = cart.find(i => !MENU_ITEMS.find(m => m.id === i.itemId));
    if (invalidItem) {
      setOrderError(`«${invalidItem.name}» больше нет в меню. Удали из корзины и обнови страницу.`);
      return;
    }

    setOrderError("");
    setSending(true);
    try {
      const userId = user?.uid ?? "anonymous";
      const isRepeat = sessionStorage.getItem("oic_is_repeat") === "true";

      const docRef = await addDoc(collection(getFirebaseDb(), "orders"), {
        name: name || "Гость",
        userId,
        items: cart.map((i) => ({
          itemId: i.itemId,
          name: i.name,
          category: i.category,
          size: i.size,
          basePrice: i.basePrice,
          modifiers: i.modifiers,
          totalPrice: i.totalPrice,
          qty: i.qty,
        })),
        comment: comment.trim(),
        total,
        status: "new",
        paymentMethod: payMethod,
        isFreeByLoyalty: isFree,
        isRepeatOrder: isRepeat,
        baristaBonus: 0,
        baristaid: null,
        rating: null,
        estimatedMinutes: null,
        paidAt: null,
        createdAt: serverTimestamp(),
      });

      sessionStorage.removeItem("oic_is_repeat");

      // Request push permission after first order
      if (userId !== "anonymous") {
        import("@/lib/push").then(({ requestPushPermission }) => {
          requestPushPermission(userId).catch(() => {});
        });
      }

      trackEvent("Order Created", {
        total,
        paymentMethod: payMethod,
        itemsCount: cart.length,
        isRepeat,
        isFree,
      });

      if (isFree) {
        confetti({ particleCount: 100, spread: 70, colors: ["#1a7a44", "#3ecf82", "#d42b4f"] });
      }

      clearCart();
      router.push(`/order/${docRef.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка";
      if (msg.includes("Insufficient")) {
        setOrderError("Недостаточно средств на депозите");
      } else if (msg.includes("permission")) {
        setOrderError("Нет прав для создания заказа. Попробуй перелогиниться.");
      } else {
        setOrderError(`Не удалось создать заказ: ${msg}`);
      }
      console.error("Order error:", err);
      setSending(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">☕</p>
          <p className="text-brand-text/50 text-lg mb-4">Корзина пуста</p>
          <Link href="/menu" className="text-brand-dark font-semibold hover:underline">← Вернуться в меню</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      {!cafeOpen && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-red-500 text-white text-center py-2 text-sm font-bold">
          Кофейня закрыта. Заказ нельзя оформить.
        </div>
      )}
      <nav className={`fixed ${cafeOpen ? "top-0" : "top-9"} w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0] transition-all`}>
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/menu" className="flex items-center gap-2 text-brand-text/50 hover:text-brand-dark text-sm min-h-[44px]">← Назад в меню</Link>
          <h1 className="font-display text-xl font-bold text-brand-text">☕ Оформление</h1>
          <div className="w-20" />
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          {isFree && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-gradient-to-r from-brand-dark to-brand-mid text-white rounded-2xl p-4 mb-6 text-center">
              <p className="text-2xl mb-1">🎉</p>
              <p className="font-bold text-lg">Твой кофе бесплатный!</p>
              <p className="text-sm text-white/70">8-й кофе по программе лояльности</p>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-6" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <h2 className="font-display text-lg font-bold text-brand-text mb-3">Твой заказ</h2>
            <div className="space-y-2 divide-y divide-[#d0f0e0]">
              {cart.map((item) => (
                <div key={item.cartKey} className="flex justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium text-brand-text">{item.name}</span>
                    <span className="ml-1 text-brand-text/40 text-xs">({item.size})</span>
                    {item.modifiers.length > 0 && (
                      <span className="block text-xs text-brand-text/40 mt-0.5">
                        + {item.modifiers.map(m => m.name).join(", ")}
                      </span>
                    )}
                    {item.qty > 1 && <span className="ml-1 text-brand-pink font-bold text-xs">×{item.qty}</span>}
                  </div>
                  <span className="font-bold text-brand-text">{isFree ? "0₸" : formatPrice(item.totalPrice * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#d0f0e0] mt-3 pt-3 flex justify-between">
              <span className="font-bold text-brand-text">Итого</span>
              <span className="font-bold text-brand-dark text-lg">{formatPrice(total)}</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-6" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text/70 mb-1">Имя <span className="text-red-400">*</span></label>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (orderError.includes("имя")) setOrderError(""); }} placeholder="Как тебя зовут?"
                className={`w-full px-4 py-3 rounded-xl border outline-none text-sm text-brand-text bg-brand-bg transition-colors ${
                  orderError.includes("имя") ? "border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400" : "border-[#d0f0e0] focus:border-brand-mint focus:ring-1 focus:ring-brand-mint"
                }`} />
              {orderError.includes("имя") && <p className="text-xs text-red-400 mt-1">Бариста позовёт тебя по имени</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text/70 mb-1">Комментарий <span className="text-brand-text/30">необязательно</span></label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Без сахара, дополнительный сироп..." rows={2}
                className="w-full px-4 py-3 rounded-xl border border-[#d0f0e0] focus:border-brand-mint focus:ring-1 focus:ring-brand-mint outline-none text-sm text-brand-text bg-brand-bg resize-none" />
            </div>
          </motion.div>

          {!isFree && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-6" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
              <p className="text-sm font-medium text-brand-text/70 mb-3">Способ оплаты</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPayMethod("deposit")}
                  className={`p-3 rounded-xl border-2 text-left transition-all min-h-[44px] ${payMethod === "deposit" ? "border-brand-mint bg-brand-mint/10" : "border-[#d0f0e0]"}`}>
                  <span className="text-lg block mb-1">💳</span>
                  <span className="font-bold text-sm text-brand-text block">С депозита</span>
                  <span className="text-xs text-brand-text/50">Баланс: {depositBalance}₸</span>
                  {depositBalance < total && payMethod === "deposit" && (
                    <span className="text-xs text-red-500 block mt-1">Не хватает {total - depositBalance}₸</span>
                  )}
                </button>
                <button onClick={() => setPayMethod("cash")}
                  className={`p-3 rounded-xl border-2 text-left transition-all min-h-[44px] ${payMethod === "cash" ? "border-amber-400 bg-amber-50" : "border-[#d0f0e0]"}`}>
                  <span className="text-lg block mb-1">💵</span>
                  <span className="font-bold text-sm text-brand-text block">Наличными</span>
                  <span className="text-xs text-brand-text/50">Оплата на кассе</span>
                </button>
              </div>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={sending || !cafeOpen || !loyaltyLoaded || (payMethod === "deposit" && depositBalance < total && !isFree)}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all min-h-[44px] ${
              sending ? "bg-brand-mid/50 text-white cursor-wait" : "bg-brand-dark text-white hover:shadow-xl disabled:opacity-50"
            }`}>
            {sending ? "Отправляем..." : !cafeOpen ? "Кофейня закрыта" : isFree ? "Забрать бесплатно 🎉" : `Подтвердить заказ · ${formatPrice(total)}`}
          </motion.button>
          {orderError && <p className="text-red-500 text-sm text-center mt-3 font-medium">{orderError}</p>}
        </div>
      </div>
    </main>
  );
}
