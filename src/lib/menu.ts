// ═══ MENU DATA — Office is Coffee ═══
// Хардкод меню. На Firestore переедем отдельной задачей.

export type Size = 'S' | 'M' | 'L';

export type CategoryId =
  | 'coffee_classic'
  | 'coffee_author'
  | 'ice_coffee'
  | 'tea_home'
  | 'tea_author'
  | 'matcha'
  | 'ice_tea'
  | 'lemonade'
  | 'fresh'
  | 'smoothie'
  | 'milkshake';

export type ModifierGroup = 'milk' | 'syrup' | 'addon';

export interface Modifier {
  id: string;
  name: string;
  price: number;
  group: ModifierGroup;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryId;
  prices: Partial<Record<Size, number>>;
  description?: string;
  countsForLoyalty: boolean;
  imageUrl?: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  gradient: 'green' | 'pink' | 'blue' | 'orange';
  sizes: Size[];
  allowedModifierGroups: ModifierGroup[];
}

export const SIZE_LABELS: Record<Size, string> = {
  S: '250 мл',
  M: '350 мл',
  L: '450 мл',
};

// ═══ GRADIENT MAP — насыщенные, для иконок/heroes ═══
export const GRADIENT_CLASSES: Record<Category['gradient'], string> = {
  green: 'from-[#1a7a44] to-[#2d9e5a]',
  pink: 'from-[#d42b4f] to-[#e85d7a]',
  blue: 'from-[#0369a1] to-[#0ea5e9]',
  orange: 'from-[#f97316] to-[#fb923c]',
};

// ═══ PASTEL TINTS — едва заметные оттенки фона карточек ═══
export const PASTEL_BG: Record<Category['gradient'], string> = {
  green: 'bg-[#f0faf3]',  // едва-зелёный
  pink: 'bg-[#fdf2f4]',   // едва-розовый
  blue: 'bg-[#eff8fc]',   // едва-голубой
  orange: 'bg-[#fff5ec]', // едва-персиковый
};

export const PASTEL_BORDER: Record<Category['gradient'], string> = {
  green: 'border-[#d0f0e0]',
  pink: 'border-[#f5d8de]',
  blue: 'border-[#cfe5f0]',
  orange: 'border-[#fadcc0]',
};

// ═══ CATEGORIES ═══
export const CATEGORIES: Category[] = [
  { id: 'coffee_classic', name: 'Кофейная классика', gradient: 'green',  sizes: ['S','M','L'], allowedModifierGroups: ['milk','syrup'] },
  { id: 'coffee_author',  name: 'Авторский кофе',    gradient: 'pink',   sizes: ['S','M'],     allowedModifierGroups: ['milk','syrup'] },
  { id: 'ice_coffee',     name: 'Айс кофе',          gradient: 'blue',   sizes: ['M','L'],     allowedModifierGroups: ['milk','syrup'] },
  { id: 'tea_home',       name: 'Домашний чай',      gradient: 'green',  sizes: ['M','L'],     allowedModifierGroups: ['syrup','addon'] },
  { id: 'tea_author',     name: 'Авторский чай',     gradient: 'pink',   sizes: ['M','L'],     allowedModifierGroups: ['syrup','addon'] },
  { id: 'matcha',         name: 'Матча',             gradient: 'green',  sizes: ['M','L'],     allowedModifierGroups: ['syrup','addon'] },
  { id: 'ice_tea',        name: 'Айс ти',            gradient: 'blue',   sizes: ['M'],         allowedModifierGroups: ['syrup','addon'] },
  { id: 'lemonade',       name: 'Лимонады',          gradient: 'orange', sizes: ['M'],         allowedModifierGroups: [] },
  { id: 'fresh',          name: 'Фреши',             gradient: 'orange', sizes: ['M'],         allowedModifierGroups: [] },
  { id: 'smoothie',       name: 'Смузи',             gradient: 'orange', sizes: ['M'],         allowedModifierGroups: [] },
  { id: 'milkshake',      name: 'Молочные коктейли', gradient: 'orange', sizes: ['M'],         allowedModifierGroups: ['syrup'] },
];

