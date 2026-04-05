"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CartItem {
  name: string;
  size: string;
  price: number;
  qty: number;
}

export default function OrderPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    /* загружаем корзину */
    const raw = sessionStorage.getItem("oic_cart");
    if (raw) {
      try { setCart(JSON.parse(raw)); } catch { /* ignore */ }
    }
    /* имя из localStorage (профиль аватара) */
    const saved = localStorage.getItem("oic_guest_name");
    if (saved) setName(saved);
    else {
      const nick = localStorage.getItem("oic_nickname");
      if (nick) setName(nick);
    }
  }, []);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleConfirm = async () => {
    if (cart.length === 0) return;
    setSending(true);
    try {
      const avatarSkin = parseInt(localStorage.getItem("oic_skin") ?? "0", 10);
      const avatarCloth = parseInt(localStorage.getItem("oic_cloth") ?? "0", 10);
      const docRef = await addDoc(collection(db, "orders"), {
        name: name || "\u0413\u043E\u0441\u0442\u044C",
        items: cart.map((i) => ({ name: i.name, size: i.size, price: i.price, qty: i.qty })),
        comment: comment.trim(),
        total,
        status: "pending",
        avatarSkin,
        avatarCloth,
        createdAt: serverTimestamp(),
      });
      /* сохраняем имя */
      if (name) localStorage.setItem("oic_guest_name", name);
      sessionStorage.removeItem("oic_cart");
      window.location.href = `/order/${docRef.id}`;
    } catch (err) {
      console.error("Order error:", err);
      setSending(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">{"\u2615"}</p>
          <p className="text-coffee-500 text-lg mb-4">{"\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u043F\u0443\u0441\u0442\u0430"}</p>
          <a href="/menu" className="text-red-600 font-semibold hover:underline">
            {"\u2190 \u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u0432 \u043C\u0435\u043D\u044E"}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      {/* навбар */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/menu" className="flex items-center gap-2 text-coffee-500 hover:text-coffee-700 text-sm">
            {"\u2190 \u041D\u0430\u0437\u0430\u0434 \u0432 \u043C\u0435\u043D\u044E"}
          </a>
          <span className="font-display text-xl font-bold text-coffee-900">
            {"\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u0430\u0437\u0430"}
          </span>
          <div className="w-20" />
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Состав заказа */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-coffee-100 shadow-sm p-5 mb-6"
          >
            <h2 className="font-display text-lg font-bold text-coffee-900 mb-3">
              {"\u0422\u0432\u043E\u0439 \u0437\u0430\u043A\u0430\u0437"}
            </h2>
            <div className="space-y-2 divide-y divide-coffee-50">
              {cart.map((item) => (
                <div key={`${item.name}_${item.size}`} className="flex justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium text-coffee-900">{item.name}</span>
                    {item.size !== "\u2014" && (
                      <span className="ml-1 text-coffee-400 text-xs">({item.size})</span>
                    )}
                    {item.qty > 1 && (
                      <span className="ml-1 text-red-500 font-bold text-xs">{"\u00D7"}{item.qty}</span>
                    )}
                  </div>
                  <span className="font-bold text-coffee-800">{item.price * item.qty} {"\u20B8"}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-coffee-100 mt-3 pt-3 flex justify-between">
              <span className="font-bold text-coffee-900">{"\u0418\u0442\u043E\u0433\u043E"}</span>
              <span className="font-bold text-red-600 text-lg">{total} {"\u20B8"}</span>
            </div>
          </motion.div>

          {/* Форма */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-coffee-100 shadow-sm p-5 mb-6"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-coffee-700 mb-1">
                {"\u0418\u043C\u044F"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={"\u041A\u0430\u043A \u0442\u0435\u0431\u044F \u0437\u043E\u0432\u0443\u0442?"}
                className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm text-coffee-900 bg-cream-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-1">
                {"\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439 \u043A \u0437\u0430\u043A\u0430\u0437\u0443"}
                <span className="text-coffee-300 ml-1">{"\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"}</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={"\u0411\u0435\u0437 \u0441\u0430\u0445\u0430\u0440\u0430, \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0441\u0438\u0440\u043E\u043F..."}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm text-coffee-900 bg-cream-50 resize-none"
              />
            </div>
          </motion.div>

          {/* Кнопка подтверждения */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={sending}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
              sending
                ? "bg-coffee-300 text-white cursor-wait"
                : "bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-xl"
            }`}
          >
            {sending ? "\u041e\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C..." : `\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437 \u2022 ${total} \u20B8`}
          </motion.button>
        </div>
      </div>
    </main>
  );
}
