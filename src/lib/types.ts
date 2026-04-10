export interface MenuItem {
  id: string;
  category: string;
  name: string;
  ingredients?: string | null;
  sizes: Record<string, number>;
  availableMilk: boolean;
  tags: string[];
  activeFrom?: string | null;
  activeTo?: string | null;
  radarData?: {
    acidity: number;
    sweetness: number;
    bitterness: number;
    body: number;
    aroma: number;
  } | null;
  description?: string | null;
  sortOrder: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  order: number;
}

export interface CartItem {
  name: string;
  size: string;
  price: number;
  qty: number;
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
