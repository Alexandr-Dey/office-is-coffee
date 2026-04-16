# DESIGN-SYSTEM.md — Office is Coffee

> Визуальная система приложения. Единый источник правды по цветам, шрифтам, компонентам, анимациям.
> Claude Code ОБЯЗАН следовать этому документу при создании любого UI.
>
> Версия: 2.0 (2026-04-07)
> Главное изменение v2: концепция "сцена-герой" — CoffeeScene занимает 60% главного экрана.

---

## 1. Философия дизайна

### Три столпа
1. **Тёплый и живой** — это кофейня друзей, а не банк
2. **С характером** — уникальность через сцену и мелкие детали
3. **Ритуал, а не транзакция** — заказать кофе через приложение должно быть приятно, а не быстро-забыл

### Эмоциональный тон
- Уютный, но не инфантильный
- С иронией и теплом, но без фамильярности
- Казахстанский локальный колорит без кринжа
- Внимание к деталям как у хороших инди-игр

### Что мы НЕ делаем
- Никаких корпоративных синих градиентов
- Никаких "Sans-serif тяжёлый на белом фоне"
- Никаких generic-иконок Material Design
- Никаких "loading spinners" — только skeleton
- Никаких внезапных редиректов — всё через плавные переходы

---

## 2. Палитра цветов

### Основные (бренд)

| Роль | HEX | Tailwind | Где используется |
|---|---|---|---|
| Фон страницы | `#f2fdf6` | `bg-brand-bg` | Фон всех экранов |
| Тёмно-зелёный | `#1a7a44` | `brand-dark` | Заголовки, CTA, активные состояния |
| Средний зелёный | `#2d9e5a` | `brand-mid` | Hover CTA, вторичный акцент |
| Мятный | `#3ecf82` | `brand-mint` | Бейджи NEW, успех, конфетти |
| Розовый | `#d42b4f` | `brand-pink` | ХИТ бейдж, CTA на хит-карточке |
| Основной текст | `#0f3a20` | `brand-text` | Весь обычный текст |

### Вспомогательные

| Роль | HEX | Где используется |
|---|---|---|
| Серый подписи | `#6b7280` | Meta-информация, подсказки |
| Оранжевый | `#f59e0b` | Сезонный бейдж, внимание |
| Синий информация | `#3b82f6` | Депозит, инфо-блоки |
| Красный ошибка | `#ef4444` | Ошибки, удаление |
| Карточка фон | `#ffffff` | Фон всех карточек |
| Карточка граница | `#d0f0e0` | Рамка карточек |
| Мягкая зелёная тень | `rgba(30,120,70,0.06)` | Тени карточек |

### Палитра сцены (pixel-art)

Эти цвета используются ТОЛЬКО внутри CoffeeScene.tsx. Они **не теоретические**, а проверенные на контрастность и читаемость в pixel-art стиле.

**Стены и пол**:
```
Красная стена:        #c0392b  (основной)
Красная стена тень:   #a93226  (затенение углов)
Красная стена блик:   #e74c3c  (блик от света)

Светлая стена:        #f5f0e8  (основной)
Светлая стена тень:   #e8e0d0  (затенение)

Пол:                  #8b6f47  (тёмное дерево)
Пол блик:             #a0825a  (освещённые места)
```

**Стойка и объекты**:
```
Стойка основной:      #1a7a44  (бренд зелёный)
Стойка блик:          #2d9e5a  (верхняя грань)
Стойка тень:          #145a32  (боковая грань)

Кофемашина:           #c0c0c0  (хромированный корпус)
Кофемашина детали:    #a0a0a0  (кнопки, ручки)
Кофемашина тёмная:    #666666  (решётки, проёмы)

Микроволновка:        #d0d0d0  (корпус)
Микроволновка экран:  #111111  (окно дисплея)

Стаканчики Love is Coffee: #d42b4f (фирменный красный)
Крышки стаканчиков:        #8b1a2e (тёмно-красный)

Пар:                  #ffffff с opacity 0.3-0.6 (анимированный)
```

