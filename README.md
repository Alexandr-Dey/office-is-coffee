# Love is Coffee — PWA

PWA для кофейни Love is Coffee (Алматы, ул. Назарбаева 226).
Заказы, лояльность (8-й кофе бесплатно), стрики, депозит, push-уведомления.

## Стек

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **Backend:** Firebase — Auth, Firestore, Cloud Functions v2 (Node 20), FCM
- **Хостинг:** Vercel (https://office-is-coffee.vercel.app)
- **Observability:** Sentry (ошибки), Mixpanel (отключён, стабы)

## Локальный запуск

```bash
npm install
npm run dev          # http://localhost:3000
```

Нужны env vars в `.env.local` (см. **Переменные окружения** ниже).

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | Dev сервер с HMR |
| `npm run build` | Production билд |
| `npm run start` | Запуск собранного приложения |
| `npm run lint` | ESLint |
| `npm test` | Playwright E2E тесты |
| `node scripts/lighthouse.js [URL]` | Lighthouse аудит |
| `node scripts/generate-icons.js` | Перегенерация PWA иконок |

## Переменные окружения

Все `NEXT_PUBLIC_*` доступны на клиенте. Без префикса — только сервер.

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=          # для FCM web push
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_MIXPANEL_TOKEN=              # сейчас не используется (стабы)
SENTRY_DSN=                              # для server-side
```

## Cloud Functions

Деплой: `cd functions && npx firebase deploy --only functions`

| Функция | Триггер |
|---|---|
| `onOrderCreate` | `orders/{id}` created |
| `onOrderReady` | `orders/{id}` updated → ready |
| `onDepositTopup` | HTTPS Callable (barista/ceo only) |
| `scheduledStreakCheck` | Cron 12:00 UTC |
| `onCafeOpen` | `cafe_status` updated false→true |
| `sendManualPush` | Callable (CEO only) |
| `trackPushOpened` | Callable |
| `migrateStopList` | Callable (one-time) |

## Структура проекта

См. **CLAUDE.md** — единственный источник правды по архитектуре, бизнес-логике и правилам разработки.

## Деплой

- **Vercel** — автодеплой при push в `main` (production), preview для других веток
- **Functions** — ручной деплой: `firebase deploy --only functions`
- **Firestore Rules** — ручной: `firebase deploy --only firestore:rules`

## Тестирование

```bash
npm test                         # все Playwright тесты
npx playwright test --project=mobile     # только мобильные viewport
npx playwright test --project=desktop    # только desktop
```