// ═══ MODIFIERS ═══
export const MODIFIERS: Modifier[] = [
  // Альтернативное молоко (500₸)
  { id: 'milk_coconut', name: 'Кокосовое молоко',  price: 500, group: 'milk' },
  { id: 'milk_almond',  name: 'Миндальное молоко', price: 500, group: 'milk' },
  { id: 'milk_nut',     name: 'Ореховое молоко',   price: 500, group: 'milk' },
  { id: 'milk_oat',     name: 'Овсяное молоко',    price: 500, group: 'milk' },
  { id: 'milk_banana',  name: 'Банановое молоко',  price: 500, group: 'milk' },

  // Сиропы (250₸)
  { id: 'syrup_vanilla',         name: 'Ванильный',        price: 250, group: 'syrup' },
  { id: 'syrup_caramel',         name: 'Карамельный',      price: 250, group: 'syrup' },
  { id: 'syrup_salted_caramel',  name: 'Солёная карамель', price: 250, group: 'syrup' },
  { id: 'syrup_hazelnut',        name: 'Лесной орех',      price: 250, group: 'syrup' },
  { id: 'syrup_coconut',         name: 'Кокосовый',        price: 250, group: 'syrup' },
  { id: 'syrup_lavender',        name: 'Лавандовый',       price: 250, group: 'syrup' },
  { id: 'syrup_chocolate',       name: 'Шоколадный',       price: 250, group: 'syrup' },
  { id: 'syrup_irish_cream',     name: 'Айриш крим',       price: 250, group: 'syrup' },
  { id: 'syrup_cinnamon',        name: 'Корица',           price: 250, group: 'syrup' },
  { id: 'syrup_amaretto',        name: 'Амаретто',         price: 250, group: 'syrup' },
  { id: 'syrup_pistachio',       name: 'Фисташковый',      price: 250, group: 'syrup' },
  { id: 'syrup_maple',           name: 'Кленовый',         price: 250, group: 'syrup' },
  { id: 'syrup_tiramisu',        name: 'Тирамису',         price: 250, group: 'syrup' },
  { id: 'syrup_white_chocolate', name: 'Белый шоколад',    price: 250, group: 'syrup' },
  { id: 'syrup_passion_fruit',   name: 'Маракуйя',         price: 250, group: 'syrup' },

  // Добавки (250₸)
  { id: 'honey', name: 'Мёд', price: 250, group: 'addon' },
];

