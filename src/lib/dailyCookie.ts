import type { MenuItem } from "./types";
import { COOKIE_FACTS } from "./cookieFacts";

export interface DailyCookie {
  menuItemId: string;
  factId: string;
  date: string;
}

function getAlmatyDate(): string {
  const d = new Date();
  const utc5 = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return utc5.toISOString().slice(0, 10);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return hash;
}

export function getDailyCookie(menuItems: MenuItem[]): DailyCookie | null {
  if (menuItems.length === 0) return null;
  const date = getAlmatyDate();
  const seed = hashCode(date);
  const itemIndex = Math.abs(seed) % menuItems.length;
  const factIndex = Math.abs(seed * 31) % COOKIE_FACTS.length;
  return {
    menuItemId: menuItems[itemIndex].id,
    factId: COOKIE_FACTS[factIndex].id,
    date,
  };
}

export function isCookieCollectedToday(lastCollected: string | null): boolean {
  if (!lastCollected) return false;
  return lastCollected === getAlmatyDate();
}

export { getAlmatyDate as getCookieDate };
