// ═══ MENU DATA — Love is Coffee v2.0 ═══
// Source of truth: подтверждено владельцем 2026-04-22. 73 позиции.
// Размеры S/M/L в коде и хранилище в ВЕРХНЕМ регистре — исторически завязаны заказы.
// Категории: новая конвенция classic_coffee / author_coffee / home_tea / author_tea
// (старые coffee_classic / coffee_author / tea_home / tea_author → см. normalizeCategoryId).

import * as Sentry from "@sentry/nextjs";

export type Size = 'S' | 'M' | 'L';

export type CategoryId =
  | 'classic_coffee'
  | 'author_coffee'
  | 'ice_coffee'
  | 'home_tea'
  | 'author_tea'
  | 'matcha'
  | 'ice_tea'
  | 'smoothie'
  | 'fresh'
  | 'lemonade'
  | 'milkshake';

export type ModifierGroup = 'milk' | 'syrup' | 'honey';

export interface Modifier {
  id: string;
  name: string;
  price: number;
  group: ModifierGroup;
}

export interface ItemAddons {
  milk: boolean;
  syrup: boolean;
  honey: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryId;
  /** Только реально доступные размеры. Если 'M' нет — не подставлять соседний. */
  prices: Partial<Record<Size, number>>;
  addons: ItemAddons;
  /** Переопределяет дефолт по COLD_CATEGORIES. Явный true = горячий, false = холодный. */
  isHot?: boolean;
  composition?: string;
  countsForLoyalty: boolean;
}

export interface Category {
  id: CategoryId;
  name: string;
  gradient: 'green' | 'pink' | 'blue' | 'orange';
  sizes: Size[];
}

export const SIZE_LABELS: Record<Size, string> = {
  S: '250 мл',
  M: '350 мл',
  L: '450 мл',
};

// ═══ GRADIENT MAP ═══
export const GRADIENT_CLASSES: Record<Category['gradient'], string> = {
  green: 'from-[#1a7a44] to-[#2d9e5a]',
  pink: 'from-[#d42b4f] to-[#e85d7a]',
  blue: 'from-[#0369a1] to-[#0ea5e9]',
  orange: 'from-[#f97316] to-[#fb923c]',
};

export const PASTEL_BG: Record<Category['gradient'], string> = {
  green: 'bg-[#f0faf3]',
  pink: 'bg-[#fdf2f4]',
  blue: 'bg-[#eff8fc]',
  orange: 'bg-[#fff5ec]',
};

export const PASTEL_BORDER: Record<Category['gradient'], string> = {
  green: 'border-[#d0f0e0]',
  pink: 'border-[#f5d8de]',
  blue: 'border-[#cfe5f0]',
  orange: 'border-[#fadcc0]',
};

// ═══ CATEGORIES ═══
export const CATEGORIES: Category[] = [
  { id: 'classic_coffee', name: 'Кофейная классика', gradient: 'green',  sizes: ['S','M','L'] },
  { id: 'author_coffee',  name: 'Авторский кофе',    gradient: 'pink',   sizes: ['M','L']     },
  { id: 'ice_coffee',     name: 'Айс кофе',          gradient: 'blue',   sizes: ['M','L']     },
  { id: 'home_tea',       name: 'Домашний чай',      gradient: 'green',  sizes: ['M','L']     },
  { id: 'author_tea',     name: 'Авторский чай',     gradient: 'pink',   sizes: ['M','L']     },
  { id: 'matcha',         name: 'Матча',             gradient: 'green',  sizes: ['M','L']     },
  { id: 'ice_tea',        name: 'Айс ти',            gradient: 'blue',   sizes: ['L']         },
  { id: 'smoothie',       name: 'Смузи',             gradient: 'orange', sizes: ['M','L']     },
  { id: 'fresh',          name: 'Фреши',             gradient: 'orange', sizes: ['M','L']     },
  { id: 'lemonade',       name: 'Лимонады',          gradient: 'orange', sizes: ['L']         },
  { id: 'milkshake',      name: 'Молочные коктейли', gradient: 'orange', sizes: ['L']         },
];