**Баристы**:
```
Виталий:
  Кожа светлая:       #e8b88a
  Кожа тень:          #d4a574
  Волосы:             #2c1810 (тёмно-коричневые)
  Глаза:              #1a1a1a
  Фартук:             #2980b9 (синий)
  Фартук лямки:       #1a5276
  Футболка:           #f5f0e8 (белая)
  Штаны:              #1a3c5e

Аслан:
  Кожа:               #d4a574
  Кожа тень:          #b8956a
  Волосы:             #1a1a1a (чёрные)
  Глаза:              #1a1a1a
  Фартук:             #27ae60 (зелёный)
  Фартук лямки:       #1a7a44
  Футболка:           #f5f0e8
  Штаны:              #1a3c5e
```

**NPC палитры** — см. SCENE-SPEC.md раздел "Процедурная генерация NPC".

### Бейджи

| Тип | Фон | Текст | Когда |
|---|---|---|---|
| ХИТ | `#d42b4f` | `#ffffff` | Популярные позиции (из `tags: ["hit"]`) |
| NEW | `#3ecf82` | `#0f3a20` | Новые позиции (из `tags: ["new"]`) |
| СЕЗОН | `#f59e0b` | `#ffffff` | Сезонные (из `tags: ["season"]`) |
| ДЕПОЗИТ | `#3b82f6` | `#ffffff` | Способ оплаты депозитом |

### Что НЕ использовать

- Чистый чёрный `#000000` — только `#0f3a20` или `#1a1a1a`
- Чистый белый `#ffffff` — только `#f5f0e8` или `#fafafa` (кроме фона карточек)
- Градиенты "Bootstrap-style" (синий в фиолетовый)
- Неоновые цвета

---

## 3. Типографика

### Шрифты

**Primary (body, UI)**: Inter — системный sans-serif, универсальный, хорошо читается
**Display (заголовки сцены, hero)**: Playfair Display — серифный с характером, добавляет премиальности
**Mono (цены, QR-коды, технические элементы)**: system monospace

Подключение в `src/app/layout.tsx`:
```tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });
const playfair = Playfair_Display({ subsets: ['latin', 'cyrillic'] });
```

В Tailwind:
```js
fontFamily: {
  sans: ['var(--font-inter)', 'sans-serif'],
  display: ['var(--font-playfair)', 'serif'],
}
```

### Размеры и веса

| Элемент | Размер | Вес | Шрифт | Цвет | Класс |
|---|---|---|---|---|---|
| Hero заголовок | 32px | 700 | Playfair | `#1a7a44` | `font-display text-[32px] font-bold` |
| Заголовок экрана | 26px | 700 | Playfair | `#1a7a44` | `font-display text-[26px] font-bold` |
| Заголовок карточки | 16px | 700 | Inter | `#1a7a44` | `font-sans text-base font-bold` |
| Категория пилюля | 13px | 600 | Inter | зависит | `text-[13px] font-semibold` |
| Основной текст | 14px | 400 | Inter | `#374151` | `text-sm` |
| Подпись | 12px | 400 | Inter | `#6b7280` | `text-xs text-gray-500` |
| Цена S/M/L | 16-18px | 700 | Inter | `#1a7a44` | `text-lg font-bold` |
| Цена крупная | 24px | 700 | Inter | `#1a7a44` | `text-2xl font-bold` |
| Бейдж | 10-11px | 700 | Inter | зависит | `text-[10px] font-bold uppercase` |

### Межстрочный интервал

- Обычный текст: `line-height: 1.6`
- Списки: `line-height: 1.55`
- Заголовки: `line-height: 1.2`
- Подписи: `line-height: 1.4`

### Локализация
- Основной язык: **русский**
- Склонение: правильное ("1 кофе", "2 кофе", "5 кофе" — 3 формы)
- Никаких машинных переводов, никакого английского в UI без причины

---

## 4. Иконки

**Подход**: emoji там где возможно, SVG там где нужно. Никаких иконочных библиотек (кроме специальных случаев).

### Основные emoji
- ☕ — кофе, меню
- 📦 — заказы, история
- ⭐ — монеты, избранное
- 👤 — профиль
- 🔥 — стрик
- 📍 — геолокация
- 🎉 — праздник (лояльность, конфетти)
- 💳 — депозит
- 💵 — наличные
- 🏆 — достижения
- 🌅 — утро, первый заказ дня
- 🌙 — ночь

### Правила
- Размер в UI: 18-24px (не мельче)
- На iOS emoji рендерятся натуральными — это хорошо
- На Android — Noto Color Emoji, тоже приемлемо
- **Не использовать** эмодзи с разной рендеринг (разные лица, разные семьи)

---

## 5. Компоненты

### 5.1 Карточка (base)

