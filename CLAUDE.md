# CLAUDE.md — Office is Coffee

> **Этот файл — единственный источник правды о проекте.**
> Прочитай его ПОЛНОСТЬЮ перед любой работой. Не спрашивай подтверждений — работай автономно.
>
> Версия: 2.0 (2026-04-07)
> При изменении архитектуры — обновляй этот файл.

---

## 1. Проект

| Параметр | Значение |
|---|---|
| Название | Office is Coffee |
| Бренд | Love is Coffee |
| Тип | PWA для реальной кофейни |
| Локация | Алматы, Аксай, ул. Момышулы 14 |
| Координаты | 43.2220, 76.8512 |
| Радиус геофенса | 300м |
| Таймзона | UTC+5 (Алматы) |
| Репо | https://github.com/Alexandr-Dey/office-is-coffee |
| Продакшн | https://office-is-coffee.vercel.app |
| Валюта | Тенге ₸ (формат: `1 200₸`, пробел в тысячах) |
| Первые пользователи | Друзья и тестеры |

---

## 2. Стек

**Frontend**: Next.js 14.2.18 App Router, TypeScript strict, Tailwind CSS 3.4, Framer Motion 11.11, canvas-confetti, qrcode.react

**Backend**: Firebase (Firestore, Auth, Cloud Functions v2 Node 18, FCM), Vercel hosting

**Observability**: Mixpanel (не используется), Sentry (настроен частично)

**PWA**: manifest.json + firebase-messaging-sw.js (иконки отсутствуют)

---

## 3. Текущая архитектура (факты, не желания)

### Auth — ФЕЙКОВЫЙ (критический долг)

Пользователь вводит имя, выбирает роль (client/barista/ceo), данные сохраняются в `localStorage['oic_user']`. UID генерится как `user_${timestamp}_${random}`. Firebase Auth НЕ подключён, Custom Claims НЕ существуют.

**Последствия**: `firestore.rules` на Custom Claims не работают, любой может писать куда угодно; Cloud Functions через `request.auth` получают null; любой может выбрать себе роль CEO.

**План**: миграция на Firebase Auth (телефон + SMS OTP) — задача P0-1.

### Cloud Functions — НЕ ЗАДЕПЛОЕНЫ (критический долг)

Код есть в `functions/index.js`, но не задеплоен. Нужен ручной деплой:
```bash
cd functions && npx firebase deploy --only functions
```

Пока не задеплоены — автопереход статусов, лояльность, стрик, депозит, бонусы и push не работают.

### Меню — ХАРДКОД (долг)

Массив `MENU[]` в `src/app/menu/page.tsx`, ~5 категорий, ~20 напитков. Firestore коллекция `menu_items` пустая.

Реальное меню Love is Coffee — 13 категорий, ~70 напитков. Полный список — **MENU-DATA.md**. Миграция — задача P1-1.

### PWA иконки — НЕТ

`public/icon-192.png` и `public/icon-512.png` не существуют. Manifest на них ссылается.

### VAPID key — НЕТ

`NEXT_PUBLIC_FIREBASE_VAPID_KEY` не задан. FCM push не работает даже после деплоя функций.

---

## 4. Структура проекта

