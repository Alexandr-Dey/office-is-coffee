"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, arrayUnion, runTransaction } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import confetti from "canvas-confetti";
import { getAlmatyDate } from "@/lib/constants";

interface CartItem { name: string; size: string; price: number; qty: number; milk?: string }

export default function OrderPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [payMethod, setPayMethod] = useState<"deposit" | "cash">("cash");
  const [depositBalance, setDepositBalance] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("oic_cart");
    if (raw) { try { setCart(JSON.parse(raw)); } catch { /* ignore */ } }
    const userRaw = localStorage.getItem("oic_user");
    if (userRaw) { try { const u = JSON.parse(userRaw); if (u.displayName) setName(u.displayName); } catch { /* ignore */ } }

    if (user) {
      getDoc(doc(getFirebaseDb(), "users", user.uid)).then((snap) => {
        if (snap.exists() && snap.data().loyaltyCount >= 7) setIsFree(true);
      }).catch(() => {});
      getDoc(doc(getFirebaseDb(), "deposits", user.uid)).then((snap) => {
        if (snap.exists()) setDepositBalance(snap.data().balance ?? 0);
      }).catch(() => {});
    }
  }, [user]);

  const total = isFree ? 0 : cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleConfirm = async () => {
    if (cart.length === 0) return;
    setSending(true);
    try {
      const userId = user?.uid || localStorage.getItem("oic_userId") || "anonymous";
      const isRepeat = sessionStorage.getItem("oic_is_repeat") === "true";

      const docRef = await addDoc(collection(getFirebaseDb(), "orders"), {
        name: name || "Гость",
        userId,
        items: cart.map((i) => ({ name: i.name, size: i.size, price: i.price, qty: i.qty, milk: i.milk })),
        comment: comment.trim(),
        total,
        status: "new",
        paymentMethod: payMethod,
        isFreeByLoyalty: isFree,
        isRepeatOrder: isRepeat,
        baristaBonus: 0,
        paidAt: null,
        createdAt: serverTimestamp(),
      });

      sessionStorage.removeItem("oic_is_repeat");

      /* Update loyalty + streak */
      if (user) {
        const userRef = doc(getFirebaseDb(), "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          const today = getAlmatyDate();
          const lastOrder = data.lastOrderDate;
          const yesterdayDate = new Date(Date.now() - 86400000);
          const yesterday = yesterdayDate.toLocaleString("sv", { timeZone: "Asia/Almaty" }).split(" ")[0];

          let newStreak = 1;
          if (lastOrder === yesterday) newStreak = (data.streak || 0) + 1;
          else if (lastOrder === today) newStreak = data.streak || 1;

          let newLoyalty = (data.loyaltyCount || 0) + 1;
          if (isFree) {
            newLoyalty = 0;
            confetti({ particleCount: 100, spread: 70, colors: ["#1a7a44", "#3ecf82", "#d42b4f"] });
          }
          if (newLoyalty >= 8) newLoyalty = 8;

          await updateDoc(userRef, {
            loyaltyCount: newLoyalty,
            streak: newStreak,
            lastOrderDate: today,
          });

          /* Deposit: deduct balance atomically via transaction */
          if (payMethod === "deposit" && !isFree && total > 0) {
            const depRef = doc(getFirebaseDb(), "deposits", user.uid);
            await runTransaction(getFirebaseDb(), async (tx) => {
              const depSnap = await tx.get(depRef);
              if (!depSnap.exists()) throw new Error("No deposit");
              const bal = depSnap.data().balance || 0;
              if (bal < total) throw new Error("Insufficient balance");
              tx.update(depRef, {
                balance: bal - total,
                totalSpent: (depSnap.data().totalSpent || 0) + total,
                history: arrayUnion({ type: "payment", amount: total, date: new Date().toISOString(), orderId: docRef.id }),
              });
            });
          }

          /* 07:31 easter egg */
          const now = new Date();
          if (now.getHours() === 7 && now.getMinutes() === 31) {
            confetti({ particleCount: 60, colors: ["#3ecf82", "#1a7a44"] });
          }
        }
      }

      if (name) localStorage.setItem("oic_guest_name", name);
      sessionStorage.removeItem("oic_cart");
      window.location.href = `/order/${docRef.id}`;
    } catch (err) {
      console.error(err);
      setSending(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">\u2615</p>
          <p className="text-brand-text/50 text-lg mb-4">Корзина пуста</p>
          <a href="/menu" className="text-brand-dark font-semibold hover:underline">\u2190 Вернуться в меню</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/menu" className="flex items-center gap-2 text-brand-text/50 hover:text-brand-dark text-sm">\u2190 Назад в меню</a>
          <span className="font-display text-xl font-bold text-brand-text">\u2615 Оформление</span>
          <div className="w-20" />
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          {isFree && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-gradient-to-r from-brand-dark to-brand-mid text-white rounded-2xl p-4 mb-6 text-center">
              <p className="text-2xl mb-1">\uD83C\uDF89</p>
              <p className="font-bold text-lg">Твой кофе бесплатный!</p>
              <p className="text-sm text-white/70">8-й кофе по программе лояльности</p>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-6" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <h2 className="font-display text-lg font-bold text-brand-text mb-3">Твой заказ</h2>
            <div className="space-y-2 divide-y divide-[#d0f0e0]">
              {cart.map((item) => (
                <div key={`${item.name}_${item.size}_${item.milk}`} className="flex justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium text-brand-text">{item.name}</span>
                    {item.size !== "\u2014" && <span className="ml-1 text-brand-text/40 text-xs">({item.size})</span>}
                    {item.milk && <span className="ml-1 text-brand-mint text-xs">{item.milk}</span>}
                    {item.qty > 1 && <span className="ml-1 text-brand-pink font-bold text-xs">\u00D7{item.qty}</span>}
                  </div>
                  <span className="font-bold text-brand-text">{isFree ? "0" : item.price * item.qty} \u20B8</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#d0f0e0] mt-3 pt-3 flex justify-between">
              <span className="font-bold text-brand-text">Итого</span>
              <span className="font-bold text-brand-dark text-lg">{total} \u20B8</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-6" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text/70 mb-1">Имя</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Как тебя зовут?"
                className="w-full px-4 py-3 rounded-xl border border-[#d0f0e0] focus:border-brand-mint focus:ring-1 focus:ring-brand-mint outline-none text-sm text-brand-text bg-brand-bg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text/70 mb-1">Комментарий <span className="text-brand-text/30">необязательно</span></label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Без сахара, дополнительный сироп..." rows={2}
                className="w-full px-4 py-3 rounded-xl border border-[#d0f0e0] focus:border-brand-mint focus:ring-1 focus:ring-brand-mint outline-none text-sm text-brand-text bg-brand-bg resize-none" />
            </div>
          </motion.div>

          {/* Payment method */}
          {!isFree && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-6" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
              <p className="text-sm font-medium text-brand-text/70 mb-3">Способ оплаты</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPayMethod("deposit")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${payMethod === "deposit" ? "border-brand-mint bg-brand-mint/10" : "border-[#d0f0e0]"}`}>
                  <span className="text-lg block mb-1">{"\uD83D\uDCB3"}</span>
                  <span className="font-bold text-sm text-brand-text block">С депозита</span>
                  <span className="text-xs text-brand-text/50">Баланс: {depositBalance}\u20B8</span>
                  {depositBalance < total && payMethod === "deposit" && (
                    <span className="text-xs text-red-500 block mt-1">Не хватает {total - depositBalance}\u20B8</span>
                  )}
                </button>
                <button onClick={() => setPayMethod("cash")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${payMethod === "cash" ? "border-amber-400 bg-amber-50" : "border-[#d0f0e0]"}`}>
                  <span className="text-lg block mb-1">{"\uD83D\uDCB5"}</span>
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
            disabled={sending || (payMethod === "deposit" && depositBalance < total && !isFree)}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
              sending ? "bg-brand-mid/50 text-white cursor-wait" : "bg-brand-dark text-white hover:shadow-xl disabled:opacity-50"
            }`}>
            {sending ? "Отправляем..." : isFree ? "Забрать бесплатно \uD83C\uDF89" : `Подтвердить заказ \u2022 ${total} \u20B8`}
          </motion.button>
        </div>
      </div>
    </main>
  );
}