```tsx
<div className="bg-white border border-[#d0f0e0] rounded-2xl p-5 shadow-[0_2px_8px_rgba(30,120,70,0.06)]">
  {content}
</div>
```

**Параметры**:
- Фон: `#ffffff`
- Граница: `1px solid #d0f0e0`
- Скругление: `16px` (rounded-2xl)
- Padding: `20px` (p-5)
- Тень: `0 2px 8px rgba(30,120,70,0.06)`
- Margin между карточками: `12px`

**Вариации**:
- `compact` — padding `12px`, для списков
- `flat` — без тени, для вложенных
- `highlighted` — с мятной рамкой `2px solid #3ecf82`

### 5.2 Кнопки

**Primary CTA**:
```tsx
<motion.button
  className="bg-[#1a7a44] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#2d9e5a] transition-colors"
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Заказать
</motion.button>
```

**Secondary**:
```tsx
<button className="bg-transparent border border-[#d0f0e0] text-[#1a7a44] rounded-xl px-6 py-3 font-semibold hover:bg-[#f0fdf4]">
  Отмена
</button>
```

**Hit CTA** (розовый, для хит-карточек):
```tsx
<motion.button
  className="bg-[#d42b4f] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#b91c3c]"
  whileTap={{ scale: 0.97 }}
>
  Попробовать
</motion.button>
```

**Ghost** (для иконок, бейджиков навигации):
```tsx
<button className="bg-transparent text-[#1a7a44] p-2 rounded-lg hover:bg-[#f0fdf4]">
  <Icon />
</button>
```

### 5.3 Категории-пилюли (горизонтальный скролл меню)

```tsx
<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
  {categories.map(cat => (
    <button
      key={cat.id}
      onClick={() => setActive(cat.id)}
      className={`
        shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap
        transition-colors
        ${active === cat.id 
          ? 'bg-[#1a7a44] text-white' 
          : 'bg-[#f0fdf4] text-[#2d9e5a] border border-[#d0f0e0]'}
      `}
    >
      {cat.icon} {cat.name}
    </button>
  ))}
</div>
```

### 5.4 Карточка меню (DrinkIt стиль)

```tsx
<motion.div
  className="relative rounded-2xl p-4 overflow-hidden aspect-[3/4] cursor-pointer"
  style={{ background: getCategoryGradient(item.category) }}
  whileHover={{ y: -4 }}
  whileTap={{ scale: 0.97 }}
>
  {/* Бейдж */}
  {item.tags.includes('hit') && <HitBadge />}
  
  {/* Изображение или эмодзи */}
  <div className="text-5xl text-center mt-2">{item.emoji || '☕'}</div>
  
  {/* Название */}
  <h3 className="text-white font-bold text-base mt-auto">{item.name}</h3>
  
  {/* Цена */}
  <div className="text-white text-sm opacity-90 mt-1">
    от {Math.min(...Object.values(item.sizes))}₸
  </div>
</motion.div>
```

### 5.5 Hero-карточка (верх меню)

```tsx
<motion.div
  className="relative rounded-3xl overflow-hidden p-6"
  style={{ 
    background: 'linear-gradient(135deg, #1a7a44 0%, #2d9e5a 100%)',
    minHeight: '180px'
  }}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  {/* Мятные blob-формы на фоне */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-[#3ecf82] rounded-full opacity-20 blur-2xl" />
  <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#3ecf82] rounded-full opacity-15 blur-3xl" />
  
  {/* Бейдж */}
  <div className="inline-block bg-[#d42b4f] text-white text-xs font-bold px-3 py-1 rounded-full">
    ХИТ СЕЗОНА
  </div>
  
  {/* Название */}
  <h2 className="font-display text-3xl font-bold text-white mt-3">
    Раф классика
  </h2>
  
  {/* Цена + кнопка */}
  <div className="flex items-end justify-between mt-6">
    <div className="text-[#3ecf82] text-2xl font-bold">от 1 250₸</div>
    <button className="bg-white text-[#1a7a44] rounded-xl px-5 py-2 font-semibold">
      В корзину
    </button>
  </div>
</motion.div>
```

### 5.6 Input поле

```tsx
<input
  type="text"
  className="
    w-full bg-white border border-[#d0f0e0] rounded-xl px-4 py-3
    text-[#0f3a20] placeholder:text-gray-400
    focus:border-[#3ecf82] focus:ring-2 focus:ring-[#3ecf82]/20 focus:outline-none
    transition-all
  "
  placeholder="Введите имя"
/>
```