```
office-is-coffee/
├── src/
│   ├── app/
│   │   ├── page.tsx                  (144)  Landing: имя → роль → redirect
│   │   ├── layout.tsx                (38)   Root layout + Providers + BottomNav
│   │   ├── globals.css               Tailwind base + кастомные стили
│   │   ├── menu/page.tsx             (586)  Главный: CoffeeScene + меню + корзина
│   │   ├── order/page.tsx            (200)  Оформление заказа
│   │   ├── order/[id]/page.tsx       (254)  Ожидание заказа, real-time
│   │   ├── orders/page.tsx           (120)  История заказов
│   │   ├── coins/page.tsx            (104)  Лояльность + стрик
│   │   ├── profile/page.tsx          (200)  Депозит, QR, гео
│   │   ├── onboarding/page.tsx       (198)  6 шагов
│   │   ├── admin/page.tsx            (542)  Админка баристы (5 вкладок)
│   │   ├── ceo/page.tsx              (119)  CEO дашборд (выплаты)
│   │   └── avatar/page.tsx           (883)  Bitmoji (не в основном flow, НЕ ТРОГАТЬ)
│   ├── components/
│   │   ├── CoffeeScene.tsx           (666)  SVG pixel-art сцена — КЛЮЧЕВОЙ
│   │   ├── BottomNav.tsx             (50)   4 таба
│   │   ├── Toast.tsx                 (73)   Context + компонент
│   │   └── Providers.tsx             (13)   Обёртка (не используется)
│   └── lib/
│       ├── auth.tsx                  (148)  Фейковый Auth Context
│       ├── firebase.ts               (33)   Lazy getters
│       ├── push.ts                   (70)   FCM registration
│       ├── constants.ts              (19)   Координаты, getAlmatyDate
│       └── mixpanel.ts               (30)   Обёртка (не вызывается)
├── functions/
│   ├── index.js                      (246)  5 Cloud Functions
│   └── package.json
├── public/
│   ├── manifest.json                 PWA manifest
│   ├── firebase-messaging-sw.js      FCM service worker
│   └── (icon-192.png, icon-512.png)  ОТСУТСТВУЮТ
├── firestore.rules                   Ролевая модель (не работает без auth)
├── tailwind.config.ts
├── next.config.mjs
├── vercel.json
├── tsconfig.json
├── CLAUDE.md                         Этот файл
├── DESIGN-SYSTEM.md                  Визуальная система
├── SCENE-SPEC.md                     Детальная спека сцены (самое важное)
├── MENU-DATA.md                      Каталог напитков для миграции
├── TASKS.md                          План работ
├── IDEAS.md                          Идеи для будущего
└── QA-CHECKLIST.md                   Ручная проверка
```

**Объём**: ~4780 строк кода.

---

## 5. Firestore Schema

### users/{uid}
```ts
{
  role: 'client' | 'barista' | 'ceo'
  displayName: string
  phone: string                    // E.164: +7XXXXXXXXXX
  loyaltyCount: number             // ТОЛЬКО через Cloud Function
  streak: number                   // ТОЛЬКО через Cloud Function
  lastOrderDate: string            // YYYY-MM-DD UTC+5
  pushToken: string | null
  geolocationAllowed: boolean
  favoriteItem: string | null
  onboardingDone: boolean
  // v2 поля (после перехода на настоящий auth)
  sceneAvatar?: {                  // для отображения клиента в сцене
    hairColor: string
    skinTone: string
    shirtColor: string
    seed: number                   // для стабильной генерации
  }
  createdAt: timestamp
}
```

### orders/{id}
```ts
{
  userId: string                   // ВНИМАНИЕ: userId, не uid (исторически)
  status: 'new' | 'pending' | 'accepted' | 'ready' | 'paid'
  paymentMethod: 'deposit' | 'cash'
  items: Array<{
    id: string
    name: string
    size: 'S' | 'M' | 'L'
    milk: string
    addons: string[]               // сиропы и т.д.
    price: number
    qty: number
  }>
  total: number
  estimatedMinutes: number | null
  rating: 1 | 2 | 3 | null
  baristaBonus: number             // 5 или 0
  isRepeatOrder: boolean
  isFreeByLoyalty: boolean
  baristaid: string | null
  comment: string | null
  paidAt: timestamp | null
  createdAt: timestamp
}
```

### deposits/{uid}
```ts
{
  balance: number
  totalTopup: number
  totalSpent: number
  lastTopupAt: timestamp
  history: Array<{
    type: 'topup' | 'payment' | 'refund'
    amount: number
    date: timestamp
    orderId?: string
    baristaid?: string
  }>
}
```

