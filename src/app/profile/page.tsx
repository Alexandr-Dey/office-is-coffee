"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

interface DepositHistoryEntry {
  type: "topup" | "payment" | "refund";
  amount: number;
  date: string;
  orderId?: string;
  baristaid?: string;
}
import { QRCodeSVG } from "qrcode.react";
import { CAFE_ADDRESS } from "@/lib/constants";

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

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(getFirebaseDb(), "users", user.uid), (snap) => {
      if (snap.exists()) {
        setStreak(snap.data().streak ?? 0);
        setLoyaltyCount(snap.data().loyaltyCount ?? 0);
        setGeoPermission(snap.data().geolocationAllowed ?? false);
      }
    }, () => {});
    const unsubDep = onSnapshot(doc(getFirebaseDb(), "deposits", user.uid), (snap) => {
      if (snap.exists()) {
        setDepositBalance(snap.data().balance ?? 0);
        setDepositHistory((snap.data().history ?? []) as DepositHistoryEntry[]);
      }
    }, () => {});
    return () => { unsub(); unsubDep(); };
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
        <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">\uD83D\uDC64 Профиль</h1>

        <div className="bg-white rounded-2xl border border-[#d0f0e0] p-6 space-y-4 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
          {user && (
            <>
              <div>
                <p className="text-xs text-brand-text/50">Имя</p>
                <p className="font-bold text-lg text-brand-dark">{user.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-brand-text/50">Роль</p>
                <p className="font-medium">{user.role === "barista" ? "\uD83E\uDDD1\u200D\uD83C\uDF73 Бариста" : user.role === "ceo" ? "\uD83D\uDC51 CEO" : "\u2615 Клиент"}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-brand-text/50">Стрик</p>
                  <p className="font-bold text-lg">{streak > 0 ? `\uD83D\uDD25 ${streak} дней` : "—"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-brand-text/50">Лояльность</p>
                  <p className="font-bold text-lg">{loyaltyCount}/8 \u2615</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Deposit balance + QR */}
        {user && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-6 mb-4" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-brand-text/50">Депозит</p>
                <p className="text-2xl font-bold text-brand-dark">{depositBalance}\u20B8</p>
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

        {/* Geo permission */}
        {!geoPermission && !showGeoPrompt && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGeoPrompt(true)}
            className="w-full bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4 text-left"
            style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}
          >
            <p className="font-bold text-brand-text text-sm">\uD83D\uDCCD Узнай когда кофейня рядом</p>
            <p className="text-xs text-brand-text/50 mt-1">Получай уведомления когда ты в 300м от кофейни</p>
          </motion.button>
        )}
        {showGeoPrompt && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#d0f0e0] p-6 mb-4 text-center" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <p className="text-4xl mb-3">\uD83D\uDCCD</p>
            <p className="font-bold text-brand-text mb-2">Узнай когда кофейня рядом</p>
            <p className="text-sm text-brand-text/50 mb-4">Мы покажем расстояние до кофейни и напомним когда ты близко</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={requestGeo}
              className="px-6 py-3 bg-brand-dark text-white rounded-full font-bold text-sm">Разрешить</motion.button>
          </motion.div>
        )}

        {geoPermission && (
          <div className="bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            <span className="text-green-500 text-xl">\u2705</span>
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

        {/* Admin link */}
        {user && (user.role === "barista" || user.role === "ceo") && (
          <a href="/admin" className="block bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4 text-center font-bold text-brand-dark text-sm"
            style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            \u2615 Админ-панель
          </a>
        )}
        {user && user.role === "ceo" && (
          <a href="/ceo" className="block bg-white rounded-2xl border border-[#d0f0e0] p-4 mb-4 text-center font-bold text-brand-dark text-sm"
            style={{ boxShadow: "0 2px 8px rgba(30,120,70,0.06)" }}>
            \uD83D\uDC51 CEO Дашборд
          </a>
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
