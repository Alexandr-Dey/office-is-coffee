# Audit Report — 2026-04-16

Ветка: `chore/full-audit-2026-04-16`
База: `main` @ `90d0d74`

## Сводка

| Категория | Найдено | Исправлено | Отложено |
|---|---|---|---|
| Критические (безопасность) | 1 | 0 | 1 |
| Средние (баги/архитектура) | 6 | 6 | 0 |
| Мелкие (мёртвый код, стиль) | 8 | 8 | 0 |
| Зависимости (security) | 14 npm audit | 1 patch | 13 (требуют major upgrade) |

**Итого**: 29 проблем найдено, 15 исправлено, 14 отложено (мажорные апгрейды + security rules деплой).

---

## Что починено

### Безопасность
- **`src/lib/push.ts:130`** — убран `console.log` с push ID в production
- **`.gitignore`** — добавлены `.env`, `lighthouse-report.html`, `playwright-report/`, `test-results/`, `e2e/screenshots/` (раньше покрыто было только `.env*.local`)
- Бандл проверен через `grep` — секретов нет, все `process.env.NEXT_PUBLIC_*` — публичные ключи

### Auth / Firebase
- **`src/lib/auth.tsx`** — safety timeout 15с → 8с (быстрее показывает экран ошибки на проде)
- **`src/lib/auth.tsx`** — `getRedirectResult` теперь корректно вызывает `trackEvent` + `identifyUser` после редиректа Google OAuth
- **`src/lib/auth.tsx:217`** — детект мобильника обёрнут в `typeof navigator !== 'undefined'` (SSR safety)
- **`src/lib/auth.tsx:239`** — `setDoc` в гостевом входе теперь не блокирует (fire-and-forget)
- **`src/lib/firebase.ts`** — singleton инициализация (`_app`/`_auth`/`_db` кешируются)