// ═══ MODIFIERS ═══
export const MODIFIERS: Modifier[] = [
  // Альтернативное молоко (+500₸)
  { id: 'milk_coconut', name: 'Кокосовое молоко',  price: 500, group: 'milk' },
  { id: 'milk_almond',  name: 'Миндальное молоко', price: 500, group: 'milk' },
  { id: 'milk_nut',     name: 'Ореховое молоко',   price: 500, group: 'milk' },
  { id: 'milk_oat',     name: 'Овсяное молоко',    price: 500, group: 'milk' },
  { id: 'milk_banana',  name: 'Банановое молоко',  price: 500, group: 'milk' },

  // Сиропы (+250₸)
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

  // Мёд (+250₸)
  { id: 'honey', name: 'Мёд', price: 250, group: 'honey' },
];

// ═══ ADDON PRESETS ═══
const A_ALL_OFF: ItemAddons = { milk: false, syrup: false, honey: false };
const A_MILK_SYRUP: ItemAddons = { milk: true, syrup: true, honey: false };
const A_SYRUP_ONLY: ItemAddons = { milk: false, syrup: true, honey: false };
const A_SYRUP_HONEY: ItemAddons = { milk: false, syrup: true, honey: true };
const A_HONEY_ONLY: ItemAddons = { milk: false, syrup: false, honey: true };