### 5.7 Bottom Navigation

```tsx
<nav className="
  fixed bottom-0 left-0 right-0 bg-white border-t border-[#d0f0e0]
  shadow-[0_-2px_10px_rgba(0,0,0,0.04)]
  safe-area-inset-bottom
  z-40
">
  <div className="flex justify-around max-w-[480px] mx-auto">
    {tabs.map(tab => (
      <Link
        key={tab.path}
        href={tab.path}
        className={`
          flex flex-col items-center gap-1 py-3 px-6
          ${pathname === tab.path ? 'text-[#1a7a44]' : 'text-gray-400'}
        `}
      >
        <span className="text-2xl">{tab.icon}</span>
        <span className="text-xs font-medium">{tab.label}</span>
      </Link>
    ))}
  </div>
</nav>
```

### 5.8 Toast уведомление

```tsx
<AnimatePresence>
  {toast && (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="
        fixed bottom-24 left-4 right-4 max-w-md mx-auto
        bg-[#1a7a44] text-white rounded-2xl p-4
        shadow-xl z-50
      "
    >
      <p className="font-semibold">{toast.message}</p>
    </motion.div>
  )}
</AnimatePresence>
```

### 5.9 Bottom Sheet (детали напитка)

```tsx
<motion.div
  className="
    fixed inset-0 z-50 flex items-end justify-center
    bg-black/40
  "
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={onClose}
>
  <motion.div
    className="
      bg-white rounded-t-3xl p-6 w-full max-w-[480px]
      max-h-[85vh] overflow-y-auto
    "
    initial={{ y: '100%' }}
    animate={{ y: 0 }}
    exit={{ y: '100%' }}
    transition={{ type: 'spring', damping: 25 }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* handle */}
    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
    {children}
  </motion.div>
</motion.div>
```

### 5.10 Skeleton Loading

```tsx
<div className="animate-pulse">
  <div className="bg-[#e5e7eb] rounded-2xl h-40 mb-4" />
  <div className="bg-[#e5e7eb] rounded-lg h-4 w-3/4 mb-2" />
  <div className="bg-[#e5e7eb] rounded-lg h-4 w-1/2" />
</div>
```

**Правило**: Skeleton ВЕЗДЕ, где есть загрузка данных из Firestore. Никаких spinner'ов.

---

## 6. Градиенты карточек меню

| Категория | Градиент | CSS |
|---|---|---|
| classic-coffee | Зелёный | `linear-gradient(135deg, #1a7a44 0%, #2d9e5a 100%)` |
| author-coffee | Розовый | `linear-gradient(135deg, #d42b4f 0%, #e85d7a 100%)` |
| ice-coffee | Голубой | `linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)` |
| cocoa | Коричневый | `linear-gradient(135deg, #92400e 0%, #b45309 100%)` |
| home-tea | Оранжевый | `linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)` |
| author-tea | Малиновый | `linear-gradient(135deg, #be123c 0%, #e11d48 100%)` |
| matcha | Зелёный | `linear-gradient(135deg, #65a30d 0%, #84cc16 100%)` |
| ice-tea | Циан | `linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)` |
| milkshakes | Розовый | `linear-gradient(135deg, #ec4899 0%, #f472b6 100%)` |
| fresh-juices | Оранжевый | `linear-gradient(135deg, #f97316 0%, #fb923c 100%)` |
| fresh-smoothies | Жёлтый | `linear-gradient(135deg, #eab308 0%, #facc15 100%)` |
| milk-smoothies | Фиолетовый | `linear-gradient(135deg, #a855f7 0%, #c084fc 100%)` |
| lemonades | Бирюзовый | `linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)` |

Реализовать как хелпер:
```ts
// src/lib/categoryColors.ts
export const CATEGORY_GRADIENTS: Record<string, string> = {
  'classic-coffee': 'linear-gradient(135deg, #1a7a44 0%, #2d9e5a 100%)',
  // ...
};

export const getCategoryGradient = (category: string): string => {
  return CATEGORY_GRADIENTS[category] || 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)';
};
```

---

## 7. Анимации (Framer Motion)

### 7.1 Базовые принципы
- **Всегда через Framer Motion**, не CSS `@keyframes`
- **Spring > duration** для интерактивных элементов
- **Короткие (200-400ms)** для переходов, **плавные (600-1200ms)** для атмосферы
- **Stagger для списков** — карточки появляются с задержкой