// ═══ MENU ITEMS ═══
export const MENU_ITEMS: MenuItem[] = [
  // Кофейная классика
  { id: 'americano',      name: 'Американо',  category: 'coffee_classic', prices: { S: 850, M: 950,  L: 1050  }, countsForLoyalty: true },
  { id: 'cappuccino',     name: 'Капучино',   category: 'coffee_classic', prices: { S: 1000, M: 1200, L: 1300 }, countsForLoyalty: true },
  { id: 'latte',          name: 'Латте',      category: 'coffee_classic', prices: { S: 1050, M: 1200, L: 1300 }, countsForLoyalty: true },
  { id: 'espresso',       name: 'Эспрессо',   category: 'coffee_classic', prices: { S: 550,  M: 650 },           countsForLoyalty: true },
  { id: 'flat_white',     name: 'Флэт уайт',  category: 'coffee_classic', prices: { S: 1150, M: 1300, L: 1400 }, countsForLoyalty: true },

  // Авторский кофе (только S/M)
  { id: 'irish_coffee',     name: 'Айриш кофе',         category: 'coffee_author', prices: { S: 1600, M: 1400 }, countsForLoyalty: true },
  { id: 'raf_honey',        name: 'Раф медовый',        category: 'coffee_author', prices: { S: 1600, M: 1400 }, countsForLoyalty: true },
  { id: 'raf',              name: 'Раф',                category: 'coffee_author', prices: { S: 1600, M: 1400 }, countsForLoyalty: true },
  { id: 'raf_banana_caramel', name: 'Раф банан-карамель', category: 'coffee_author', prices: { S: 1500, M: 1300 }, countsForLoyalty: true },
  { id: 'ginger_spice_latte', name: 'Имбирно-пряный латте', category: 'coffee_author', prices: { S: 1550, M: 1450 }, countsForLoyalty: true },
  { id: 'mocha',            name: 'Мокко',              category: 'coffee_author', prices: { S: 1450 }, countsForLoyalty: true },
  { id: 'lavender_raf',     name: 'Лавандовый раф',     category: 'coffee_author', prices: { S: 1450 }, countsForLoyalty: true },

  // Айс кофе
  { id: 'ice_americano',  name: 'Айс американо',    category: 'ice_coffee', prices: { M: 1150, L: 1350 }, countsForLoyalty: true },
  { id: 'ice_cappuccino', name: 'Айс капучино',     category: 'ice_coffee', prices: { M: 1450, L: 1650 }, countsForLoyalty: true },
  { id: 'ice_latte',      name: 'Айс латте',        category: 'ice_coffee', prices: { M: 1350, L: 1450 }, countsForLoyalty: true },
  { id: 'frappuccino',    name: 'Фраппучино',       category: 'ice_coffee', prices: { M: 1850, L: 2050 }, countsForLoyalty: true },
  { id: 'banana_coffee',  name: 'Банановый кофе',   category: 'ice_coffee', prices: { M: 1650, L: 1850 }, countsForLoyalty: true },
  { id: 'bumble_bee',     name: 'Бамбл би',         category: 'ice_coffee', prices: { M: 1450, L: 1550 }, countsForLoyalty: true },
  { id: 'espresso_tonic', name: 'Эспрессо тоник',   category: 'ice_coffee', prices: { M: 1650, L: 1750 }, countsForLoyalty: true },

  // Домашний чай
  { id: 'tea_nordakai',   name: 'Нордакай',     description: 'Апельсин, лимон, мята',                       category: 'tea_home', prices: { M: 950, L: 1050  }, countsForLoyalty: false },
  { id: 'tea_ginger',     name: 'Имбирный',     description: 'Имбирь, мёд, лимон, апельсин',                category: 'tea_home', prices: { M: 1150 },           countsForLoyalty: false },
  { id: 'tea_seabuckthorn', name: 'Облепиховый', description: 'Облепиха, маракуйя, лимон, апельсин',         category: 'tea_home', prices: { M: 1250, L: 1350 }, countsForLoyalty: false },
  { id: 'tea_raspberry',  name: 'Малиновый',    description: 'Малина, мята, апельсин, лимон',                category: 'tea_home', prices: { M: 1350, L: 1450 }, countsForLoyalty: false },
  { id: 'tea_berry',      name: 'Ягодный',      description: 'Смородина, клюква, лимон',                     category: 'tea_home', prices: { M: 1250, L: 1350 }, countsForLoyalty: false },

  // Авторский чай
  { id: 'tea_latte',      name: 'Чай латте',    description: 'Чай со взбитым молоком и корицей',              category: 'tea_author', prices: { M: 550,  L: 650  }, countsForLoyalty: false },
  { id: 'tea_grog',       name: 'Грог',         description: 'Имбирь, корица, кардамон, апельсин, лимон, мёд', category: 'tea_author', prices: { M: 1150, L: 1250 }, countsForLoyalty: false },
  { id: 'tea_mulled',     name: 'Глинтвейн',    description: 'Апельсин, яблоко, вишнёвый сок, корица',        category: 'tea_author', prices: { M: 1350, L: 1450 }, countsForLoyalty: false },
  { id: 'tea_moroccan',   name: 'Марокканский', description: 'Апельсин, лимон, мята, гвоздика, корица',       category: 'tea_author', prices: { M: 1150, L: 1250 }, countsForLoyalty: false },
  { id: 'tea_spiced_currant', name: 'Пряная смородина', description: 'Смородина, гвоздика, корица',           category: 'tea_author', prices: { M: 1350, L: 1450 }, countsForLoyalty: false },

  // Матча
  { id: 'matcha_berry',     name: 'Ягодная матча',         category: 'matcha', prices: { M: 1250, L: 1350 }, countsForLoyalty: false },
  { id: 'matcha_mango',     name: 'Манго-маракуйя матча',  category: 'matcha', prices: { M: 1350, L: 1450 }, countsForLoyalty: false },
  { id: 'matcha_bumble',    name: 'Бамбл матча',           category: 'matcha', prices: { M: 1450, L: 1650 }, countsForLoyalty: false },
  { id: 'matcha_tonic',     name: 'Матча тоник',           category: 'matcha', prices: { M: 1550, L: 1750 }, countsForLoyalty: false },
  { id: 'matcha_ice',       name: 'Айс матча',             category: 'matcha', prices: { M: 1350, L: 1450 }, countsForLoyalty: false },

  // Айс ти
  { id: 'ice_tea_berry',    name: 'Ягодный',        category: 'ice_tea', prices: { M: 1050 }, countsForLoyalty: false },
  { id: 'ice_tea_mango',    name: 'Манго-маракуйя', category: 'ice_tea', prices: { M: 1050 }, countsForLoyalty: false },
  { id: 'ice_tea_pomegranate', name: 'Гранат',      category: 'ice_tea', prices: { M: 1050 }, countsForLoyalty: false },
  { id: 'ice_tea_raspberry', name: 'Малиновый',     category: 'ice_tea', prices: { M: 1050 }, countsForLoyalty: false },
  { id: 'ice_tea_cherry',   name: 'Вишня',          category: 'ice_tea', prices: { M: 1050 }, countsForLoyalty: false },
  { id: 'ice_tea_lemon',    name: 'Лимонный',       category: 'ice_tea', prices: { M: 1050 }, countsForLoyalty: false },

  // Лимонады
  { id: 'lem_orange',       name: 'Апельсин',           category: 'lemonade', prices: { M: 2050 }, countsForLoyalty: false },
  { id: 'lem_grapefruit',   name: 'Грейпфрут',          category: 'lemonade', prices: { M: 2050 }, countsForLoyalty: false },
  { id: 'lem_apple',        name: 'Яблоко',             category: 'lemonade', prices: { M: 1750 }, countsForLoyalty: false },
  { id: 'lem_orange_grapefruit', name: 'Апельсин-грейпфрут', category: 'lemonade', prices: { M: 1550 }, countsForLoyalty: false },
  { id: 'lem_orange_apple', name: 'Апельсин-яблоко',    category: 'lemonade', prices: { M: 2050 }, countsForLoyalty: false },
  { id: 'lem_apple_grapefruit', name: 'Яблоко-грейпфрут', category: 'lemonade', prices: { M: 1950 }, countsForLoyalty: false },

  // Фреши
  { id: 'fresh_raspberry_passion', name: 'Малина-маракуйя', category: 'fresh', prices: { M: 2250 }, countsForLoyalty: false },
  { id: 'fresh_berry_boom',  name: 'Ягодный бум',           category: 'fresh', prices: { M: 2250 }, countsForLoyalty: false },
  { id: 'fresh_orange',      name: 'Апельсин',              category: 'fresh', prices: { M: 1750 }, countsForLoyalty: false },
  { id: 'fresh_lime_raspberry', name: 'Лайм-малина',        category: 'fresh', prices: { M: 1350 }, countsForLoyalty: false },
  { id: 'fresh_house',       name: 'Домашний',              category: 'fresh', prices: { M: 1450 }, countsForLoyalty: false },
  { id: 'fresh_watermelon_kiwi', name: 'Арбуз-киви',        category: 'fresh', prices: { M: 1350 }, countsForLoyalty: false },
  { id: 'fresh_kiwi',        name: 'Киви',                  category: 'fresh', prices: { M: 1450 }, countsForLoyalty: false },
  { id: 'fresh_mojito',      name: 'Мохито',                category: 'fresh', prices: { M: 1250 }, countsForLoyalty: false },

  // Смузи
  { id: 'smoothie_berry_mix',   name: 'Ягодный микс',     description: 'Смородина, клюква, малина, сливки', category: 'smoothie', prices: { M: 1950 }, countsForLoyalty: false },
  { id: 'smoothie_strawberry_banana', name: 'Клубника-банан', description: 'Клубника, банан, молоко, сливки', category: 'smoothie', prices: { M: 1950 }, countsForLoyalty: false },
  { id: 'smoothie_fruit_mix',   name: 'Фруктовый микс',   description: 'Банан, киви, апельсиновый фреш, яблочный', category: 'smoothie', prices: { M: 2250 }, countsForLoyalty: false },
  { id: 'smoothie_banana_syrup', name: 'Банан-сироп',     description: 'Карамель, ваниль, эспрессо',         category: 'smoothie', prices: { M: 2050 }, countsForLoyalty: false },
  { id: 'smoothie_apple_cranberry', name: 'Яблоко-клюква', description: 'Молоко, банан, яблоко, вишня',      category: 'smoothie', prices: { M: 1450 }, countsForLoyalty: false },

  // Молочные коктейли
  { id: 'shake_banana',     name: 'Банановый',   category: 'milkshake', prices: { M: 1650 }, countsForLoyalty: false },
  { id: 'shake_strawberry', name: 'Клубничный',  category: 'milkshake', prices: { M: 1450 }, countsForLoyalty: false },
  { id: 'shake_chocolate',  name: 'Шоколадный',  category: 'milkshake', prices: { M: 1450 }, countsForLoyalty: false },
  { id: 'shake_vanilla',    name: 'Ванильный',   category: 'milkshake', prices: { M: 1450 }, countsForLoyalty: false },
  { id: 'shake_caramel',    name: 'Карамельный', category: 'milkshake', prices: { M: 1450 }, countsForLoyalty: false },
  { id: 'shake_pistachio',  name: 'Фисташковый', category: 'milkshake', prices: { M: 1450 }, countsForLoyalty: false },
  { id: 'shake_coconut',    name: 'Кокосовый',   category: 'milkshake', prices: { M: 1450 }, countsForLoyalty: false },
];