// ═══ MENU ITEMS (v2.0) ═══
export const MENU_ITEMS: MenuItem[] = [
  // Кофейная классика
  { id: 'americano',  name: 'Американо',  category: 'classic_coffee', prices: { S: 850,  M: 950,  L: 1050 }, addons: A_ALL_OFF,     countsForLoyalty: true },
  { id: 'cappuccino', name: 'Капучино',   category: 'classic_coffee', prices: { S: 1000, M: 1200, L: 1300 }, addons: A_MILK_SYRUP,  countsForLoyalty: true },
  { id: 'latte',      name: 'Латте',      category: 'classic_coffee', prices: {         M: 1050, L: 1200 }, addons: A_MILK_SYRUP,  countsForLoyalty: true },
  { id: 'espresso',   name: 'Эспрессо',   category: 'classic_coffee', prices: { S: 550,  M: 650          }, addons: A_ALL_OFF,     countsForLoyalty: true },
  { id: 'flat_white', name: 'Флэт уайт',  category: 'classic_coffee', prices: { S: 1150, M: 1300, L: 1400 }, addons: A_MILK_SYRUP,  countsForLoyalty: true },

  // Авторский кофе (весь — addons off по правилу владельца)
  { id: 'irish_coffee',       name: 'Айриш кофе',           category: 'author_coffee', prices: { M: 1400, L: 1600 }, addons: A_ALL_OFF, countsForLoyalty: true },
  { id: 'raf',                name: 'Раф',                  category: 'author_coffee', prices: { M: 1400, L: 1600 }, addons: A_ALL_OFF, countsForLoyalty: true },
  { id: 'raf_honey',          name: 'Раф медовый',          category: 'author_coffee', prices: { M: 1400, L: 1600 }, addons: A_ALL_OFF, countsForLoyalty: true },
  { id: 'raf_banana_caramel', name: 'Раф банан-карамель',   category: 'author_coffee', prices: { M: 1400, L: 1600 }, addons: A_ALL_OFF, countsForLoyalty: true },
  { id: 'latte_halva',        name: 'Латте халва',          category: 'author_coffee', prices: { M: 1300, L: 1500 }, addons: A_ALL_OFF, countsForLoyalty: true },
  { id: 'ginger_spice_latte', name: 'Имбирно-пряный латте', category: 'author_coffee', prices: { M: 1450, L: 1550 }, addons: A_ALL_OFF, countsForLoyalty: true },
  { id: 'mocha',              name: 'Мокко',                category: 'author_coffee', prices: { L: 1550 },          addons: A_ALL_OFF, countsForLoyalty: true },
  { id: 'lavender_raf',       name: 'Лавандовый раф',       category: 'author_coffee', prices: { L: 1450 },          addons: A_ALL_OFF, countsForLoyalty: true },

  // Айс кофе (включая горячие Горячий шоколад и Какао с isHot: true)
  { id: 'ice_americano',  name: 'Айс американо',  category: 'ice_coffee', prices: { M: 1150, L: 1350 }, addons: A_SYRUP_ONLY,  countsForLoyalty: true },
  { id: 'ice_cappuccino', name: 'Айс капучино',   category: 'ice_coffee', prices: { M: 1450, L: 1650 }, addons: A_MILK_SYRUP,  countsForLoyalty: true },
  { id: 'ice_latte',      name: 'Айс латте',      category: 'ice_coffee', prices: { M: 1350, L: 1450 }, addons: A_MILK_SYRUP,  countsForLoyalty: true },
  { id: 'frappuccino',    name: 'Фраппучино',     category: 'ice_coffee', prices: { M: 1650, L: 1850 }, addons: A_MILK_SYRUP,  countsForLoyalty: true },
  { id: 'banana_coffee',  name: 'Банановый кофе', category: 'ice_coffee', prices: { M: 1850, L: 2050 }, addons: A_MILK_SYRUP,  countsForLoyalty: true },
  { id: 'bumble_bee',     name: 'Бамбл би',       category: 'ice_coffee', prices: { M: 1450, L: 1550 }, addons: A_MILK_SYRUP,  countsForLoyalty: true },
  { id: 'espresso_tonic', name: 'Эспрессо тоник', category: 'ice_coffee', prices: { M: 1650, L: 1750 }, addons: A_ALL_OFF,     countsForLoyalty: true },
  { id: 'hot_chocolate',  name: 'Горячий шоколад', category: 'ice_coffee', prices: { M: 1350, L: 1450 }, addons: A_MILK_SYRUP,  countsForLoyalty: true, isHot: true },
  { id: 'cocoa',          name: 'Какао',           category: 'ice_coffee', prices: { M: 1250, L: 1350 }, addons: A_MILK_SYRUP,  countsForLoyalty: true, isHot: true },

  // Домашний чай
  { id: 'home_tea_naryadniy',    name: 'Нарядный',    category: 'home_tea', prices: { M: 950,  L: 1050 }, addons: A_SYRUP_HONEY, countsForLoyalty: false, composition: 'апельсин, лимон, мята' },
  { id: 'home_tea_ginger',       name: 'Имбирный',    category: 'home_tea', prices: { M: 1050, L: 1150 }, addons: A_SYRUP_HONEY, countsForLoyalty: false, composition: 'имбирь, мёд, лимон, апельсин' },
  { id: 'home_tea_seabuckthorn', name: 'Облепиховый', category: 'home_tea', prices: { M: 1150, L: 1250 }, addons: A_SYRUP_HONEY, countsForLoyalty: false, composition: 'облепиха, маракуйя, лимон, апельсин' },
  { id: 'home_tea_raspberry',    name: 'Малиновый',   category: 'home_tea', prices: { M: 1250, L: 1350 }, addons: A_SYRUP_HONEY, countsForLoyalty: false, composition: 'малина, мята, апельсин, лимон' },
  { id: 'home_tea_berry',        name: 'Ягодный',     category: 'home_tea', prices: { M: 1250, L: 1350 }, addons: A_SYRUP_HONEY, countsForLoyalty: false, composition: 'смородина, клюква, лимон' },

  // Авторский чай
  { id: 'author_tea_latte',            name: 'Чай латте',        category: 'author_tea', prices: { M: 550,  L: 650  }, addons: A_HONEY_ONLY, countsForLoyalty: false, composition: 'чай со взбитым молоком и корицей' },
  { id: 'author_tea_grog',             name: 'Грог',             category: 'author_tea', prices: { M: 1150, L: 1250 }, addons: A_HONEY_ONLY, countsForLoyalty: false, composition: 'чай, имбирь, корица, кардамон, апельсин, лимон, мёд' },
  { id: 'author_tea_mulled',           name: 'Глинтвейн',        category: 'author_tea', prices: { M: 1350, L: 1450 }, addons: A_HONEY_ONLY, countsForLoyalty: false, composition: 'апельсин, лимон, мята, вишнёвый сок, гвоздика, корица' },
  { id: 'author_tea_moroccan',         name: 'Марокканский',     category: 'author_tea', prices: { M: 1150, L: 1250 }, addons: A_HONEY_ONLY, countsForLoyalty: false, composition: 'апельсин, лимон, мята, чай, гвоздика, корица' },
  { id: 'author_tea_spiced_currant',   name: 'Пряная смородина', category: 'author_tea', prices: { M: 1350, L: 1450 }, addons: A_HONEY_ONLY, countsForLoyalty: false, composition: 'смородина, гвоздика, корица' },
  { id: 'author_tea_tangerine',        name: 'Мандариновый',     category: 'author_tea', prices: { M: 1350, L: 1450 }, addons: A_HONEY_ONLY, countsForLoyalty: false, composition: 'мандарин, лимон, мята' },
  { id: 'author_tea_raspberry_ginger', name: 'Малиново-имбирный', category: 'author_tea', prices: { M: 1450, L: 1550 }, addons: A_HONEY_ONLY, countsForLoyalty: false, composition: 'малина, имбирь, лимон, апельсин' },
  { id: 'author_tea_tary',             name: 'Чай тары',         category: 'author_tea', prices: { M: 1250, L: 1350 }, addons: A_HONEY_ONLY, countsForLoyalty: false, composition: 'тары, молоко, мёд' },

  // Матча (Айс матча с isHot: false)
  { id: 'green_matcha',  name: 'Зелёная матча', category: 'matcha', prices: { M: 1250, L: 1350 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'bumble_matcha', name: 'Бамбл матча',   category: 'matcha', prices: { M: 1450, L: 1650 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'matcha_tonic',  name: 'Матча тоник',   category: 'matcha', prices: { M: 1550, L: 1750 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'ice_matcha',    name: 'Айс матча',     category: 'matcha', prices: { M: 1350, L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false, isHot: false },

  // Айс ти (только L, все 1050₸)
  { id: 'ice_tea_berry',        name: 'Ягодный',        category: 'ice_tea', prices: { L: 1050 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'ice_tea_mango_passion', name: 'Манго-маракуйя', category: 'ice_tea', prices: { L: 1050 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'ice_tea_pomegranate',  name: 'Гранат',         category: 'ice_tea', prices: { L: 1050 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'ice_tea_raspberry',    name: 'Малиновый',      category: 'ice_tea', prices: { L: 1050 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'ice_tea_cherry',       name: 'Вишня',          category: 'ice_tea', prices: { L: 1050 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'ice_tea_lemon',        name: 'Лимонный',       category: 'ice_tea', prices: { L: 1050 }, addons: A_ALL_OFF, countsForLoyalty: false },

  // Смузи (addons off — готовые рецепты)
  { id: 'smoothie_berry_mix',         name: 'Ягодный микс',      category: 'smoothie', prices: { M: 1750, L: 1950 }, addons: A_ALL_OFF, countsForLoyalty: false, composition: 'смородина, клюква, молоко, сливки' },
  { id: 'smoothie_strawberry_banana', name: 'Клубника-банан',    category: 'smoothie', prices: { M: 1750, L: 1950 }, addons: A_ALL_OFF, countsForLoyalty: false, composition: 'клубника, банан, молоко, сливки' },
  { id: 'smoothie_fruit_mix',         name: 'Фруктовый микс',    category: 'smoothie', prices: { M: 2050, L: 2250 }, addons: A_ALL_OFF, countsForLoyalty: false, composition: 'банан, киви, фреш апельсиновый, фреш яблочный' },
  { id: 'smoothie_sorrel_pineapple',  name: 'Щавель-ананас',     category: 'smoothie', prices: { M: 1250, L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false, composition: 'щавель, ананас' },
  { id: 'smoothie_currant',           name: 'Смородина',         category: 'smoothie', prices: { M: 1850, L: 2050 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'smoothie_apple_raspberry',   name: 'Яблоко-малина',     category: 'smoothie', prices: { M: 1850, L: 2050 }, addons: A_ALL_OFF, countsForLoyalty: false, composition: 'малина, банан, фреш яблочный' },

  // Фреши
  { id: 'fresh_orange',            name: 'Апельсин',           category: 'fresh', prices: { M: 2050, L: 2250 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'fresh_grapefruit',        name: 'Грейпфрут',          category: 'fresh', prices: { M: 2050, L: 2250 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'fresh_apple',             name: 'Яблоко',             category: 'fresh', prices: { M: 1550, L: 1750 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'fresh_orange_grapefruit', name: 'Апельсин-грейпфрут', category: 'fresh', prices: { M: 2050, L: 2250 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'fresh_orange_apple',      name: 'Апельсин-яблоко',    category: 'fresh', prices: { M: 2050, L: 2250 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'fresh_apple_grapefruit',  name: 'Яблоко-грейпфрут',   category: 'fresh', prices: { M: 1950, L: 2150 }, addons: A_ALL_OFF, countsForLoyalty: false },

  // Лимонады (только L)
  { id: 'lemonade_apple_passion',      name: 'Яблоко-маракуйя',  category: 'lemonade', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'lemonade_raspberry_passion',  name: 'Малина-маракуйя',  category: 'lemonade', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'lemonade_berry_boom',         name: 'Ягодный бум',      category: 'lemonade', prices: { L: 1350 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'lemonade_orange',             name: 'Апельсин',         category: 'lemonade', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'lemonade_lime_raspberry',     name: 'Лайм-малина',      category: 'lemonade', prices: { L: 1350 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'lemonade_house',              name: 'Домашний',         category: 'lemonade', prices: { L: 1150 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'lemonade_watermelon_kiwi',    name: 'Арбуз-киви',       category: 'lemonade', prices: { L: 1350 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'lemonade_kiwi_aloe',          name: 'Киви-алоэ',        category: 'lemonade', prices: { L: 1550 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'lemonade_mojito',             name: 'Мохито',           category: 'lemonade', prices: { L: 1250 }, addons: A_ALL_OFF, countsForLoyalty: false },

  // Молочные коктейли (только L)
  { id: 'milkshake_banana',     name: 'Банановый',   category: 'milkshake', prices: { L: 1650 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'milkshake_strawberry', name: 'Клубничный',  category: 'milkshake', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'milkshake_chocolate',  name: 'Шоколадный',  category: 'milkshake', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'milkshake_vanilla',    name: 'Ванильный',   category: 'milkshake', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'milkshake_caramel',    name: 'Карамельный', category: 'milkshake', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'milkshake_pistachio',  name: 'Фисташковый', category: 'milkshake', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
  { id: 'milkshake_coconut',    name: 'Кокосовый',   category: 'milkshake', prices: { L: 1450 }, addons: A_ALL_OFF, countsForLoyalty: false },
];

// ═══ COLD CATEGORIES — дефолт «холодности» по категории ═══
// isColdItem(item) сначала смотрит item.isHot, потом сверяется с этим set.
export const COLD_CATEGORIES: ReadonlySet<CategoryId> = new Set<CategoryId>([
  'ice_coffee', 'ice_tea', 'lemonade', 'fresh', 'smoothie', 'milkshake',
]);

export function isColdCategory(cat: CategoryId): boolean {
  return COLD_CATEGORIES.has(cat);
}

/** Холодный ли напиток с учётом per-item override item.isHot. */
export function isColdItem(item: MenuItem): boolean {
  if (item.isHot === true) return false;
  if (item.isHot === false) return true;
  return COLD_CATEGORIES.has(item.category);
}

// ═══ LEGACY CATEGORY NORMALIZATION ═══
// Исторические заказы в Firestore содержат старые ID категорий.
// normalizeCategoryId маппит их на новые и логирует в Sentry для отслеживания
// момента, когда легаси полностью выйдет из оборота и хелпер можно будет удалить.
const LEGACY_CATEGORY_MAP: Record<string, CategoryId> = {
  coffee_classic: 'classic_coffee',
  coffee_author: 'author_coffee',
  tea_home: 'home_tea',
  tea_author: 'author_tea',
};

const KNOWN_CATEGORY_IDS: ReadonlySet<string> = new Set(CATEGORIES.map(c => c.id));

export function normalizeCategoryId(raw: string | undefined | null): CategoryId {
  if (!raw) return 'classic_coffee';
  if (KNOWN_CATEGORY_IDS.has(raw)) return raw as CategoryId;
  if (raw in LEGACY_CATEGORY_MAP) {
    const mapped = LEGACY_CATEGORY_MAP[raw];
    try {
      Sentry.captureMessage(`Legacy category encountered: ${raw} → ${mapped}`, {
        level: 'info',
        tags: { legacy_category_format: 'true' },
        extra: { oldId: raw, newId: mapped },
      });
    } catch { /* Sentry unavailable — swallow */ }
    return mapped;
  }
  // Неизвестная категория → дефолт + лог ошибки
  try {
    Sentry.captureMessage(`Unknown category id: ${raw}`, {
      level: 'warning',
      tags: { legacy_category_format: 'unknown' },
      extra: { oldId: raw },
    });
  } catch { /* ignore */ }
  return 'classic_coffee';
}

// ═══ UTILITIES ═══

export function getCategory(id: CategoryId): Category {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) throw new Error(`Unknown category: ${id}`);
  return cat;
}

/** Модификаторы, разрешённые для позиции (по per-item addons). */
export function getModifiersForItem(item: MenuItem): Modifier[] {
  return MODIFIERS.filter(m => {
    if (m.group === 'milk') return item.addons.milk;
    if (m.group === 'syrup') return item.addons.syrup;
    if (m.group === 'honey') return item.addons.honey;
    return false;
  });
}

export function calculateItemTotal(basePrice: number, modifiers: Modifier[]): number {
  return basePrice + modifiers.reduce((sum, m) => sum + m.price, 0);
}

export function getDefaultSize(item: MenuItem): Size {
  const available = getAvailableSizes(item);
  return available.includes('M') ? 'M' : available[0];
}

export function getAvailableSizes(item: MenuItem): Size[] {
  return (['S', 'M', 'L'] as Size[]).filter(s => item.prices[s] !== undefined);
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

// ═══ BUILD-TIME INTEGRITY CHECKS ═══
// Выполняется при первом импорте модуля. Падает билд если инварианты нарушены.
// Проверяет корректность isHot override для горячих/холодных позиций в неочевидных категориях.
(function runMenuIntegrityChecks() {
  const checks: Array<{ id: string; expected: boolean; label: string }> = [
    { id: 'hot_chocolate', expected: false, label: 'Горячий шоколад' },
    { id: 'cocoa',         expected: false, label: 'Какао' },
    { id: 'ice_matcha',    expected: true,  label: 'Айс матча' },
    { id: 'green_matcha',  expected: false, label: 'Зелёная матча' },
    { id: 'frappuccino',   expected: true,  label: 'Фраппучино' },
  ];
  for (const c of checks) {
    const item = MENU_ITEMS.find(i => i.id === c.id);
    if (!item) {
      throw new Error(`[menu integrity] missing item: ${c.id} (${c.label})`);
    }
    const actual = isColdItem(item);
    if (actual !== c.expected) {
      throw new Error(
        `[menu integrity] isColdItem("${c.id}" / ${c.label}) expected ${c.expected}, got ${actual}`
      );
    }
  }
})();
