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
