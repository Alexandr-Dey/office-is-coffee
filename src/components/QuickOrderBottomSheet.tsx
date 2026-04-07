"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { trackEvent } from "@/lib/mixpanel";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  milk: string;
  addons: string[];
  price: number;
  qty: number;
}

interface QuickOrderItem {
  id: string;
  type: "last" | "frequent";
  title: string;
  subtitle: string;
  total: number;
  items: OrderItem[];
  count?: number;
}

interface Props {
  order: QuickOrderItem;
  onClose: () => void;
}

export default function QuickOrderBottomSheet({ order, onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"deposit" | "cash">("cash");
  const [depositBalance, setDepositBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(getFirebaseDb(), "deposits", user.uid)).then((depSnap) => {
      setDepositBalance(depSnap.exists() ? depSnap.data().balance : 0);
    }).catch(() => {});
  }, [user?.uid]);

  async function handleConfirm() {
    if (!user?.uid) return;

    if (paymentMethod === "deposit" && (depositBalance ?? 0) < order.total) {
      setError("Не хватает на депозите, пополните у баристы");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newOrder = {
        userId: user.uid,
        items: order.items,
        total: order.total,
        paymentMethod,
        status: "new",
        isRepeatOrder: true,
        isFreeByLoyalty: false,
        baristaBonus: 0,
        baristaid: null,
        rating: null,
        estimatedMinutes: null,
        comment: null,
        paidAt: null,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(getFirebaseDb(), "orders"), newOrder);

      trackEvent("Order Created", {
        orderId: docRef.id,
        total: order.total,
        paymentMethod,
        isRepeat: true,
        source: "quick_order",
      });

      router.push(`/order/${docRef.id}`);
    } catch (e) {
      console.error(e);
      setError("Не удалось создать заказ. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-t-3xl p-6 w-full max-w-[480px]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

          <h3 className="font-bold text-xl text-[#1a7a44] mb-2">Повторить заказ?</h3>

          <div className="bg-[#f0fdf4] rounded-xl p-4 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm mb-1">
                <span className="text-[#0f3a20]">
                  {item.name} {item.size}
                  {item.milk && item.milk !== "standard" && item.milk !== "Стандарт" && `, ${item.milk}`}
                  {item.qty > 1 && ` ×${item.qty}`}
                </span>
                <span className="font-semibold">{(item.price * item.qty).toLocaleString("ru-RU")}₸</span>
              </div>
            ))}
            <div className="border-t border-[#d0f0e0] mt-2 pt-2 flex justify-between">
              <span className="font-bold text-[#1a7a44]">Итого</span>
              <span className="font-bold text-[#1a7a44]">{order.total.toLocaleString("ru-RU")}₸</span>
            </div>
          </div>

          <p className="text-sm font-semibold text-[#0f3a20] mb-2">Способ оплаты:</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod("deposit")}
              className={`p-3 rounded-xl border text-sm font-semibold ${
                paymentMethod === "deposit"
                  ? "bg-[#1a7a44] text-white border-[#1a7a44]"
                  : "bg-white text-[#1a7a44] border-[#d0f0e0]"
              }`}
            >
              💳 Депозит
              {depositBalance !== null && (
                <div className="text-xs font-normal mt-1 opacity-80">
                  {depositBalance.toLocaleString("ru-RU")}₸
                </div>
              )}
            </button>
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`p-3 rounded-xl border text-sm font-semibold ${
                paymentMethod === "cash"
                  ? "bg-[#1a7a44] text-white border-[#1a7a44]"
                  : "bg-white text-[#1a7a44] border-[#d0f0e0]"
              }`}
            >
              💵 Наличными
            </button>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <motion.button
            onClick={handleConfirm}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-[#1a7a44] text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Создаём заказ..." : "Подтвердить заказ"}
          </motion.button>

          <button
            onClick={onClose}
            className="w-full text-gray-500 py-3 mt-2 font-medium"
          >
            Отмена
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
