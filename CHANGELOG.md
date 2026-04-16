# CHANGELOG

## 2026-04-16 — Full audit (chore/full-audit-2026-04-16)

### Удалено (мёртвый код)
- `src/components/Providers.tsx` — пустая обёртка, не использовалась
- `src/components/scene/characters/NpcCharacter.tsx` — нигде не импортируется
- `src/components/scene/effects/FloatingHeart.tsx` — нигде не импортируется

### Добавлено
- `e2e/auth.spec.ts` — тесты экрана входа (бесконечный лоадер, размер кнопок)
- `e2e/menu-contrast.spec.ts` — тест контраста текста карточек (WCAG AA > 4.5)
- `e2e/pwa.spec.ts` — manifest, иконки, Service Worker
- `e2e/responsive.spec.ts` — горизонтальный скролл на 3 viewport
- `playwright.config.ts` — переписан под `e2e/`, два проекта (mobile/desktop)
- `scripts/lighthouse.js` — Lighthouse audit на любой URL
- `scripts/generate-icons.js` — генератор PWA иконок без зависимостей
- `public/icon-192.png` + `public/icon-512.png` — solid color #1a7a44 плейсхолдеры
- `firestore.rules.proposed` — ужесточённые правила (НЕ задеплоены)

### Обновлено
- `next` 14.2.18 → **14.2.35** (security patches)
- `autoprefixer`, `postcss` — patch updates
- `manifest.json` — добавлены `scope`, `orientation`, `lang`, `categories`, `maskable` icon
- `src/lib/auth.tsx` — safety timeout 15с → 8с, нормальный getRedirectResult с trackEvent
- `src/lib/push.ts` — убран console.log в production
- `README.md` — реальное описание проекта, env vars, скрипты
- `.gitignore` — добавлены `.env`, `lighthouse-report.html`, `e2e/screenshots/`, `playwright-report/`, `test-results/`

### НЕ сделано (требует ручной команды владельца)
- **Firestore Security Rules** — текущие слишком открыты (любой auth может писать в `deposits`, `orders`).
  Предложенный фикс — `firestore.rules.proposed`. Перед деплоем протестировать через эмулятор.
- Major version updates: Next 16, React 19, Firebase 12, Tailwind 4, Sentry 10 — оставлены на 14.2/18/11/3/8 (риск мажорных breaking changes)
- 14 npm audit vulnerabilities — все требуют major upgrades, не делал