// ═══ COLD CATEGORIES — сироп бесплатен ═══
export const COLD_CATEGORIES: ReadonlySet<CategoryId> = new Set<CategoryId>([
  'ice_coffee', 'ice_tea', 'lemonade', 'fresh', 'smoothie', 'milkshake',
]);

export function isColdCategory(cat: CategoryId): boolean {
  return COLD_CATEGORIES.has(cat);
}

// ═══ UTILITIES ═══

export function getCategory(id: CategoryId): Category {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) throw new Error(`Unknown category: ${id}`);
  return cat;
}

export function getModifiersForCategory(categoryId: CategoryId): Modifier[] {
  const cat = getCategory(categoryId);
  return MODIFIERS.filter(m => cat.allowedModifierGroups.includes(m.group));
}

export function calculateItemTotal(
  basePrice: number,
  modifiers: Modifier[]
): number {
  return basePrice + modifiers.reduce((sum, m) => sum + m.price, 0);
}

export function getDefaultSize(item: MenuItem): Size {
  const cat = getCategory(item.category);
  const available = cat.sizes.filter(s => item.prices[s] !== undefined);
  return available.includes('M') ? 'M' : available[0];
}

export function getAvailableSizes(item: MenuItem): Size[] {
  const cat = getCategory(item.category);
  return cat.sizes.filter(s => item.prices[s] !== undefined);
}

