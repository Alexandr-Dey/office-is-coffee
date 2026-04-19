"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";

interface BonusData { totalBonus: number; pendingPayout: number; payoutRequested: boolean }

interface DepositHistoryEntry {
  type: "topup" | "payment" | "refund";
  amount: number;
  date: string;
  orderId?: string;
  baristaid?: string;
}
import { QRCodeSVG } from "qrcode.react";
import { CAFE_ADDRESS } from "@/lib/constants";
import FeedbackForm from "@/components/FeedbackForm";

const WISDOMS = [
  "Дают — бери, не дают — отбери",
  "Одна ошибка и ты ошибся",
  "Школа не сцепление, можно и кинуть",
  "Если жизнь — это вызов, то я перезвоню",
  "Не знаешь, как поступить — поступи как знаешь",
  "Взял нож — режь, взял дошик — ешь",
  "Если заблудился в лесу, иди домой",
  "В жизни всегда есть две дороги: одна — первая, а другая — вторая",
  "Никогда не сдавайтесь, идите к своей цели! А если будет сложно — сдавайтесь",
  "Настоящий мужчина, как ковёр тёти Зины — с каждым годом лысеет",
  "Не будьте эгоистами, в первую очередь думайте о себе!",
  "Жи-ши пиши от души",
  "Без подошвы тапочки — это просто тряпочки",
  "Если тебе где-то не рады в рваных носках, то и в целых туда идти не стоит",
  "Если закрыть глаза, становится темно",
  "Тут — это вам не там",
];

function getAlmatyDay(): number {
  return Math.floor((Date.now() + 5 * 3600000) / 86400000);
}

function getWisdomKey(uid: string) { return `oic_wisdom_${uid}`; }
function getRevealedKey(uid: string) { return `oic_wisdom_revealed_${uid}`; }

function getWisdomState(uid: string): { seen: number[]; current: number; day: number } {
  try {
    const raw = localStorage.getItem(getWisdomKey(uid));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { seen: [], current: -1, day: 0 };
}

function saveWisdomState(uid: string, state: { seen: number[]; current: number; day: number }) {
  localStorage.setItem(getWisdomKey(uid), JSON.stringify(state));
}

function pickTodayWisdom(uid: string): number {
  const today = getAlmatyDay();
  const state = getWisdomState(uid);

  if (state.day === today && state.current >= 0) return state.current;

  let unseen = WISDOMS.map((_, i) => i).filter(i => !state.seen.includes(i));
  if (unseen.length === 0) { unseen = WISDOMS.map((_, i) => i); state.seen = []; }

  // Seed random by uid + day for consistent-per-user randomness
  const seed = uid.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + today;
  const pick = unseen[seed % unseen.length];
  state.seen.push(pick);
  state.current = pick;
  state.day = today;
  saveWisdomState(uid, state);
  return pick;
}

function WisdomOfTheDay({ uid }: { uid: string }) {
  const [idx, setIdx] = useState(-1);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setIdx(pickTodayWisdom(uid));
    try {
      const r = localStorage.getItem(getRevealedKey(uid));
      if (r === String(getAlmatyDay())) setRevealed(true);
    } catch { /* ignore */ }
  }, [uid]);

  const reveal = () => {
    setRevealed(true);
    localStorage.setItem(getRevealedKey(uid), String(getAlmatyDay()));
  };

  if (idx < 0) return null;

  return (
    <motion.div
      whileTap={!revealed ? { scale: 0.97 } : undefined}
      onClick={!revealed ? reveal : undefined}
      className={`bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4 ${!revealed ? "cursor-pointer" : ""}`}
      style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}
    >
      <p className="text-xs text-brand-text/40 mb-2">🧠 Мудрость дня</p>
      {revealed ? (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-brand-text font-medium italic"
        >
          &ldquo;{WISDOMS[idx]}&rdquo;
        </motion.p>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-brand-text/60">Нажми чтобы узнать...</p>
          <span className="text-lg">🎁</span>
        </div>
      )}
    </motion.div>
  );
}

