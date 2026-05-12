export const CAFE_LAT = 43.2326;
export const CAFE_LNG = 76.9505;
export const CAFE_RADIUS_M = 300;
export const CAFE_ADDRESS = "ул. Назарбаева 226, БанкЦентрКредит";
export const CAFE_TIMEZONE = "Asia/Almaty";

export function getAlmatyDate(): string {
  return new Date().toLocaleString("sv", { timeZone: CAFE_TIMEZONE }).split(" ")[0];
}

// ═══ РАСПИСАНИЕ РАБОТЫ ═══
export const CAFE_OPEN_HOUR = 7;   // 07:30
export const CAFE_OPEN_MIN = 30;
export const CAFE_CLOSE_HOUR = 22; // 22:00
export const CAFE_CLOSE_MIN = 0;

/** Текущий час и минута в Алматы */
export function getAlmatyTime(): { hour: number; min: number } {
  // Intl.DateTimeFormat надёжнее, чем new Date(toLocaleString(...)) —
  // в ICU после Chrome 110 / Node 20 в en-US появился U+202F перед AM/PM,
  // из-за чего Date.parse возвращал Invalid Date и весь магазин показывался закрытым.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAFE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const min = Number(parts.find((p) => p.type === "minute")?.value);
  return { hour, min };
}

/** Должна ли кофейня быть открыта по расписанию */
export function isOpenBySchedule(): boolean {
  const { hour, min } = getAlmatyTime();
  const nowMins = hour * 60 + min;
  const openMins = CAFE_OPEN_HOUR * 60 + CAFE_OPEN_MIN;   // 450
  const closeMins = CAFE_CLOSE_HOUR * 60 + CAFE_CLOSE_MIN; // 1320
  return nowMins >= openMins && nowMins < closeMins;
}

/** Определяет isOpen с учётом ручного override */
export function resolveIsOpen(cafeData: {
  isOpen?: boolean;
  manualOverride?: boolean;
  manualUntil?: string | null;
}): { isOpen: boolean; isManual: boolean } {
  const scheduled = isOpenBySchedule();

  // Если есть ручной override — проверяем не истёк ли он
  if (cafeData.manualOverride && cafeData.manualUntil) {
    const until = new Date(cafeData.manualUntil).getTime();
    if (Date.now() < until) {
      // Override ещё действует
      return { isOpen: cafeData.isOpen ?? scheduled, isManual: true };
    }
    // Override истёк — используем расписание
  }

  return { isOpen: scheduled, isManual: false };
}

export function getDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
