// MenuItem и Category — см. src/lib/menu.ts

export interface CartItem {
  itemId: string;
  name: string;
  category: string;
  size: string;
  basePrice: number;
  modifiers: { id: string; name: string; price: number }[];
  totalPrice: number;
  qty: number;
  cartKey: string;
  // Legacy fields for backward compat with existing orders
  price?: number;
  milk?: string;
  syrup?: string;
}

export type PushSegment = "sleeping" | "streakRisk" | "almostFree" | "vip" | "manual" | "all";

export interface PushLog {
  id: string;
  sentBy: string;
  sentAt: string;
  title: string;
  body: string;
  segment: PushSegment;
  recipientCount: number;
  deliveredCount: number;
  openedCount: number;
  ordersAfterCount: number;
  deadTokensFound: number;
}

export interface PushRecipient {
  uid: string;
  pushToken: string;
  deliveredAt?: string;
  openedAt?: string;
  orderedAt?: string;
}
