"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { useRequireCEO } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import PushAnalytics from "@/components/ceo/PushAnalytics";
import { collection, getDocs, doc, updateDoc, query, where, orderBy, limit, Timestamp } from "firebase/firestore";

interface BaristaBonus {
  id: string;
  name?: string;
  totalBonus: number;
  pendingPayout: number;
  payoutRequested?: boolean;
  history: { orderId: string; amount: number; date: string }[];
}

interface OrderStats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  avgCheck: number;
}

function getAlmatyToday(): string {
  const d = new Date();
  const utc5 = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return utc5.toISOString().slice(0, 10);
}

export default function CEOPage() {
  const { user, loading } = useRequireCEO();
  const [bonuses, setBonuses] = useState<BaristaBonus[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load bonuses + resolve barista names
  useEffect(() => {
    async function loadBonuses() {
      const db = getFirebaseDb();
      const bonusSnap = await getDocs(collection(db, "barista_bonuses"));
      const raw = bonusSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BaristaBonus, "id">) }));

      // Resolve names
      const withNames = await Promise.all(
        raw.map(async (b) => {
          try {
            const userSnap = await getDocs(
              query(collection(db, "users"), where("__name__", "==", b.id), limit(1))
            );
            // Try direct doc read
            const userDoc = await import("firebase/firestore").then(({ getDoc, doc: docRef }) =>
              getDoc(docRef(db, "users", b.id))
            );
            return { ...b, name: userDoc.exists() ? userDoc.data().displayName : b.id };
          } catch {
            return b;
          }
        })
      );

      setBonuses(withNames);
    }
    loadBonuses().catch(() => {});
  }, [refreshKey]);

  // Load order stats
  useEffect(() => {
    async function loadStats() {
      const db = getFirebaseDb();
      const ordersSnap = await getDocs(collection(db, "orders"));
      const orders = ordersSnap.docs.map((d) => d.data());

      const today = getAlmatyToday();
      let totalRevenue = 0;
      let todayRevenue = 0;
      let totalOrders = 0;
      let todayOrders = 0;

      for (const o of orders) {
        if (o.status === "paid" || o.status === "ready" || o.status === "accepted" || o.status === "new" || o.status === "pending") {
          const amount = o.total ?? 0;
          totalRevenue += amount;
          totalOrders++;

          if (o.createdAt) {
            let orderDate: string;
            if (o.createdAt instanceof Timestamp) {
              const d = new Date(o.createdAt.toMillis() + 5 * 60 * 60 * 1000);
              orderDate = d.toISOString().slice(0, 10);
            } else if (typeof o.createdAt === "string") {
              orderDate = o.createdAt.slice(0, 10);
            } else {
              orderDate = "";
            }
            if (orderDate === today) {
              todayRevenue += amount;
              todayOrders++;
            }
          }
        }
      }

      setStats({
        totalRevenue,
        todayRevenue,
        totalOrders,
        todayOrders,
        avgCheck: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      });
    }
    loadStats().catch(() => {});
  }, [refreshKey]);

  const markPaid = async (baristaId: string) => {
    await updateDoc(doc(getFirebaseDb(), "barista_bonuses", baristaId), {
      pendingPayout: 0,
      payoutRequested: false,
    }).catch(() => {});
    setRefreshKey((k) => k + 1);
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-bg">
        <p className="text-brand-text/50">Загрузка...</p>
      </main>
    );
  }

  const totalPending = bonuses.reduce((s, b) => s + (b.pendingPayout ?? 0), 0);

  function fmt(n: number): string {
    return n.toLocaleString("ru-RU").replace(/,/g, " ");
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 w-full z-50 backdrop-blur-md bg-brand-bg/90 border-b border-[#d0f0e0]">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <h1 className="font-display text-xl font-bold text-brand-text">CEO Дашборд</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/ceo/menu" className="text-sm text-brand-dark font-semibold hover:underline min-h-[44px] flex items-center">📝 Меню</a>
            <a href="/menu" className="text-sm text-brand-text/50 hover:text-brand-dark min-h-[44px] flex items-center">← Клиент</a>
          </div>
        </div>
      </nav>

      <div className="pt-4 pb-12 px-4">
        <div className="max-w-[480px] mx-auto">

          {/* Stats grid */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                <p className="text-xs text-brand-text/50">Сегодня</p>
                <p className="text-2xl font-bold text-brand-dark">{fmt(stats.todayRevenue)}₸</p>
                <p className="text-xs text-brand-text/40">{stats.todayOrders} заказов</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                <p className="text-xs text-brand-text/50">Всего</p>
                <p className="text-2xl font-bold text-brand-dark">{fmt(stats.totalRevenue)}₸</p>
                <p className="text-xs text-brand-text/40">{stats.totalOrders} заказов</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                <p className="text-xs text-brand-text/50">Средний чек</p>
                <p className="text-2xl font-bold text-brand-dark">{fmt(stats.avgCheck)}₸</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-brand-dark to-brand-mid rounded-2xl p-4 text-white">
                <p className="text-xs text-white/70">К выплате</p>
                <p className="text-2xl font-bold">{fmt(totalPending)}₸</p>
                <p className="text-xs text-white/60">баристам</p>
              </motion.div>
            </div>
          )}

          {/* Baristas */}
          <h2 className="font-bold text-brand-text mb-4">Баристы — бонусы</h2>
          <div className="space-y-4">
            {bonuses.length === 0 ? (
              <p className="text-center text-brand-text/40 py-8">Нет данных о бонусах</p>
            ) : (
              bonuses.map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-[#d0f0e0] p-5" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-brand-text">{b.name ?? b.id}</p>
                      <p className="text-xs text-brand-text/40">Всего заработано: {fmt(b.totalBonus ?? 0)}₸</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-dark text-lg">{fmt(b.pendingPayout ?? 0)}₸</p>
                      <p className="text-xs text-brand-text/40">к выплате</p>
                    </div>
                  </div>
                  {b.payoutRequested && (
                    <div className="bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-full mb-3 inline-block">
                      Запрошена выплата
                    </div>
                  )}
                  {(b.pendingPayout ?? 0) > 0 && (
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => markPaid(b.id)}
                      className="w-full py-2.5 bg-brand-dark text-white rounded-xl text-sm font-bold min-h-[44px]">
                      Выплачено ✓
                    </motion.button>
                  )}
                  {b.history && b.history.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-brand-text/40 cursor-pointer">История ({b.history.length})</summary>
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {b.history.slice(-5).reverse().map((h, i) => (
                          <div key={i} className="flex justify-between text-xs text-brand-text/50">
                            <span>{new Date(h.date).toLocaleDateString("ru")}</span>
                            <span className="text-green-600 font-medium">+{h.amount}₸</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Push Notifications */}
          <PushSection />
          <PushAnalytics />
        </div>
      </div>
    </main>
  );
}

/* ═══ PUSH SECTION ═══ */
const TEMPLATES = [
  { title: "Скучаем по тебе ☕", body: "Зайди сегодня — Виталий и Аслан ждут" },
  { title: "🔥 Стрик под угрозой!", body: "Успей заказать до конца дня" },
  { title: "🎁 Один кофе до бесплатного!", body: "Зайди сегодня — осталось совсем чуть-чуть" },
];

interface ClientInfo {
  uid: string;
  name: string;
  token: string | null;
  loyalty: number;
  streak: number;
  lastOrder: string | null;
  role: string;
}

function PushSection() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [tab, setTab] = useState<"segments" | "clients" | "all">("segments");
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  // Load all clients (force token refresh first)
  useEffect(() => {
    async function load() {
      try {
        // Force token refresh to ensure CEO claims are fresh
        const { getFirebaseAuth } = await import("@/lib/firebase");
        await getFirebaseAuth().currentUser?.getIdToken(true).catch(() => {});

        const db = getFirebaseDb();
        const usersSnap = await getDocs(collection(db, "users"));
        const tokensSnap = await getDocs(collection(db, "push_tokens"));
        const tokenMap = new Map<string, string>();
        tokensSnap.docs.forEach(d => { if (d.data().token) tokenMap.set(d.id, d.data().token); });

        const list: ClientInfo[] = [];
        for (const doc of usersSnap.docs) {
          const d = doc.data();
          if (d.role === "barista" || d.role === "ceo") continue;
          list.push({
            uid: doc.id,
            name: d.displayName ?? "Клиент",
            token: tokenMap.get(doc.id) ?? null,
            loyalty: d.loyaltyCount ?? 0,
            streak: d.streak ?? 0,
            lastOrder: d.lastOrderDate ?? null,
            role: d.role ?? "client",
          });
        }
        setClients(list);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
        setError(`Не удалось загрузить: ${msg}`);
        console.error("PushSection load error:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Segments
  const today = new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() + 5 * 3600000 - 86400000).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() + 5 * 3600000 - 7 * 86400000).toISOString().slice(0, 10);

  const withToken = clients.filter(c => c.token);
  const sleeping = withToken.filter(c => c.lastOrder && c.lastOrder < weekAgo);
  const streakRisk = withToken.filter(c => c.lastOrder === yesterday && c.streak > 2);
  const almostFree = withToken.filter(c => c.loyalty === 7);
  const vip = withToken.filter(c => c.streak >= 5);

  const segmentMap: Record<string, ClientInfo[]> = {
    sleeping, streakRisk, almostFree, vip, all: withToken,
  };

  const segmentCards = [
    { key: "sleeping", label: "Спящие (7+ дней)", icon: "😴", color: "border-gray-300 bg-gray-50", list: sleeping },
    { key: "streakRisk", label: "Стрик горит", icon: "🔥", color: "border-orange-300 bg-orange-50", list: streakRisk },
    { key: "almostFree", label: "Почти бесплатный", icon: "🎁", color: "border-green-300 bg-green-50", list: almostFree },
    { key: "vip", label: "Стрик 5+ дней", icon: "👑", color: "border-purple-300 bg-purple-50", list: vip },
  ];

  // Get target tokens
  const getTargetTokens = (): string[] => {
    if (tab === "segments" && selectedSegment) {
      return (segmentMap[selectedSegment] ?? []).map(c => c.token).filter(Boolean) as string[];
    }
    if (tab === "clients") {
      return clients.filter(c => selectedUids.has(c.uid) && c.token).map(c => c.token) as string[];
    }
    if (tab === "all") {
      return withToken.map(c => c.token) as string[];
    }
    return [];
  };

  const targetCount = getTargetTokens().length;

  const handleSend = async () => {
    const tokens = getTargetTokens();
    if (tokens.length === 0 || !title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const { sendManualPush } = await import("@/lib/pushNotifications");
      const sent = await sendManualPush(tokens, title.trim(), body.trim());
      showToast(`📨 Отправлено ${sent} клиентам`, "success");
    } catch (e) {
      showToast("Ошибка отправки", "info");
      console.error(e);
    }
    setSending(false);
  };

  const toggleClient = (uid: string) => {
    setSelectedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  return (
    <div className="mt-8">
      <h2 className="font-bold text-brand-text mb-3">📨 Отправить пуш</h2>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-[#d0f0e0] rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {([
              { key: "segments" as const, label: "Сегменты" },
              { key: "clients" as const, label: `Клиенты (${clients.length})` },
              { key: "all" as const, label: `Всем (${withToken.length})` },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold min-h-[40px] transition-all ${
                  tab === t.key ? "bg-brand-dark text-white" : "bg-white text-brand-text border border-[#d0f0e0]"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Segments tab */}
          {tab === "segments" && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {segmentCards.map(seg => (
                <motion.button key={seg.key} whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedSegment(selectedSegment === seg.key ? null : seg.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedSegment === seg.key ? "border-brand-dark bg-brand-dark/5" : seg.color
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{seg.icon}</span>
                    <span className="text-sm font-bold text-brand-text">{seg.list.length}</span>
                  </div>
                  <p className="text-[10px] text-brand-text/60">{seg.label}</p>
                  {selectedSegment === seg.key && seg.list.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {seg.list.slice(0, 3).map(c => (
                        <p key={c.uid} className="text-[9px] text-brand-text/40 truncate">{c.name}</p>
                      ))}
                      {seg.list.length > 3 && <p className="text-[9px] text-brand-text/30">+{seg.list.length - 3} ещё</p>}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Clients tab */}
          {tab === "clients" && (
            <div className="space-y-1.5 mb-4 max-h-60 overflow-y-auto">
              {clients.map(c => (
                <button key={c.uid} onClick={() => toggleClient(c.uid)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                    selectedUids.has(c.uid) ? "bg-brand-dark/5 border border-brand-dark" : "bg-white border border-[#d0f0e0]"
                  }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    selectedUids.has(c.uid) ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-text/40"
                  }`}>
                    {selectedUids.has(c.uid) ? "✓" : c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">{c.name}</p>
                    <p className="text-[10px] text-brand-text/40">
                      ☕ {c.loyalty}/8 · 🔥 {c.streak}
                      {c.lastOrder && ` · ${c.lastOrder}`}
                      {!c.token && " · ❌ нет push"}
                    </p>
                  </div>
                </button>
              ))}
              {clients.length === 0 && <p className="text-center text-brand-text/40 py-4">Нет клиентов</p>}
            </div>
          )}

          {/* All tab — just info */}
          {tab === "all" && (
            <div className="bg-white rounded-xl border border-[#d0f0e0] p-4 mb-4 text-center">
              <p className="text-3xl mb-2">📢</p>
              <p className="font-bold text-brand-text">{withToken.length} клиентов с push</p>
              <p className="text-xs text-brand-text/40">{clients.length - withToken.length} без push-токена</p>
            </div>
          )}

          {/* Message composer — show when target selected */}
          {(tab === "all" || (tab === "segments" && selectedSegment) || (tab === "clients" && selectedUids.size > 0)) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>

              <p className="text-xs text-brand-text/50 mb-2">Шаблоны:</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => { setTitle(t.title); setBody(t.body); }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium border ${
                      title === t.title ? "border-brand-dark bg-brand-dark/5 text-brand-dark" : "border-[#d0f0e0] text-brand-text/50"
                    }`}>
                    {t.title}
                  </button>
                ))}
              </div>

              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Заголовок" className="w-full px-3 py-2.5 rounded-xl border border-[#d0f0e0] text-sm mb-2 outline-none focus:border-brand-mint" />
              <textarea value={body} onChange={e => setBody(e.target.value)}
                placeholder="Текст" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-[#d0f0e0] text-sm mb-3 outline-none focus:border-brand-mint resize-none" />

              {/* Preview */}
              <button onClick={() => setShowPreview(!showPreview)} className="text-xs text-brand-dark font-medium mb-3 block">
                {showPreview ? "Скрыть" : "👁 Предпросмотр"}
              </button>
              <AnimatePresence>
                {showPreview && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-900 rounded-xl p-3 mb-3 text-white">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-dark flex items-center justify-center text-xs flex-shrink-0">☕</div>
                      <div>
                        <p className="text-xs font-bold">{title || "Заголовок"}</p>
                        <p className="text-[10px] text-white/70">{body || "Текст"}</p>
                        <p className="text-[9px] text-white/30 mt-1">Love is Coffee · сейчас</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend}
                disabled={sending || targetCount === 0 || !title.trim() || !body.trim()}
                className="w-full py-3 bg-brand-dark text-white font-bold rounded-xl disabled:opacity-50 min-h-[48px]">
                {sending ? "Отправка..." : targetCount > 0 ? `Отправить → ${targetCount} клиентам` : "Нет получателей с push"}
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
