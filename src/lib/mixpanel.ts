// Mixpanel — реальная реализация. Без токена работает как no-op (для билда/SSR).
// Токен: NEXT_PUBLIC_MIXPANEL_TOKEN в Vercel envs.
//
// Lazy init: SDK подгружается только в браузере после первого вызова, чтобы
// не утяжелять initial bundle и не падать в SSR.

import type { OverridedMixpanel } from "mixpanel-browser";

let mp: OverridedMixpanel | null = null;
let initPromise: Promise<OverridedMixpanel | null> | null = null;

function getInstance(): Promise<OverridedMixpanel | null> {
  if (mp) return Promise.resolve(mp);
  if (initPromise) return initPromise;
  if (typeof window === "undefined") return Promise.resolve(null);
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token || token === "undefined") return Promise.resolve(null);

  initPromise = import("mixpanel-browser")
    .then((m) => {
      const lib = m.default;
      lib.init(token, {
        debug: process.env.NODE_ENV !== "production",
        track_pageview: true,
        persistence: "localStorage",
        ignore_dnt: false,
      });
      mp = lib;
      return lib;
    })
    .catch((err) => {
      console.warn("[Mixpanel] init failed, will retry on next call:", err);
      // Сбрасываем promise, чтобы следующий вызов попробовал заново.
      // Иначе сетевой сбой блокировал бы tracking до конца сессии.
      initPromise = null;
      return null;
    });
  return initPromise;
}

export const initMixpanel = (): void => {
  // Прогрев SDK на app load — снижает latency первого trackEvent.
  void getInstance();
};

export const trackEvent = (event: string, properties?: Record<string, unknown>): void => {
  getInstance().then((lib) => {
    if (lib) lib.track(event, properties);
  }).catch(() => {});
};

export const identifyUser = (userId: string, traits?: Record<string, unknown>): void => {
  getInstance().then((lib) => {
    if (!lib) return;
    lib.identify(userId);
    if (traits) lib.people.set(traits);
  }).catch(() => {});
};
