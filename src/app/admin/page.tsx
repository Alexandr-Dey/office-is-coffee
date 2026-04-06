"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { useRequireBarista, useAuth } from "@/lib/auth";
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDoc,
  Timestamp, increment, arrayUnion, where, getDocs,
} from "firebase/firestore";

interface OrderItem { name: string; size: string; price: number; qty: number }
interface Order {
  id: string; name: string; items: OrderItem[]; total: number;
  status: "new" | "pending" | "accepted" | "ready" | "paid"; comment?: string;
  createdAt: Timestamp | null; estimatedMinutes?: number; acceptedAt?: number;
  rating?: number; baristaid?: string; paymentMethod?: "deposit" | "cash";
  isFreeByLoyalty?: boolean; paidAt?: unknown;
}

function timeAgo(ts: Timestamp | null): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  return `${Math.floor(diff / 3600)} ч назад`;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "bg-purple-100 text-purple-800" },
  pending: { label: "Ожидает", color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Готовится", color: "bg-blue-100 text-blue-800" },
  ready: { label: "Готов", color: "bg-green-100 text-green-800" },
  paid: { label: "Оплачен", color: "bg-emerald-100 text-emerald-800" },
};

const TIME_OPTIONS = [5, 10, 15, 20];

/* ═══ MENU ITEMS FOR STOP LIST ═══ */
const ALL_MENU_ITEMS = [
  "Капучино", "Латте", "Флэт уайт", "Американо", "Эспрессо",
  "Раф классика", "Раф медовый", "Раф банан-карамель", "Мокко", "Латте халва",
  "Айс американо", "Фраппучино", "Банановый кофе", "Эспрессо тоник",
  "Нарядный", "Имбирный", "Облепиховый", "Глинтвейн",
  "Матча", "Какао", "Горячий шоколад", "Лимонад", "Тыквенно-пряный латте",
];