### barista_bonuses/{uid}
```ts
{
  totalBonus: number
  pendingPayout: number
  payoutRequested: boolean
  history: Array<{
    orderId: string
    amount: number
    date: timestamp
  }>
}
```

### cafe_status/aksay_main
```ts
{
  isOpen: boolean
  stopList: string[]
  openedAt: timestamp
  closedAt: timestamp
}
```

### push_tokens/{uid}
```ts
{
  token: string
  platform: 'web' | 'ios' | 'android'
  createdAt: timestamp
}
```

### menu_items/{id} — ПУСТАЯ, нужна миграция из MENU-DATA.md
```ts
{
  id: string                       // slug: 'raf-classic'
  category: string                 // см. MENU-DATA.md
  name: string                     // "Раф классика"
  ingredients: string | null
  sizes: { S?: number; M?: number; L?: number }
  availableMilk: boolean
  tags: Array<'hit' | 'new' | 'season'>
  activeFrom: string | null        // YYYY-MM-DD
  activeTo: string | null
  radarData: {                     // 1-5 по каждой оси
    acidity: number
    sweetness: number
    bitterness: number
    body: number
    aroma: number
  } | null
  description: string | null
  sortOrder: number
}
```

### scene_ambient (новая коллекция v2)
```ts
// Глобальное состояние сцены, общее для всех клиентов
{
  activeNpcs: Array<{
    id: string
    seed: number
    position: { x: number; y: number }
    action: string                 // 'walking_to_counter' | 'sitting_table_1' | ...
    spawnedAt: timestamp
  }>
  lastUpdated: timestamp
}
```

---

## 6. Cloud Functions

| Функция | Триггер | Что делает |
|---|---|---|
| `onOrderCreate` | orders/{id} created | Auto 'pending', push баристам, списание депозита, loyalty +1, streak |
| `onOrderReady` | orders/{id} updated → 'ready' | Бонус баристе +5₸, push клиенту |
| `onDepositTopup` | HTTPS Callable | Роль barista/ceo, транзакция, push |
| `scheduledStreakCheck` | Cron 12:00 UTC = 17:00 Алматы | Сброс стрика, push "Стрик под угрозой" |
| `onCafeOpen` | cafe_status updated: false→true | Push "Кофейня открыта" |

### Helpers
- `getAlmatyDate(date?)` — "YYYY-MM-DD" в UTC+5
- `sendPush(uid, title, body)` — одиночный
- `sendPushMulti(tokens, title, body)` — multicast
- `getBaristaTokens()` — FCM tokens всех barista/ceo

### Правила
- Все денежные операции — только `db.runTransaction()`
- Все мутации loyalty/streak/deposit/bonus — только здесь
- Деплой: `cd functions && npx firebase deploy --only functions`

---

## 7. Железные правила

### Запреты
1. Никогда не писать с клиента в `loyaltyCount`, `streak`, `deposits`, `barista_bonuses`. Только Cloud Functions.
2. Никогда не использовать `any` в TypeScript.
3. Никогда не удалять рабочий код без причины.
4. Никогда не коммитить `.env.local` или секреты.
5. Никогда не подключать новые библиотеки без явного указания в задаче.
6. Никогда не писать inline стили (кроме SVG в CoffeeScene).
7. Никогда не использовать polling — только `onSnapshot`.
8. **Никогда не трогать** `src/app/avatar/page.tsx`. Он не в основном flow.

### Обязанности
1. Читать CLAUDE.md, DESIGN-SYSTEM.md, SCENE-SPEC.md перед работой.
2. Следовать палитре из DESIGN-SYSTEM.md строго.
3. Все анимации через Framer Motion (не CSS `@keyframes`).
4. Real-time через `onSnapshot`.
5. После каждого блока — `npm run build`.
6. TypeScript strict, все типы явные.
7. Валюта везде ₸, формат `1 200₸`.
8. UI на русском.

### Паттерны

