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

function WisdomOfTheDay() {
  // Same wisdom all day, changes at midnight Almaty time
  const day = Math.floor((Date.now() + 5 * 3600000) / 86400000);
  const idx = day % WISDOMS.length;

  return (
    <div className="bg-white rounded-2xl border border-[#d0f0e0] p-5 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
      <p className="text-xs text-brand-text/40 mb-2">🧠 Мудрость дня</p>
      <p className="text-sm text-brand-text font-medium italic">&ldquo;{WISDOMS[idx]}&rdquo;</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [loyaltyCount, setLoyaltyCount] = useState(0);
  const [geoPermission, setGeoPermission] = useState(false);
  const [showGeoPrompt, setShowGeoPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [depositBalance, setDepositBalance] = useState(0);
  const [depositHistory, setDepositHistory] = useState<DepositHistoryEntry[]>([]);
  const [bonus, setBonus] = useState<BonusData | null>(null);
  const [heartsToday, setHeartsToday] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubs: Array<() => void> = [];
    unsubs.push(onSnapshot(doc(getFirebaseDb(), "users", user.uid), (snap) => {
      if (snap.exists()) {
        setStreak(snap.data().streak ?? 0);
        setLoyaltyCount(snap.data().loyaltyCount ?? 0);
        setGeoPermission(snap.data().geolocationAllowed ?? false);
      }
    }, () => {}));
    unsubs.push(onSnapshot(doc(getFirebaseDb(), "deposits", user.uid), (snap) => {
      if (snap.exists()) {
        setDepositBalance(snap.data().balance ?? 0);
        setDepositHistory((snap.data().history ?? []) as DepositHistoryEntry[]);
      }
    }, () => {}));
    // Barista bonuses
    if (user.role === "barista" || user.role === "ceo") {
      unsubs.push(onSnapshot(doc(getFirebaseDb(), "barista_bonuses", user.uid), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setBonus({ totalBonus: d.totalBonus ?? 0, pendingPayout: d.pendingPayout ?? 0, payoutRequested: d.payoutRequested ?? false });
        }
      }, () => {}));
      // Hearts today
      const today = new Date().toISOString().slice(0, 10);
      const baristaKey = user.displayName?.toLowerCase().includes("аслан") ? "aslan" : "vitaliy";
      getDoc(doc(getFirebaseDb(), "barista_hearts", `${baristaKey}_${today}`)).then((snap) => {
        if (snap.exists()) setHeartsToday(snap.data().count ?? 0);
      }).catch(() => {});
    }
    return () => unsubs.forEach(u => u());
  }, [user]);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const handleSignOut = () => {
    signOut();
    router.replace("/");
  };

  const requestGeo = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoPermission(true);
        setShowGeoPrompt(false);
        if (user) updateDoc(doc(getFirebaseDb(), "users", user.uid), { geolocationAllowed: true }).catch(() => {});
      },
      () => { setShowGeoPrompt(false); },
    );
  }, [user]);

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-brand-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">👤 Профиль</h1>

        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-6 space-y-4 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          {user && (
            <>
              <div>
                <p className="text-xs text-brand-text/50">Имя</p>
                <p className="font-bold text-lg text-brand-dark">{user.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-brand-text/50">Роль</p>
                <p className="font-medium">{user.role === "barista" ? "🧑‍🍳 Бариста" : user.role === "ceo" ? "👑 CEO" : "☕ Клиент"}</p>
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

        {/* Wisdom of the day */}
        <WisdomOfTheDay />

        {/* Geo permission */}
        {!geoPermission && !showGeoPrompt && (
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

        {geoPermission && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <span className="text-green-500 text-xl">✅</span>
            <div>
              <p className="font-bold text-brand-text text-sm">Геолокация включена</p>
              <p className="text-xs text-brand-text/50">{CAFE_ADDRESS}</p>
            </div>
          </div>
        )}

        {/* iOS PWA banner */}
        {isIOS && !isPWA && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4 text-center">
            <p className="text-sm font-medium text-blue-700">Установи приложение на главный экран для пуш-уведомлений</p>
            <p className="text-xs text-blue-500 mt-1">{"Нажми \"Поделиться\" \u2192 \"На экран Домой\""}</p>
          </div>
        )}

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
