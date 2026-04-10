"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRequireBarista } from "@/lib/auth";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, increment, arrayUnion } from "firebase/firestore";

export default function BaristaDepositsPage() {
  const { user, loading } = useRequireBarista();
  const [phone, setPhone] = useState("");
  const [foundUser, setFoundUser] = useState<{ uid: string; name: string; balance: number } | null>(null);
  const [amount, setAmount] = useState("");
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentTopups, setRecentTopups] = useState<Array<{ name: string; amount: number; time: string }>>([]);

  const searchUser = async () => {
    if (!phone.trim()) return;
    setSearching(true); setFoundUser(null);
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, "users"), where("phone", "==", phone.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const depSnap = await getDoc(doc(db, "deposits", d.id));
        setFoundUser({ uid: d.id, name: d.data().displayName || "Клиент", balance: depSnap.exists() ? depSnap.data().balance ?? 0 : 0 });
      }
    } catch { /* ignore */ }
    setSearching(false);
  };

  const topUp = async () => {
    if (!foundUser || !amount || !user) return;
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt <= 0) return;
    try {
      const depRef = doc(getFirebaseDb(), "deposits", foundUser.uid);
      const depSnap = await getDoc(depRef);
      if (depSnap.exists()) {
        await updateDoc(depRef, {
          balance: increment(amt), totalTopup: increment(amt),
          lastTopupAt: new Date().toISOString(),
          history: arrayUnion({ type: "topup", amount: amt, date: new Date().toISOString(), baristaid: user.uid }),
        });
      } else {
        await setDoc(depRef, {
          balance: amt, totalTopup: amt, totalSpent: 0,
          lastTopupAt: new Date().toISOString(),
          history: [{ type: "topup", amount: amt, date: new Date().toISOString(), baristaid: user.uid }],
        });
      }
      setSuccess(true);
      setRecentTopups(prev => [{ name: foundUser.name, amount: amt, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) }, ...prev].slice(0, 5));
      setFoundUser({ ...foundUser, balance: foundUser.balance + amt });
      setAmount("");
      setTimeout(() => setSuccess(false), 3000);
    } catch { /* ignore */ }
  };

  if (loading) {
    return <main className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
    </main>;
  }

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <div className="sticky top-0 z-40 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-[480px] mx-auto px-4 py-3">
          <h1 className="font-display text-lg font-bold text-brand-text">💳 Депозиты</h1>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-4 pt-4">
        {/* Search */}
        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <h2 className="font-bold text-brand-text text-sm mb-3">Найти клиента</h2>
          <div className="flex gap-2">
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон или UID"
              className="flex-1 px-3 py-2.5 rounded-xl border border-[#d0f0e0] text-sm outline-none focus:border-brand-mint min-h-[44px]" />
            <motion.button whileTap={{ scale: 0.95 }} onClick={searchUser} disabled={searching}
              className="px-4 py-2.5 bg-brand-dark text-white rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-50">
              {searching ? "..." : "Найти"}
            </motion.button>
          </div>
        </div>

        {/* Found user */}
        {foundUser && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <div className="flex justify-between mb-4">
              <div>
                <p className="font-bold text-brand-text text-lg">{foundUser.name}</p>
                <p className="text-xs text-brand-text/40">{foundUser.uid.slice(0, 16)}...</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-text/50">Баланс</p>
                <p className="text-2xl font-bold text-brand-dark">{foundUser.balance}₸</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Сумма ₸"
                className="flex-1 px-3 py-2.5 rounded-xl border border-[#d0f0e0] text-sm outline-none focus:border-brand-mint min-h-[44px]" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={topUp}
                className="px-6 py-2.5 bg-brand-dark text-white rounded-xl text-sm font-bold min-h-[44px]">
                Пополнить
              </motion.button>
            </div>
            {success && <p className="text-sm text-green-600 font-bold mt-3">✅ Депозит пополнен!</p>}
          </motion.div>
        )}

        {/* Recent topups this session */}
        {recentTopups.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <h3 className="font-bold text-brand-text text-sm mb-3">Недавние пополнения</h3>
            <div className="space-y-2">
              {recentTopups.map((t, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-brand-text/60">{t.name} · {t.time}</span>
                  <span className="font-bold text-green-600">+{t.amount}₸</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