### 7.2 Переходы между экранами

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {content}
</motion.div>
```

### 7.3 Кнопки (spring tap)

```tsx
whileTap={{ scale: 0.97 }}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

### 7.4 Stagger для списков карточек

```tsx
// Контейнер
<motion.div
  variants={{
    show: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } },
      }}
    >
      <Card {...item} />
    </motion.div>
  ))}
</motion.div>
```

### 7.5 Confetti

```ts
import confetti from 'canvas-confetti';

// Лояльность — бесплатный кофе (зелёный)
confetti({
  colors: ['#1a7a44', '#3ecf82', '#2d9e5a'],
  particleCount: 80,
  spread: 70,
  origin: { y: 0.6 },
});

// Депозит пополнен (золотой)
confetti({
  colors: ['#f59e0b', '#fbbf24', '#d97706'],
  particleCount: 60,
  spread: 60,
});

// Первый заказ дня (радужный)
confetti({
  colors: ['#d42b4f', '#1a7a44', '#f59e0b', '#3b82f6'],
  particleCount: 100,
  spread: 120,
  startVelocity: 30,
});
```

### 7.6 Таймер ожидания заказа

```tsx
<motion.div
  className="relative w-32 h-32"
>
  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
    <circle cx="50" cy="50" r="45" stroke="#d0f0e0" strokeWidth="6" fill="none" />
    <motion.circle
      cx="50" cy="50" r="45"
      stroke="#1a7a44"
      strokeWidth="6"
      fill="none"
      strokeDasharray="283"
      initial={{ strokeDashoffset: 283 }}
      animate={{ strokeDashoffset: 283 * (1 - progress) }}
      transition={{ duration: 1, ease: 'linear' }}
    />
  </svg>
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-2xl font-bold">{minutesLeft} мин</span>
  </div>
</motion.div>
```

### 7.7 Pulse для real-time индикаторов

```tsx
<motion.div
  className="w-3 h-3 bg-green-500 rounded-full"
  animate={{
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
/>
```

---

## 8. Layout правила

### 8.1 Mobile-first

- **Базовая ширина**: 375px (iPhone SE)
- **Максимальная ширина контента**: 480px (центрировано)
- **Safe area**: `safe-area-inset-bottom` для Bottom Nav (iPhone notch)

### 8.2 Главный экран (/menu) — v2 компоновка

```
┌─────────────────────────────┐
│                             │
│                             │
│      CoffeeScene            │
│      (60% viewport)         │  ← ~60vh
│                             │
│                             │
├─────────────────────────────┤
│  Hero карточка (раф)        │  ← 180px
├─────────────────────────────┤
│  Категории (скролл)         │  ← 50px
├─────────────────────────────┤
│  Карточки меню              │
│  (grid 2 колонки)           │
│                             │
│  ...                        │
│                             │
├─────────────────────────────┤
│  Bottom Nav                 │  ← 70px + safe-area
└─────────────────────────────┘
```

**CSS**:
```tsx
<div className="min-h-screen bg-brand-bg">
  {/* Сцена: 60% высоты viewport, без паддингов */}
  <div className="h-[60vh] relative">
    <CoffeeScene />
  </div>
  
  {/* Контент: обычный padding */}
  <div className="px-4 -mt-8 relative z-10">
    <HeroCard />
    <Categories className="mt-4" />
    <MenuGrid className="mt-4" />
  </div>
  
  <BottomNav />
</div>
```

Обрати внимание на `-mt-8 relative z-10` — это создаёт эффект "контент накладывается на нижнюю часть сцены", визуально связывая их.

### 8.3 Padding и margin

| Контекст | Padding | Margin |
|---|---|---|
| Экран (кроме сцены) | `16px` по бокам | — |
| Между секциями | — | `24px` |
| Между карточками | — | `12px` |
| Внутри карточки | `20px` | — |
| Grid gap | — | `12px` |

---

## 9. Концепция "Сцена-герой" (главное изменение v2)

### 9.1 Что это

CoffeeScene больше НЕ баннер 220px сверху. Теперь она **главный элемент интерфейса** на `/menu` и занимает 60% высоты экрана. Пользователь видит её первой, она сразу создаёт ощущение места, времени, настроения.

### 9.2 Правила