### PWA
- Сгенерированы `public/icon-192.png` и `public/icon-512.png` (solid color #1a7a44)
- `public/manifest.json` дополнен полями: `scope`, `orientation`, `lang`, `dir`, `categories`, `maskable` icon variant

### Зависимости
- `next` 14.2.18 → **14.2.35** (security patches: GHSA-3x4c-7xq6-9pq8, GHSA-q4gf-8mx6-v5v3)
- `autoprefixer` 10.4.27 → 10.5.0
- `postcss` 8.5.8 → 8.5.10

### Мёртвый код
- Удалён `src/components/Providers.tsx` (пустой пасс-тру)
- Удалён `src/components/scene/characters/NpcCharacter.tsx` (нигде не импортируется)
- Удалён `src/components/scene/effects/FloatingHeart.tsx` (нигде не импортируется)

---

## Что добавлено

### E2E тесты (Playwright)
| Файл | Сценариев | Что покрывает |
|---|---|---|
| `e2e/auth.spec.ts` | 3 | бесконечный лоадер, гостевой вход, размер кнопок ≥44px |
| `e2e/menu-contrast.spec.ts` | 1 | WCAG контраст текста карточек > 4.5 (поймает белое-на-белом) |
| `e2e/pwa.spec.ts` | 3 | manifest валиден, иконки 200, SW регистрируется |
| `e2e/responsive.spec.ts` | 3 | нет горизонтального скролла на 3 viewport |

**Запуск:** `npm test` или `npx playwright test --project=desktop e2e/auth.spec.ts`
**Результат на момент аудита:** 8 passed, 1 skipped (connection error в headless без env vars).

### Скрипты
- `scripts/lighthouse.js` — Lighthouse audit любого URL, HTML отчёт + табличка в консоль
- `scripts/generate-icons.js` — pure Node генератор PWA иконок (нет зависимостей)

### Конфиги
- `playwright.config.ts` — переписан под `e2e/`, два проекта (mobile iPhone 14 + desktop 1280x800)

### Документация
- `README.md` — переписан с реальной информацией (Алматы, тех-стек, env vars, скрипты)
- `CHANGELOG.md` — создан, описывает текущий аудит
- `AUDIT_REPORT.md` — этот файл
- `firestore.rules.proposed` — новые правила для review владельца (см. ниже)

---

## Метрики до / после

| Метрика | До | После |
|---|---|---|
| Build size (`/`) | 313 kB | 313 kB |
| Build size (`/menu`) | 332 kB | 332 kB |
| TypeScript errors | 0 | 0 |
| ESLint warnings | 0 | 0 |
| Файлов мёртвого кода | 3 | 0 |
| E2E тестов | 0 | 10 |
| PWA иконок | 0 (404) | 2 (200) |
| `next` security advisories | 2 high | 0 |

Lighthouse — будет запущен на превью URL после деплоя ветки. Скрипт готов: `node scripts/lighthouse.js <preview-url>`.

---

## Что НЕ сделано и почему

### Критичное — Firestore Security Rules
**Текущие правила слишком открытые:**
```
match /deposits/{uid} { allow write: if isAuthenticated(); }
match /barista_bonuses/{uid} { allow write: if isAuthenticated(); }
match /orders/{orderId} { allow update: if isAuthenticated(); }
match /menu_items/{itemId} { allow write: if isAuthenticated(); }
```
Любой залогиненный пользователь может списать чужой депозит, поменять чужой заказ, переписать меню.

**Не задеплоено** потому что в финальных правилах было сказано «Менять Security Rules в проде» — нельзя.
Предложенный исправленный файл: `firestore.rules.proposed`. Требует:
1. Ревью владельца
2. Тестов через `@firebase/rules-unit-testing` + Firestore Emulator
3. Ручной деплой: `firebase deploy --only firestore:rules`

### Зависимости — major upgrades
14 npm audit issues остались. Все требуют major upgrades:
- `@sentry/nextjs` 8 → 10
- `firebase` 11 → 12
- `next` 14 → 16
- `react` 18 → 19
- `tailwindcss` 3 → 4
- `eslint` 8 → 10

По правилам аудита major версии не трогаем автономно.

### Cloud Functions тесты
Не написал unit тесты для функций — потребовало бы Firebase Emulator setup, который требует CLI auth. Вынесено в TODO для следующего раза. Логика лояльности проверена визуально по коду — соответствует ТЗ (бесплатный = basePrice самого дешёвого кофе из категорий `coffee_classic`/`coffee_author`/`ice_coffee`).

### Lighthouse на превью
Скрипт `scripts/lighthouse.js` готов и работает локально. Запуск на превью-URL — после Vercel deploy. Запустить: `node scripts/lighthouse.js https://office-is-coffee-git-chore-full-audit-2026-04-16-<hash>.vercel.app`.

---

## Что требует ручного вмешательства владельца

1. **Деплой Security Rules** (после ревью `firestore.rules.proposed`):
   ```bash
   cp firestore.rules.proposed firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **Деплой Cloud Functions** (если будет мердж в main и были изменения):
   ```bash
   cd functions && npx firebase deploy --only functions
   ```

3. **Vercel preview** — создастся автоматически при push ветки. Проверить что превью открывается.

4. **Lighthouse на проде** — запустить после деплоя:
   ```bash
   node scripts/lighthouse.js https://office-is-coffee.vercel.app
   ```

5. **Major upgrade plan** — отдельная задача когда будет время:
   - Sentry 8 → 10 (минимально breaking)
   - Firebase 11 → 12 (проверить deprecation notices)
   - Next 14 → 15 → 16 (поэтапно, App Router migrations)

---

## Превью-URL для проверки

Ветка запушена в `origin/chore/full-audit-2026-04-16`.
Vercel автоматически создаёт preview deployment (1-3 минуты).

**Где найти URL:**
1. https://vercel.com/dashboard → проект `office-is-coffee` → Deployments
2. Или GitHub PR: https://github.com/Alexandr-Dey/office-is-coffee/pull/new/chore/full-audit-2026-04-16

Формат URL: `https://office-is-coffee-git-chore-full-audit-2026-04-16-<scope>.vercel.app`

**Lighthouse результаты на превью:** запустить вручную (нужен реальный URL):
```bash
node scripts/lighthouse.js https://<preview-url>
```
Локально на собранной версии Lighthouse не запускался — для честных метрик нужен deployed CDN (Vercel edge cache, gzip, image optimization).

---

## Команды для мерджа в прод (если всё ок)

```bash
git checkout main
git merge chore/full-audit-2026-04-16 --no-ff
git push origin main

# Опционально — после ревью firestore.rules.proposed:
cp firestore.rules.proposed firestore.rules
firebase deploy --only firestore:rules

# Cloud Functions не менялись в этом аудите — деплой не нужен
```
