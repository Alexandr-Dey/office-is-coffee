"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { CAFE_LAT, CAFE_LNG, getDistanceM } from "@/lib/constants";

const NEARBY_RADIUS_M = 100;
const SESSION_KEY = "oic_nearby_notified";

/**
 * Следит за геолокацией. Когда пользователь оказывается ближе 100м
 * к кофейне — показывает локальную нотификацию (один раз за сессию).
 * Работает если браузер уже дал разрешение на геолокацию.
 * Пуш-нотификация показывается если Notification permission granted.
 */
export default function NearbyNotifier() {
  const { user } = useAuth();
  const notified = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (!("geolocation" in navigator)) return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      notified.current = true;
      return;
    }

    // Проверяем разрешение на геолокацию через Permissions API
    // Если уже granted — запускаем watch без промпта
    let watchId: number | null = null;

    const startWatch = () => {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (notified.current) return;

          const dist = getDistanceM(
            pos.coords.latitude,
            pos.coords.longitude,
            CAFE_LAT,
            CAFE_LNG,
          );

          if (dist <= NEARBY_RADIUS_M) {
            notified.current = true;
            sessionStorage.setItem(SESSION_KEY, "1");

            // Пуш если разрешён
            if ("Notification" in window && Notification.permission === "granted") {
              if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification("☕ Love is Coffee рядом!", {
                    body: "Закажи кофе заранее — будет готов к твоему приходу",
                    icon: "/icon-192.png",
                    badge: "/icon-192.png",
                    tag: "nearby",
                    data: { url: "/menu" },
                  });
                }).catch(() => {});
              } else {
                new Notification("☕ Love is Coffee рядом!", {
                  body: "Закажи кофе заранее — будет готов к твоему приходу",
                  icon: "/icon-192.png",
                  tag: "nearby",
                });
              }
            }
          }
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 },
      );
    };

    if (typeof navigator.permissions !== "undefined") {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          startWatch();
        }
        // prompt/denied — не запускаем, не спамим промптом
      }).catch(() => {
        // Safari: permissions.query не поддерживает geolocation
        // Пробуем watch — если разрешение уже есть, заработает
        startWatch();
      });
    } else {
      startWatch();
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  return null;
}
