export function getSceneHour(): number {
  return typeof window !== "undefined" ? new Date().getHours() : 12;
}

export function isNightTime(hour?: number): boolean {
  const h = hour ?? getSceneHour();
  return h >= 23 || h < 7;
}

export function daysSinceOrder(lastDate: string | null): number {
  if (!lastDate) return 999;
  const now = new Date();
  const last = new Date(lastDate + "T00:00:00+05:00");
  return Math.floor((now.getTime() - last.getTime()) / 86400000);
}