1. **Никаких UI-элементов поверх сцены** — чистый визуал. Никаких баннеров, кнопок, текста.
2. **Сцена интерактивна** — тапать на баристов, клиентов, объекты = что-то происходит.
3. **Real-time связь с данными** — сцена знает твой активный заказ, твой стрик, общее количество клиентов.
4. **Процедурная генерация** — NPC генерируются на лету, не заскриптованы. Каждый раз немного другое.
5. **Контент под сценой "высасывается"** — hero-карточка выглядывает из-под сцены снизу на 30-40px, приглашая скроллить.
6. **На других экранах** (`/order/[id]`) сцена тоже есть, но меньше (40vh).

### 9.3 Приоритет качества

> Сцена должна быть настолько красивой и живой, что пользователь захочет показать её другу, как показывают любимую игру.

Это значит:
- Детализация персонажей, а не палочные человечки
- Плавные анимации без jitter
- Реакции на действия пользователя
- Много маленьких деталей (пар, блики, движение)
- Случайность без повторов

Подробности — в **SCENE-SPEC.md**.

---

## 10. Адаптивность

### 10.1 Брейкпоинты

- **mobile**: < 480px (основной кейс, приоритет)
- **tablet**: 480-1024px (выглядит как мобильный, центрирован)
- **desktop**: > 1024px (тот же мобильный вид, центрирован, без лишних колонок)

**Мы НЕ делаем desktop-версию** — это PWA для телефона. На компьютере выглядит как телефон посередине экрана.

```tsx
// в layout.tsx
<body className="bg-brand-bg min-h-screen flex justify-center">
  <div className="w-full max-w-[480px] min-h-screen bg-brand-bg relative">
    {children}
  </div>
</body>
```

### 10.2 Safe area для iPhone

```tsx
<nav className="pb-[env(safe-area-inset-bottom)]">
  ...
</nav>
```

---

## 11. Доступность (минимум)

- Контраст текста/фон: минимум 4.5:1 (проверять для серого текста)
- Размер тап-зоны: минимум 44x44px (Apple HIG)
- `alt` на всех изображениях
- Чистые `<button>` для кликабельных элементов (не `<div onClick>`)
- Клавиатурная навигация работает (Tab, Enter)

---

## 12. Пасхалки как часть дизайна

Пасхалки — не баг, а фича. Они формируют любовь к продукту.

- 8× тап Виталия → бросок фартука
- 5× тап Аслана → сальто
- Shake телефона → стаканчики падают
- 23:00-07:00 → баристы спят
- 10-й заказ подряд → танец
- Первый заказ дня (07:30-08:00) → спец конфетти
- 23 февраля, 8 марта, Наурыз → особое оформление (см. IDEAS.md)

**Все пасхалки — в сцене**. Они не должны ломать UX, только радовать.

---

## 13. Запреты (важно)

### Что НИКОГДА не делаем

1. ❌ Inline стили везде кроме SVG (всё через Tailwind)
2. ❌ CSS `@keyframes` (только Framer Motion)
3. ❌ Иконочные библиотеки (Material Icons, Font Awesome, Heroicons)
4. ❌ Свои "красивые" цвета — только из палитры этого документа
5. ❌ Мелкий текст < 12px (кроме бейджиков 10-11px)
6. ❌ Спиннеры загрузки (только skeleton)
7. ❌ Модальные окна посередине экрана (только bottom sheets)
8. ❌ `<div onClick>` для кликабельных элементов (только `<button>`)
9. ❌ Чистый `#000000` и `#ffffff`
10. ❌ Тяжёлые шрифты 900 веса
11. ❌ Фиолетовые градиенты (generic AI-стиль)

---

## 14. Чеклист перед коммитом UI

После любых изменений UI проверь:

- [ ] Все цвета из палитры этого файла (не рандомные hex)
- [ ] Шрифты: Inter для UI, Playfair для hero/заголовков
- [ ] Анимации через Framer Motion
- [ ] Skeleton loading для асинхронных данных
- [ ] Валюта везде ₸ с правильным форматом
- [ ] Работает на 375px (iPhone SE)
- [ ] Работает на iPhone PWA (standalone mode)
- [ ] Нет inline styles кроме SVG
- [ ] Тап-зоны >= 44x44px
- [ ] Нет console.log в продакшн-коде

---

**Конец DESIGN-SYSTEM.md**. При конфликте с кодом — этот документ приоритетнее, код правим.