function PushStatus({ uid }: { uid: string }) {
  const [status, setStatus] = useState<"loading" | "granted" | "denied" | "off">("loading");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) { setStatus("denied"); return; }
    if (Notification.permission === "granted") {
      // Check if token exists in Firestore
      import("firebase/firestore").then(({ getDoc, doc: docRef }) => {
        const db = getFirebaseDb();
        getDoc(docRef(db, "push_tokens", uid)).then(snap => {
          setStatus(snap.exists() && snap.data().token ? "granted" : "off");
        }).catch(() => setStatus("off"));
      });
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    } else {
      setStatus("off");
    }
  }, [uid]);

  const handleToggle = async () => {
    if (status === "denied") return;
    setToggling(true);
    if (status === "granted") {
      // Deactivate — delete token from Firestore
      try {
        const { deleteDoc, doc: docRef } = await import("firebase/firestore");
        await deleteDoc(docRef(getFirebaseDb(), "push_tokens", uid));
        setStatus("off");
      } catch { /* ignore */ }
    } else {
      // Activate — request permission + save token
      try {
        const { requestPushPermission } = await import("@/lib/push");
        const ok = await requestPushPermission(uid);
        setStatus(ok ? "granted" : "denied");
      } catch {
        setStatus("denied");
      }
    }
    setToggling(false);
  };

  if (status === "loading") return null;

  return (
    <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4 flex items-center justify-between" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{status === "granted" ? "🔔" : status === "denied" ? "🔕" : "🔇"}</span>
        <div>
          <p className="text-sm font-bold text-brand-text">Push-уведомления</p>
          <p className="text-[10px] text-brand-text/40">
            {status === "granted" && "Активны — ты получаешь уведомления"}
            {status === "off" && "Выключены — включи чтобы знать когда кофе готов"}
            {status === "denied" && "Заблокированы в браузере — разреши в настройках"}
          </p>
        </div>
      </div>
      {status !== "denied" && (
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${
            status === "granted" ? "bg-brand-mint" : "bg-gray-200"
          } ${toggling ? "opacity-50" : ""}`}
        >
          <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
            status === "granted" ? "translate-x-5" : ""
          }`} />
        </button>
      )}
    </div>
  );
}

