export const CAFE_LAT = 43.2220;
export const CAFE_LNG = 76.8512;
export const CAFE_RADIUS_M = 300;
export const CAFE_ADDRESS = "ул. Момышулы 14, Аксай";
export const CAFE_TIMEZONE = "Asia/Almaty";

export function getAlmatyDate(): string {
  return new Date().toLocaleString("sv", { timeZone: CAFE_TIMEZONE }).split(" ")[0];
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
