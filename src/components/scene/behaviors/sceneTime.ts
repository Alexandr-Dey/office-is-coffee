export type TimeOfDay = "night" | "dawn" | "morning" | "day" | "evening" | "dusk";

export function getAlmatyHour(): number {
  return (new Date().getUTCHours() + 5) % 24;
}

export function getTimeOfDay(): TimeOfDay {
  const h = getAlmatyHour();
  if (h >= 22 || h < 5) return "night";
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 10) return "morning";
  if (h >= 10 && h < 17) return "day";
  if (h >= 17 && h < 19) return "evening";
  return "dusk"; // 19-22
}

export function isWorkingHours(): boolean {
  const h = getAlmatyHour();
  return h >= 8 && h < 19; // 08:00 - 18:30 roughly
}

export function getSceneHour(): number {
  return typeof window !== "undefined" ? getAlmatyHour() : 12;
}

export function isNightTime(hour?: number): boolean {
  const h = hour ?? getSceneHour();
  return h >= 22 || h < 6;
}

export function daysSinceOrder(lastDate: string | null): number {
  if (!lastDate) return 999;
  const now = new Date();
  const last = new Date(lastDate + "T00:00:00+05:00");
  return Math.floor((now.getTime() - last.getTime()) / 86400000);
}