function BaristaGuide() {
  const [open, setOpen] = useState(false);

  const sections = [
    {
      title: "📋 Заказы",
      items: [
        "Новые заказы появляются автоматически",
        "Нажми время (5/10/15/20 мин) чтобы принять",
        "«☕ Готово» — когда напиток готов",
        "«💵 Получил оплату» или «✓ Выдано» — завершить",
        "Красная кнопка ✕ — отменить заказ с причиной",
        "Кнопка «🟢 Открыто / 🔴 Закрыто» — статус кофейни",
      ],
    },
    {
      title: "📝 Меню",
      items: [
        "Вкладка «Стоп» — выключай то, что закончилось",
        "Отдельно: альтернативное молоко (овсяное, кокосовое, миндальное)",
        "Вкладка «Популярное» — выбирай что показывать клиентам первым",
        "Вкладка «Все» — редактирование позиций, поиск, добавление",
      ],
    },
    {
      title: "💳 Депозиты",
      items: [
        "Найди клиента по номеру телефона или UID",
        "Введи сумму и нажми «Пополнить»",
        "Клиент увидит баланс в профиле",
      ],
    },
    {
      title: "💰 Бонусы",
      items: [
        "+5₸ за каждый выданный заказ (кроме бесплатных по лояльности)",
        "Бонусы копятся автоматически",
        "Нажми «Запросить выплату» — CEO увидит и одобрит",
      ],
    },
    {
      title: "🍪 Печенька дня",
      items: [
        "Если клиент говорит «у меня есть печенька» — проверь заказ",
        "На карточке готового заказа появится баннер 🍪",
        "Нажми «Выдал ✓» после выдачи печеньки",
      ],
    },
    {
      title: "❤️ Лайки",
      items: [
        "Клиенты тапают на баристов в сцене — летят сердечки",
        "Количество сердечек за день видно в профиле",
      ],
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#d0f0e0] mb-4 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <span className="font-bold text-sm text-brand-text">Инструкция баристы</span>
        </div>
        <span className={`text-brand-text/40 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-4 pb-4"
        >
          <div className="space-y-4">
            {sections.map((sec) => (
              <div key={sec.title}>
                <p className="font-bold text-sm text-brand-dark mb-1.5">{sec.title}</p>
                <ul className="space-y-1">
                  {sec.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-brand-text/60">
                      <span className="text-brand-mint mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-brand-bg rounded-xl p-3">
            <p className="text-[10px] text-brand-text/40 text-center">
              Есть вопросы? Спроси CEO или напиши в чат команды
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [loyaltyCount, setLoyaltyCount] = useState(0);
  const [geoPermission, setGeoPermission] = useState<boolean | null>(null); // null = loading
  const [showGeoPrompt, setShowGeoPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [depositBalance, setDepositBalance] = useState(0);
  const [depositHistory, setDepositHistory] = useState<DepositHistoryEntry[]>([]);
  const [bonus, setBonus] = useState<BonusData | null>(null);
  const [heartsToday, setHeartsToday] = useState(0);
  const [cookiesCount, setCookiesCount] = useState(0);
  const [pendingCookie, setPendingCookie] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const unsubs: Array<() => void> = [];
    unsubs.push(onSnapshot(doc(getFirebaseDb(), "users", user.uid), (snap) => {
      if (cancelled || !snap.exists()) return;
      setStreak(snap.data().streak ?? 0);
      setLoyaltyCount(snap.data().loyaltyCount ?? 0);
      setGeoPermission(snap.data().geolocationAllowed ?? false);
      setCookiesCount(snap.data().cookiesCount ?? 0);
      setPendingCookie(snap.data().pendingCookie ?? false);
    }, () => {}));
    unsubs.push(onSnapshot(doc(getFirebaseDb(), "deposits", user.uid), (snap) => {
      if (cancelled || !snap.exists()) return;
      setDepositBalance(snap.data().balance ?? 0);
      setDepositHistory((snap.data().history ?? []) as DepositHistoryEntry[]);
    }, () => {}));
    if (user.role === "barista" || user.role === "ceo") {
      unsubs.push(onSnapshot(doc(getFirebaseDb(), "barista_bonuses", user.uid), (snap) => {
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        setBonus({ totalBonus: d.totalBonus ?? 0, pendingPayout: d.pendingPayout ?? 0, payoutRequested: d.payoutRequested ?? false });
      }, () => {}));
      const today = new Date().toISOString().slice(0, 10);
      getDoc(doc(getFirebaseDb(), "users", user.uid)).then(async (userSnap) => {
        if (cancelled) return;
        const character = userSnap.exists() ? userSnap.data().baristaCharacter : null;
        if (character === "vitaliy" || character === "aslan") {
          const snap = await getDoc(doc(getFirebaseDb(), "barista_hearts", `${character}_${today}`));
          if (cancelled) return;
          setHeartsToday(snap.exists() ? snap.data().count ?? 0 : 0);
        } else {
          const [vSnap, aSnap] = await Promise.all([
            getDoc(doc(getFirebaseDb(), "barista_hearts", `vitaliy_${today}`)),
            getDoc(doc(getFirebaseDb(), "barista_hearts", `aslan_${today}`)),
          ]);
          if (cancelled) return;
          setHeartsToday((vSnap.exists() ? vSnap.data().count ?? 0 : 0) + (aSnap.exists() ? aSnap.data().count ?? 0 : 0));
        }
      }).catch(() => {});
    }
    return () => { cancelled = true; unsubs.forEach(u => u()); };
  }, [user, user?.role]);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const handleSignOut = () => {
    signOut();
    router.replace("/");
  };

  const requestGeo = useCallback(async () => {
    try {
      const result = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      setGeoPermission(true);
      setShowGeoPrompt(false);
      if (user) {
        await updateDoc(doc(getFirebaseDb(), "users", user.uid), { geolocationAllowed: true }).catch(() => {});
      }
      // Also request push permission while we have user attention
      if (user) {
        import("@/lib/push").then(({ requestPushPermission }) => {
          requestPushPermission(user.uid).catch(() => {});
        });
      }
    } catch {
      setShowGeoPrompt(false);
    }
  }, [user]);

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">👤 Профиль</h1>

        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-6 space-y-4 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          {user && (
            <>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {user.role === "barista" ? (
                  <div className="w-16 h-16 rounded-full bg-[#f5e0c8] flex items-center justify-center flex-shrink-0 border-2 border-[#d4a574]">
                    <svg viewBox="0 0 64 64" width="48" height="48">
                      {/* Civet cat (kopi luwak) */}
                      {/* Body */}
                      <ellipse cx="32" cy="38" rx="16" ry="12" fill="#8B6914" />
                      <ellipse cx="32" cy="40" rx="14" ry="10" fill="#A0782C" />
                      {/* Dark stripe on back */}
                      <ellipse cx="32" cy="36" rx="10" ry="4" fill="#6B4E0E" opacity="0.4" />
                      {/* Head */}
                      <circle cx="32" cy="22" r="10" fill="#A0782C" />
                      {/* Ears */}
                      <ellipse cx="24" cy="14" rx="4" ry="5" fill="#8B6914" />
                      <ellipse cx="40" cy="14" rx="4" ry="5" fill="#8B6914" />
                      <ellipse cx="24" cy="14" rx="2.5" ry="3" fill="#D4A574" />
                      <ellipse cx="40" cy="14" rx="2.5" ry="3" fill="#D4A574" />
                      {/* Face mask */}
                      <ellipse cx="32" cy="24" rx="6" ry="4" fill="#D4C4A0" />
                      {/* Eyes */}
                      <circle cx="28" cy="20" r="2.5" fill="#1a1a1a" />
                      <circle cx="36" cy="20" r="2.5" fill="#1a1a1a" />
                      <circle cx="29" cy="19" r="0.8" fill="#fff" />
                      <circle cx="37" cy="19" r="0.8" fill="#fff" />
                      {/* Nose */}
                      <ellipse cx="32" cy="24" rx="2" ry="1.5" fill="#5C2E0E" />
                      {/* Whiskers */}
                      <line x1="22" y1="23" x2="28" y2="24" stroke="#6B4E0E" strokeWidth="0.5" />
                      <line x1="22" y1="25" x2="28" y2="25" stroke="#6B4E0E" strokeWidth="0.5" />
                      <line x1="42" y1="23" x2="36" y2="24" stroke="#6B4E0E" strokeWidth="0.5" />
                      <line x1="42" y1="25" x2="36" y2="25" stroke="#6B4E0E" strokeWidth="0.5" />
                      {/* Tail */}
                      <path d="M48,38 Q56,30 52,22" stroke="#8B6914" strokeWidth="3" fill="none" strokeLinecap="round" />
                      {/* Coffee bean near paw */}
                      <ellipse cx="22" cy="48" rx="4" ry="3" fill="#5C2E0E" />
                      <line x1="22" y1="45" x2="22" y2="51" stroke="#3a1a08" strokeWidth="0.8" />
                    </svg>
                  </div>
                ) : user.role === "ceo" ? (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-dark to-brand-mid flex items-center justify-center flex-shrink-0 text-3xl">
                    👑
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0 border-2 border-[#d0f0e0] text-3xl">
                    ☕
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg text-brand-dark">{user.displayName}</p>
                  <p className="text-sm text-brand-text/60">
                    {user.role === "barista" ? "🧑‍🍳 Бариста · Копи-лувак" : user.role === "ceo" ? "👑 CEO" : "☕ Клиент"}
                  </p>
                </div>
              </div>
              {user.role === "client" && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-brand-text/50">Стрик</p>
                    <p className="font-bold text-lg">{streak > 0 ? `🔥 ${streak} дней` : "—"}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-brand-text/50">Лояльность</p>
                    <p className="font-bold text-lg">{loyaltyCount}/8 ☕</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Barista Guide */}
        {user && (user.role === "barista" || user.role === "ceo") && (
          <BaristaGuide />
        )}

        {/* Cookies */}
        {user && user.role === "client" && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-brand-text/50">🍪 Мои печеньки</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-brand-dark">Собрано: {cookiesCount}</span>
                {pendingCookie && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Ожидает 🟡</span>
                )}
              </div>
            </div>
            {pendingCookie ? (
              <p className="text-xs text-yellow-600">Скажи баристе «у меня есть печенька» при заказе</p>
            ) : (
              <p className="text-xs text-brand-text/40">Найди печеньку в меню каждый день →</p>
            )}
          </div>
        )}

        {/* Barista bonuses */}
        {user && (user.role === "barista" || user.role === "ceo") && bonus && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <p className="text-xs text-brand-text/50 mb-2">💰 Мои бонусы</p>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-2xl font-bold text-brand-dark">{bonus.pendingPayout.toLocaleString("ru-RU")}₸</p>
                <p className="text-xs text-brand-text/40">к выплате</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-brand-text/60">{bonus.totalBonus.toLocaleString("ru-RU")}₸</p>
                <p className="text-xs text-brand-text/40">всего заработано</p>
              </div>
            </div>
            {bonus.pendingPayout > 0 && !bonus.payoutRequested && (
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  if (!user) return;
                  await updateDoc(doc(getFirebaseDb(), "barista_bonuses", user.uid), { payoutRequested: true }).catch(() => {});
                }}
                className="w-full py-2.5 bg-brand-dark text-white font-bold rounded-xl text-sm min-h-[44px]">
                Запросить выплату
              </motion.button>
            )}
            {bonus.payoutRequested && (
              <div className="bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-2 rounded-xl text-center">
                ⏳ Запрос на выплату отправлен CEO
              </div>
            )}
            <a href="/barista/bonuses" className="block text-center text-xs text-brand-dark font-medium mt-2 min-h-[44px] leading-[44px]">
              Подробнее →
            </a>
          </div>
        )}

        {/* Hearts counter */}
        {user && (user.role === "barista" || user.role === "ceo") && heartsToday > 0 && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4 flex items-center justify-between" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <div>
              <p className="text-xs text-brand-text/50">Сердечки сегодня</p>
              <p className="text-2xl font-bold text-brand-dark">❤️ {heartsToday}</p>
            </div>
            <p className="text-xs text-brand-text/40 max-w-[140px] text-right">Клиенты нажимают на тебя в сцене</p>
          </div>
        )}

        {/* Deposit balance + QR — only for clients */}
        {user && user.role === "client" && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-6 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-brand-text/50">Депозит</p>
                <p className="text-2xl font-bold text-brand-dark">{depositBalance}₸</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#d0f0e0]">
                <QRCodeSVG value={`oic:deposit:${user.uid}`} size={64} bgColor="#ffffff" fgColor="#1a7a44" level="M" />
              </div>
            </div>
            <p className="text-xs text-brand-text/40">Покажи QR баристе для пополнения</p>
            {depositHistory.length > 0 && (
              <div className="mt-4 border-t border-[#d0f0e0] pt-3">
                <p className="text-xs text-brand-text/50 mb-2">История</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {depositHistory.slice().reverse().slice(0, 10).map((h, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-brand-text/60">
                        {h.type === "topup" ? "Пополнение" : h.type === "payment" ? "Оплата" : "Возврат"}
                        <span className="text-brand-text/30 ml-1">{new Date(h.date).toLocaleDateString("ru")}</span>
                      </span>
                      <span className={`font-bold ${h.type === "topup" || h.type === "refund" ? "text-green-600" : "text-brand-pink"}`}>
                        {h.type === "topup" || h.type === "refund" ? "+" : "−"}{h.amount}₸
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Push notification status */}
        {user && <PushStatus uid={user.uid} />}

        {/* Wisdom of the day */}
        {user && <WisdomOfTheDay uid={user.uid} />}

        {/* Geo permission — hide while loading (null) */}
        {geoPermission === false && !showGeoPrompt && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGeoPrompt(true)}
            className="w-full bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4 text-left"
            style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}
          >
            <p className="font-bold text-brand-text text-sm">📍 Узнай когда кофейня рядом</p>
            <p className="text-xs text-brand-text/50 mt-1">Получай уведомления когда ты в 300м от кофейни</p>
          </motion.button>
        )}
        {showGeoPrompt && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-6 mb-4 text-center" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <p className="text-4xl mb-3">📍</p>
            <p className="font-bold text-brand-text mb-2">Узнай когда кофейня рядом</p>
            <p className="text-sm text-brand-text/50 mb-4">Мы покажем расстояние до кофейни и напомним когда ты близко</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={requestGeo}
              className="px-6 py-3 bg-brand-dark text-white rounded-full font-bold text-sm">Разрешить</motion.button>
          </motion.div>
        )}

        {geoPermission === true && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <span className="text-green-500 text-xl">✅</span>
            <div>
              <p className="font-bold text-brand-text text-sm">Геолокация включена</p>
              <p className="text-xs text-brand-text/50">{CAFE_ADDRESS}</p>
            </div>
          </div>
        )}

        {/* Карта кофейни */}
        <div className="bg-white rounded-2xl border border-[#d0f0e0] overflow-hidden mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <div className="px-4 pt-4 pb-2">
            <p className="font-bold text-brand-text text-sm">📍 Где мы находимся</p>
            <p className="text-xs text-brand-text/50 mt-0.5">{CAFE_ADDRESS}</p>
          </div>
          <div className="relative w-full" style={{ height: 200 }}>
            <iframe
              title="Карта кофейни Love is Coffee"
              src="https://www.openstreetmap.org/export/embed.html?bbox=76.9465%2C43.2306%2C76.9545%2C43.2346&layer=mapnik&marker=43.2326%2C76.9505"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-brand-text/40">Пн–Вс · 07:30–22:00</p>
            <a
              href="https://2gis.kz/almaty/geo/70000001075145918"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-brand-dark"
            >
              Открыть в 2ГИС →
            </a>
          </div>
        </div>

        {/* iOS PWA banner */}
        {isIOS && !isPWA && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4 text-center">
            <p className="text-sm font-medium text-blue-700">Установи приложение на главный экран для пуш-уведомлений</p>
            <p className="text-xs text-blue-500 mt-1">{"Нажми \"Поделиться\" \u2192 \"На экран Домой\""}</p>
          </div>
        )}

        {/* Feedback form — для всех ролей */}
        {user && <FeedbackForm />}

        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSignOut}
            className="w-full py-3 rounded-xl bg-brand-pink/10 text-brand-pink font-semibold text-sm">
            Выйти
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