/* ═══ ORDER CARD ═══ */
function OrderCard({ order, baristaId }: { order: Order; baristaId: string }) {
  const [updating, setUpdating] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const changeStatus = async (newStatus: "pending" | "accepted" | "ready" | "paid", minutes?: number) => {
    setUpdating(true);
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "accepted" && minutes) {
        updates.estimatedMinutes = minutes;
        updates.acceptedAt = Date.now();
        updates.baristaid = baristaId;
      }
      if (newStatus === "paid") {
        updates.paidAt = new Date().toISOString();
      }
      await updateDoc(doc(getFirebaseDb(), "orders", order.id), updates);

      /* Barista bonus on ready — only if not free by loyalty */
      if (newStatus === "ready" && !order.isFreeByLoyalty) {
        const bonusBarista = order.baristaid || baristaId;
        const bonusRef = doc(getFirebaseDb(), "barista_bonuses", bonusBarista);
        const bonusSnap = await getDoc(bonusRef);
        /* Duplicate check */
        if (bonusSnap.exists()) {
          const hist = bonusSnap.data().history || [];
          if (!hist.some((h: { orderId: string }) => h.orderId === order.id)) {
            await updateDoc(bonusRef, {
              totalBonus: increment(5),
              pendingPayout: increment(5),
              history: arrayUnion({ orderId: order.id, amount: 5, date: new Date().toISOString() }),
            });
          }
        } else {
          await setDoc(bonusRef, {
            totalBonus: 5,
            pendingPayout: 5,
            history: [{ orderId: order.id, amount: 5, date: new Date().toISOString() }],
          });
        }
        /* Write baristaBonus on order */
        await updateDoc(doc(getFirebaseDb(), "orders", order.id), { baristaBonus: 5 });
      }
    } catch (err) {
      console.error(err);
    }
    setUpdating(false);
    setShowTimePicker(false);
  };

  const sl = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;

  /* Rating display */
  const ratingEmoji = order.rating === 3 ? "\uD83D\uDE0D" : order.rating === 2 ? "\uD83D\uDC4D" : order.rating === 1 ? "\uD83D\uDE15" : null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 100 }}
      className="bg-white rounded-2xl border border-[#d0f0e0] shadow-sm p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-brand-text text-lg">{order.name}</h3>
          <p className="text-xs text-brand-text/40">{timeAgo(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {ratingEmoji && <span className="text-lg">{ratingEmoji}</span>}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${sl.color}`}>{sl.label}</span>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-brand-text/70">{it.name}{it.size !== "\u2014" && ` (${it.size})`}{it.qty > 1 && ` \u00D7${it.qty}`}</span>
            <span className="font-medium text-brand-text">{it.price * it.qty} \u20B8</span>
          </div>
        ))}
      </div>

      {order.comment && (
        <div className="bg-brand-bg rounded-xl px-3 py-2 text-xs text-brand-text/60 mb-3">\uD83D\uDCAC {order.comment}</div>
      )}

      {order.paymentMethod === "cash" && order.status !== "paid" && (
        <div className="mb-2"><span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{"\uD83D\uDCB5"} НАЛИЧНЫЕ</span></div>
      )}
      <div className="flex items-center justify-between border-t border-[#d0f0e0] pt-3">
        <span className="font-bold text-brand-dark">{order.total} \u20B8</span>
        <div className="flex gap-2">
          {(order.status === "new" || order.status === "pending") && !showTimePicker && (
            <motion.button whileTap={{ scale: 0.95 }} disabled={updating}
              onClick={() => setShowTimePicker(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
              \u2705 Принять
            </motion.button>
          )}
          {showTimePicker && (
            <div className="flex gap-1.5">
              {TIME_OPTIONS.map((m) => (
                <motion.button key={m} whileTap={{ scale: 0.9 }}
                  onClick={() => changeStatus("accepted", m)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200">
                  {m} мин
                </motion.button>
              ))}
            </div>
          )}
          {order.status === "accepted" && (
            <motion.button whileTap={{ scale: 0.95 }} disabled={updating}
              onClick={() => changeStatus("ready")}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
              \u2615 Готово
            </motion.button>
          )}
          {order.status === "ready" && (
            <motion.button whileTap={{ scale: 0.95 }} disabled={updating}
              onClick={() => changeStatus("paid")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {order.paymentMethod === "cash" ? "\uD83D\uDCB5 Получил оплату" : "\u2713 Выдано"}
            </motion.button>
          )}
          {order.status === "paid" && (
            <span className="px-4 py-2 text-emerald-600 text-sm font-bold">\u2713 Завершён</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══ BONUSES TAB ═══ */
function BonusesTab({ baristaId }: { baristaId: string }) {
  const [bonus, setBonus] = useState<{ totalBonus: number; pendingPayout: number; history: { orderId: string; amount: number; date: string }[] } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "barista_bonuses", baristaId), (snap) => {
      if (snap.exists()) setBonus(snap.data() as typeof bonus);
      else setBonus({ totalBonus: 0, pendingPayout: 0, history: [] });
    }, () => {});
    return () => unsub();
  }, [baristaId]);

  if (!bonus) return <div className="text-center py-8 text-brand-text/40">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-6 text-white text-center">
        <p className="text-sm text-white/70 mb-1">Накоплено</p>
        <motion.p key={bonus.totalBonus} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
          className="text-4xl font-bold">{bonus.totalBonus}\u20B8</motion.p>
        <p className="text-sm text-white/70 mt-2">К выплате: {bonus.pendingPayout}\u20B8</p>
      </motion.div>

      <button
        onClick={async () => {
          /* Send notification to CEO - just mark as requested */
          await updateDoc(doc(getFirebaseDb(), "barista_bonuses", baristaId), {
            payoutRequested: true, payoutRequestedAt: new Date().toISOString(),
          }).catch(() => {});
        }}
        className="w-full py-3 bg-brand-mint/20 text-brand-dark font-bold rounded-xl text-sm"
      >
        Запросить выплату
      </button>

      <div className="space-y-2">
        <h3 className="font-bold text-brand-text text-sm">История начислений</h3>
        {(bonus.history || []).slice(-10).reverse().map((h, i) => (
          <div key={i} className="flex justify-between text-sm bg-white rounded-xl p-3 border border-[#d0f0e0]">
            <span className="text-brand-text/60 text-xs">{new Date(h.date).toLocaleDateString("ru")}</span>
            <span className="font-bold text-brand-dark">+{h.amount}\u20B8</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ STOP LIST TAB ═══ */
function StopListTab() {
  const [stopList, setStopList] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) setStopList(snap.data().stopList ?? []);
    }, () => {});
    return () => unsub();
  }, []);

  const toggleItem = async (name: string) => {
    const newList = stopList.includes(name) ? stopList.filter((s) => s !== name) : [...stopList, name];
    setStopList(newList);
    await setDoc(doc(getFirebaseDb(), "cafe_status", "aksay_main"), { stopList: newList }, { merge: true }).catch(() => {});
  };

  return (
    <div className="space-y-2">
      {ALL_MENU_ITEMS.map((name) => (
        <div key={name} className="flex items-center justify-between bg-white rounded-xl p-3 border border-[#d0f0e0]">
          <span className={`text-sm ${stopList.includes(name) ? "text-red-400 line-through" : "text-brand-text"}`}>{name}</span>
          <button
            onClick={() => toggleItem(name)}
            className={`w-10 h-6 rounded-full transition-colors ${stopList.includes(name) ? "bg-red-400" : "bg-brand-mint"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${stopList.includes(name) ? "translate-x-0.5" : "translate-x-4"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══ RATINGS TAB ═══ */
function RatingsTab({ orders }: { orders: Order[] }) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => o.rating && o.createdAt && new Date(o.createdAt.toMillis()).toDateString() === today);
  const ratings = { 3: 0, 2: 0, 1: 0 };
  todayOrders.forEach((o) => { if (o.rating) ratings[o.rating as 1 | 2 | 3]++; });

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-brand-text">Рейтинг дня</h3>
      <div className="flex gap-4 justify-center">
        {[{ emoji: "\uD83D\uDE0D", count: ratings[3], label: "Отлично" },
          { emoji: "\uD83D\uDC4D", count: ratings[2], label: "Хорошо" },
          { emoji: "\uD83D\uDE15", count: ratings[1], label: "Так себе" }].map((r) => (
          <div key={r.label} className="text-center">
            <span className="text-3xl block">{r.emoji}</span>
            <span className="text-2xl font-bold text-brand-text">{r.count}</span>
            <span className="text-xs text-brand-text/50 block">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ DEPOSITS TAB ═══ */
function DepositsTab({ baristaId }: { baristaId: string }) {
  const [phone, setPhone] = useState("");
  const [foundUser, setFoundUser] = useState<{ uid: string; name: string; balance: number } | null>(null);
  const [amount, setAmount] = useState("");
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(false);

  const searchUser = async () => {
    if (!phone.trim()) return;
    setSearching(true); setFoundUser(null);
    try {
      const q = query(collection(getFirebaseDb(), "users"), where("phone", "==", phone.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const depSnap = await getDoc(doc(getFirebaseDb(), "deposits", d.id));
        setFoundUser({ uid: d.id, name: d.data().displayName || "Клиент", balance: depSnap.exists() ? depSnap.data().balance ?? 0 : 0 });
      }
    } catch { /* ignore */ }
    setSearching(false);
  };

  const topUp = async () => {
    if (!foundUser || !amount) return;
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt <= 0) return;
    try {
      const depRef = doc(getFirebaseDb(), "deposits", foundUser.uid);
      const depSnap = await getDoc(depRef);
      if (depSnap.exists()) {
        await updateDoc(depRef, {
          balance: increment(amt),
          totalTopup: increment(amt),
          lastTopupAt: new Date().toISOString(),
          history: arrayUnion({ type: "topup", amount: amt, date: new Date().toISOString(), baristaid: baristaId }),
        });
      } else {
        await setDoc(depRef, {
          balance: amt, totalTopup: amt, totalSpent: 0,
          lastTopupAt: new Date().toISOString(),
          history: [{ type: "topup", amount: amt, date: new Date().toISOString(), baristaid: baristaId }],
        });
      }
      setSuccess(true);
      setFoundUser({ ...foundUser, balance: foundUser.balance + amt });
      setAmount("");
      setTimeout(() => setSuccess(false), 3000);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
        <h3 className="font-bold text-brand-text text-sm mb-3">Найти клиента</h3>
        <div className="flex gap-2">
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Номер телефона или UID"
            className="flex-1 px-3 py-2 rounded-xl border border-[#d0f0e0] text-sm outline-none focus:border-brand-mint" />
          <motion.button whileTap={{ scale: 0.95 }} onClick={searchUser} disabled={searching}
            className="px-4 py-2 bg-brand-dark text-white rounded-xl text-sm font-bold disabled:opacity-50">
            {searching ? "..." : "Найти"}
          </motion.button>
        </div>
      </div>

      {foundUser && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#d0f0e0] p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <div className="flex justify-between mb-3">
            <div>
              <p className="font-bold text-brand-text">{foundUser.name}</p>
              <p className="text-xs text-brand-text/40">{foundUser.uid.slice(0, 20)}...</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-text/50">Баланс</p>
              <p className="font-bold text-brand-dark text-lg">{foundUser.balance}\u20B8</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Сумма \u20B8"
              className="flex-1 px-3 py-2 rounded-xl border border-[#d0f0e0] text-sm outline-none focus:border-brand-mint" />
            <motion.button whileTap={{ scale: 0.95 }} onClick={topUp}
              className="px-4 py-2 bg-brand-mint text-brand-dark rounded-xl text-sm font-bold">
              Пополнить
            </motion.button>
          </div>
          {success && <p className="text-sm text-green-600 font-bold mt-2">{"\u2705"} Депозит пополнен!</p>}
        </motion.div>
      )}
    </div>
  );
}

/* ═══ PAGE ═══ */
export default function AdminPage() {
  const { user, loading: authLoading } = useRequireBarista();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | "new" | "pending" | "accepted" | "ready" | "paid">("all");
  const [tab, setTab] = useState<"orders" | "bonuses" | "stoplist" | "ratings" | "deposits">("orders");
  const [cafeOpen, setCafeOpen] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const q = query(collection(getFirebaseDb(), "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
    });
    return () => unsub();
  }, []);

  /* Cafe status */
  useEffect(() => {
    const unsub = onSnapshot(doc(getFirebaseDb(), "cafe_status", "aksay_main"), (snap) => {
      if (snap.exists()) setCafeOpen(snap.data().isOpen ?? true);
    }, () => {});
    return () => unsub();
  }, []);

  const toggleCafe = async () => {
    const newOpen = !cafeOpen;
    setCafeOpen(newOpen);
    await setDoc(doc(getFirebaseDb(), "cafe_status", "aksay_main"), {
      isOpen: newOpen,
      [newOpen ? "openedAt" : "closedAt"]: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
  };

  const counts = {
    all: orders.length,
    new: orders.filter((o) => o.status === "new" || o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    ready: orders.filter((o) => o.status === "ready").length,
    paid: orders.filter((o) => o.status === "paid").length,
  };
  const filtered = filter === "all" ? orders : filter === "new" ? orders.filter((o) => o.status === "new" || o.status === "pending") : orders.filter((o) => o.status === filter);

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="animate-pulse space-y-4 w-full max-w-md px-4">
          <div className="h-8 bg-[#d0f0e0] rounded-lg w-1/2" />
          <div className="h-32 bg-[#d0f0e0] rounded-2xl" />
          <div className="h-32 bg-[#d0f0e0] rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">\u2615</span>
            <span className="font-display text-xl font-bold text-brand-text">Love is Coffee</span>
            <span className="px-2 py-0.5 bg-brand-mint/20 text-brand-dark text-xs font-bold rounded-full">Админ</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleCafe}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              cafeOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {cafeOpen ? "\uD83D\uDFE2 Открыто" : "\uD83D\uDD34 Закрыто"}
          </motion.button>
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Tab switcher */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
            {([
              { key: "orders", label: "Заказы", icon: "\uD83D\uDCE6" },
              { key: "deposits", label: "Депозиты", icon: "\uD83D\uDCB3" },
              { key: "bonuses", label: "Мои бонусы", icon: "\uD83D\uDCB0" },
              { key: "stoplist", label: "Стоп-лист", icon: "\u26D4" },
              { key: "ratings", label: "Рейтинг", icon: "\u2B50" },
            ] as const).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  tab === t.key ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === "orders" && (
            <>
              <div className="flex justify-center gap-2 mb-6" key={now}>
                {([
                  { key: "all", label: "Все" },
                  { key: "new", label: "Новые" },
                  { key: "accepted", label: "Готовятся" },
                  { key: "ready", label: "Готовы" },
                  { key: "paid", label: "Оплачены" },
                ] as const).map((f) => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filter === f.key ? "bg-brand-dark text-white shadow-md" : "bg-white text-brand-text border border-[#d0f0e0]"
                    }`}>
                    {f.label} <span className="ml-1 text-xs opacity-70">({counts[f.key]})</span>
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <p className="text-5xl mb-3">\uD83D\uDE34</p>
                  <p className="text-brand-text/40">Заказов пока нет</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filtered.map((order) => (
                      <OrderCard key={order.id} order={order} baristaId={user.uid} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {tab === "deposits" && <DepositsTab baristaId={user.uid} />}
          {tab === "bonuses" && <BonusesTab baristaId={user.uid} />}
          {tab === "stoplist" && <StopListTab />}
          {tab === "ratings" && <RatingsTab orders={orders} />}
        </div>
      </div>
    </main>
  );
}