export function getMinPrice(item: MenuItem): number {
  const prices = Object.values(item.prices).filter((p): p is number => p !== undefined);
  return Math.min(...prices);
}

/** Форматирует цену: 1200 → "1\u00A0200₸" */
export function formatPrice(price: number): string {
  const str = price.toString();
  if (str.length <= 3) return `${str}₸`;
  const parts: string[] = [];
  let remaining = str;
  while (remaining.length > 3) {
    parts.unshift(remaining.slice(-3));
    remaining = remaining.slice(0, -3);
  }
  parts.unshift(remaining);
  return `${parts.join('\u00A0')}₸`;
}

// ═══ STOP-LIST HELPERS ═══

export interface StopList {
  items: string[];
  modifiers: string[];
}

/** Нормализация стоп-листа: если пришёл массив — оборачиваем в объект */
export function normalizeStopList(raw: unknown): StopList {
  if (Array.isArray(raw)) {
    return { items: raw as string[], modifiers: [] };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return {
      items: Array.isArray(obj.items) ? obj.items as string[] : [],
      modifiers: Array.isArray(obj.modifiers) ? obj.modifiers as string[] : [],
    };
  }
  return { items: [], modifiers: [] };
}

// ═══ CART KEY ═══

export function makeCartKey(itemId: string, size: Size, modifierIds: string[]): string {
  return `${itemId}__${size}__${[...modifierIds].sort().join(',')}`;
}