**Real-time listener заказов пользователя**:
```tsx
useEffect(() => {
  if (!uid) return;
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    where('status', 'in', ['pending', 'accepted', 'ready']),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const unsub = onSnapshot(q, (snap) => {
    setActiveOrder(snap.docs[0]?.data() || null);
  });
  return () => unsub();
}, [uid]);
```

**Транзакция списания депозита**:
```ts
await runTransaction(db, async (tx) => {
  const depRef = doc(db, 'deposits', uid);
  const snap = await tx.get(depRef);
  if (!snap.exists()) throw new Error('No deposit');
  const balance = snap.data().balance;
  if (balance < amount) throw new Error('Insufficient');
  tx.update(depRef, {
    balance: balance - amount,
    totalSpent: snap.data().totalSpent + amount,
    history: arrayUnion({
      type: 'payment',
      amount,
      date: serverTimestamp(),
      orderId,
    }),
  });
});
```

---

## 8. Роли и навигация

| Роль | Главная | Доступ |
|---|---|---|
| client | /menu | все client страницы |
| barista | /admin | все client + /admin |
| ceo | /ceo | все + /admin + /ceo |

**Защита роутов**: `useRequireBarista()`, `useRequireCEO()` в `src/lib/auth.tsx`.

**BottomNav** (4 таба) скрыт на: `/`, `/admin`, `/ceo`, `/avatar`, `/onboarding`.

---

## 9. Бизнес-логика

### Лояльность
Счётчик 0-7. При 8 → бесплатный заказ, сброс в 0. Бесплатный не списывает депозит и не даёт бонус баристе.

### Стрик
Ежедневный заказ → +1. Пропуск → 0. Календарные дни UTC+5.

### Депозит
Пополнение — только бариста/CEO. Списание — транзакция при создании заказа. Без лимита (пока).

### Бонусы
+5₸ баристе при `ready`, если не `isFreeByLoyalty`. Защита от дубликатов по `orderId`. CEO выплачивает вручную.

### Заказ
`new → pending → accepted → ready → paid`. Отмена — только до `accepted`.

---

## 10. Сцена — главная фича

**CoffeeScene.tsx — НЕ ДЕКОРАЦИЯ. Это сердце продукта.** Подробности — в **SCENE-SPEC.md**.

Ключевые принципы:
1. **60% главного экрана** (не 220px)
2. Над сценой нет UI
3. Баристы живут богатой рандомной жизнью (20+ действий)
4. В сцене живут клиенты: реальные + фейковые NPC для атмосферы
5. NPC процедурно генерируются (seed-based)
6. Real-time связь с заказами
7. Взаимодействия между NPC, баристами, реальными клиентами

---

## 11. Env

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=       # ОТСУТСТВУЕТ, сгенерировать в Firebase Console
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_MIXPANEL_TOKEN=
```

---

## 12. Процесс работы

### Старт сессии
1. Прочитать CLAUDE.md, DESIGN-SYSTEM.md, SCENE-SPEC.md, TASKS.md
2. Если задачи касаются меню — MENU-DATA.md

### Во время работы
- Задачи строго по порядку P0 → P5
- После каждой задачи: `npm run build`, исправить ошибки
- После каждого блока: git commit
- Не останавливаться, не спрашивать

### В конце
- Финальный build
- Cloud Functions деплой если были изменения
- Git push (Vercel auto-deploy)
- Отчёт: сделано / пропущено / требует ручной проверки

---

## 13. Долги (приоритизированы)

**Критичные**: Auth фейковый, CF не задеплоены, VAPID нет, иконки нет
**Средние**: Меню хардкод, Mixpanel не используется, userId vs uid
**Низкие**: Avatar page (не трогать), Sentry DSN, Playwright тесты

---

## 14. Референсы

- **Coffee Talk** (игра) — атмосфера, спрайты
- **Stardew Valley** — pixel-art с характером
- **Starbucks App** — лояльность, онбординг
- **Pret A Manger** — депозит, quick order

---

**Конец CLAUDE.md**. В конфликте с другими файлами — этот приоритетнее.
