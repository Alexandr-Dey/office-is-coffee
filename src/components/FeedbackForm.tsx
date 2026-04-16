"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

const MIN_LEN = 10;
const MAX_LEN = 1000;

export default function FeedbackForm() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"complaint" | "suggestion" | "praise">("suggestion");
  const [sending, setSending] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const text = message.trim();
    if (text.length < MIN_LEN) {
      setError(`Минимум ${MIN_LEN} символов`);
      return;
    }
    if (!user) {
      setError("Войдите чтобы отправить");
      return;
    }
    setSending(true);
    setError("");
    try {
      await addDoc(collection(getFirebaseDb(), "feedback"), {
        userId: user.uid,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        type,
        message: text,
        createdAt: serverTimestamp(),
        resolved: false,
      });
      setMessage("");
      setShowThanks(true);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      setError(code === "permission-denied"
        ? "Нет доступа. Попробуйте позже."
        : "Не удалось отправить. Проверьте интернет.");
    } finally {
      setSending(false);
    }
  };

  const remaining = MAX_LEN - message.length;
  const tooLong = remaining < 0;

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💬</span>
          <p className="font-bold text-sm text-brand-text">Жалобы и предложения</p>
        </div>

        <div className="flex gap-2 mb-3">
          {([
            { id: "suggestion", label: "💡 Идея" },
            { id: "complaint", label: "😞 Жалоба" },
            { id: "praise", label: "❤️ Похвала" },
          ] as const).map(opt => (
            <button
              key={opt.id}
              onClick={() => setType(opt.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[44px] transition-all ${
                type === opt.id
                  ? "bg-brand-dark text-white"
                  : "bg-brand-bg text-brand-text/60 border border-[#d0f0e0]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => { setMessage(e.target.value); if (error) setError(""); }}
          placeholder="Напишите что улучшить, что сломалось или что вам понравилось..."
          rows={4}
          maxLength={MAX_LEN + 100}
          className={`w-full px-4 py-3 rounded-xl border outline-none text-sm text-brand-text bg-brand-bg resize-none ${
            error || tooLong
              ? "border-red-300 focus:border-red-400"
              : "border-[#d0f0e0] focus:border-brand-mint focus:ring-1 focus:ring-brand-mint"
          }`}
        />

        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${tooLong ? "text-red-500" : "text-brand-text/40"}`}>
            {tooLong ? `Слишком длинно: ${-remaining}` : `${message.length}/${MAX_LEN}`}
          </span>
          {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={sending || tooLong || message.trim().length < MIN_LEN}
          className="w-full mt-3 py-3 bg-brand-dark text-white font-bold rounded-xl text-sm min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Отправляем..." : "Отправить"}
        </motion.button>
      </div>

      {/* ═══ THANK YOU MODAL ═══ */}
      <AnimatePresence>
        {showThanks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-6"
            onClick={() => setShowThanks(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 15 }}
                className="text-6xl mb-4"
              >
                ❤️
              </motion.div>
              <h3 className="font-display text-2xl font-bold text-brand-dark mb-2">
                Спасибо!
              </h3>
              <p className="text-sm text-brand-text/70 mb-6">
                Спасибо что делаете приложение лучше. Каждое сообщение читаем — и обязательно ответим.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowThanks(false)}
                className="w-full py-3 bg-brand-mid text-white font-bold rounded-xl text-sm min-h-[44px]"
              >
                Закрыть
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
