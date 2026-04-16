"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, orderBy, query, doc, updateDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useRequireCEO } from "@/lib/auth";

type FeedbackType = "complaint" | "suggestion" | "praise";

interface Feedback {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  role: string;
  type: FeedbackType;
  message: string;
  createdAt: Timestamp | null;
  resolved: boolean;
}

const TYPE_LABEL: Record<FeedbackType, { icon: string; name: string; bg: string; color: string }> = {
  suggestion: { icon: "💡", name: "Идея", bg: "bg-yellow-50", color: "text-yellow-700" },
  complaint: { icon: "😞", name: "Жалоба", bg: "bg-red-50", color: "text-red-700" },
  praise: { icon: "❤️", name: "Похвала", bg: "bg-pink-50", color: "text-brand-pink" },
};

function formatDate(ts: Timestamp | null): string {
  if (!ts) return "";
  return new Date(ts.toMillis()).toLocaleString("ru", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function CEOFeedbackPage() {
  const { loading } = useRequireCEO();
  const [items, setItems] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "all">("all");

  useEffect(() => {
    let cancelled = false;
    const q = query(collection(getFirebaseDb(), "feedback"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      if (cancelled) return;
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Feedback, "id">) })));
    }, (err) => console.warn("feedback listen error:", err.message));
    return () => { cancelled = true; unsub(); };
  }, []);

  const toggleResolved = async (id: string, current: boolean) => {
    await updateDoc(doc(getFirebaseDb(), "feedback", id), { resolved: !current }).catch(() => {});
  };

  if (loading) {
    return <main className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
    </main>;
  }

  const filtered = items
    .filter(i => filter === "all" || (filter === "active" ? !i.resolved : i.resolved))
    .filter(i => typeFilter === "all" || i.type === typeFilter);

  const counts = {
    all: items.length,
    active: items.filter(i => !i.resolved).length,
    resolved: items.filter(i => i.resolved).length,
  };

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <nav className="sticky top-0 z-40 bg-white border-b border-[#d0f0e0]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/ceo" className="text-brand-text/50 text-sm">← CEO</a>
          <span className="font-display text-lg font-bold text-brand-text">💬 Обратная связь</span>
          <span className="text-xs text-brand-text/40">{counts.all}</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Status filter */}
        <div className="flex gap-2 mb-3">
          {([
            { id: "active" as const, label: `Новые (${counts.active})` },
            { id: "resolved" as const, label: `Закрыто (${counts.resolved})` },
            { id: "all" as const, label: `Все (${counts.all})` },
          ]).map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[44px] ${
                filter === t.id ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
              }`}>{t.label}</button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          <button onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              typeFilter === "all" ? "bg-brand-mid text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
            }`}>Все типы</button>
          {(["suggestion", "complaint", "praise"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                typeFilter === t ? "bg-brand-mid text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
              }`}>{TYPE_LABEL[t].icon} {TYPE_LABEL[t].name}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-brand-text/50">Пусто. Хорошо! Или плохо.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map(fb => {
                const tl = TYPE_LABEL[fb.type] ?? TYPE_LABEL.suggestion;
                return (
                  <motion.div
                    key={fb.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={`rounded-2xl border border-[#d0f0e0] p-4 ${fb.resolved ? "bg-gray-50 opacity-70" : "bg-white"}`}
                    style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tl.bg} ${tl.color}`}>
                          {tl.icon} {tl.name}
                        </span>
                        <span className="text-xs text-brand-text/40 px-2 py-0.5 rounded-full bg-brand-bg">
                          {fb.role === "client" ? "☕" : fb.role === "barista" ? "🧑‍🍳" : "👑"} {fb.displayName}
                        </span>
                      </div>
                      <span className="text-xs text-brand-text/40">{formatDate(fb.createdAt)}</span>
                    </div>
                    <p className="text-sm text-brand-text whitespace-pre-wrap leading-relaxed mb-3">{fb.message}</p>
                    {fb.email && (
                      <p className="text-xs text-brand-text/50 mb-2">
                        <a href={`mailto:${fb.email}`} className="text-brand-dark underline">{fb.email}</a>
                      </p>
                    )}
                    <button
                      onClick={() => toggleResolved(fb.id, fb.resolved)}
                      className={`w-full py-2 rounded-xl text-xs font-bold min-h-[40px] ${
                        fb.resolved
                          ? "bg-brand-bg text-brand-text/60 border border-[#d0f0e0]"
                          : "bg-brand-mid text-white"
                      }`}
                    >
                      {fb.resolved ? "↺ Открыть снова" : "✓ Отметить решённым"}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
