# TODO-FOR-COWORK.md — Ручные действия

> Этот файл содержит все действия которые требуют работы в веб-интерфейсах,
> ручной настройки или доступа к аккаунтам. Claude Code не может их выполнить.

---

## 1. Firebase Console: включить Google Auth провайдер
- **Где**: Firebase Console -> Authentication -> Sign-in method
- **Что**: Включить Google провайдер
- **Зачем**: Без этого кнопка "Войти через Google" не работает
- **Приоритет**: КРИТИЧНО (блокирует весь auth)

## 2. Firebase Console: назначить роли через Custom Claims
- **Где**: Терминал с service-account.json
- **Что**: 
  1. Скачать service-account.json из Firebase Console -> Project Settings -> Service accounts -> Generate new private key
  2. Положить файл в корень проекта (уже в .gitignore)
  3. Отредактировать `scripts/set-roles.ts` — заменить EMAIL_VITALIY@gmail.com, EMAIL_ASLAN@gmail.com, EMAIL_CEO@gmail.com на реальные email-адреса
  4. Запустить: `npx tsx scripts/set-roles.ts`
- **Зачем**: Без Custom Claims бариста и CEO не смогут получить доступ к /admin и /ceo
- **Приоритет**: КРИТИЧНО

## 3. Firebase Console: деплой Firestore Security Rules
- **Что**: Запустить в терминале:
  ```bash
  npx firebase deploy --only firestore:rules
  ```
- **Зачем**: Новые правила с ролевой моделью не активны до деплоя
- **Приоритет**: КРИТИЧНО

## 4. Firebase Console: деплой Cloud Functions
- **Что**: Запустить в терминале:
  ```bash
  cd functions && npx firebase deploy --only functions
  ```
- **Зачем**: Без деплоя не работают: автопереход статусов, лояльность, стрик, депозит, push
- **Примечание**: `scheduledStreakCheck` требует Blaze план для cron. Если на Spark — закомментировать её
- **Приоритет**: ВЫСОКИЙ

## 5. Firebase Console: сгенерировать VAPID key
- **Где**: Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates -> Generate key pair
- **Что**: Скопировать ключ и добавить:
  - В `.env.local`: `NEXT_PUBLIC_FIREBASE_VAPID_KEY=BHl...`
  - В Vercel -> Project Settings -> Environment Variables: тот же ключ
- **Зачем**: FCM push уведомления не работают без VAPID ключа
- **Приоритет**: СРЕДНИЙ

## 6. Vercel: добавить env переменные
- **Где**: Vercel -> Project Settings -> Environment Variables
- **Что добавить (если ещё не добавлены)**:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  NEXT_PUBLIC_FIREBASE_APP_ID
  NEXT_PUBLIC_FIREBASE_DATABASE_URL
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  NEXT_PUBLIC_FIREBASE_VAPID_KEY (после п.5)
  NEXT_PUBLIC_MIXPANEL_TOKEN (если нужна аналитика)
  NEXT_PUBLIC_SENTRY_DSN (если нужен мониторинг)
  ```
- **Приоритет**: ВЫСОКИЙ

## 7. Firestore: запустить миграцию меню
- **Что**:
  1. Убедиться что service-account.json в корне проекта
  2. Запустить: `npx tsx scripts/migrate-menu.ts`
  3. Проверить в Firebase Console -> Firestore -> menu_items (~69 документов)
- **Зачем**: Меню теперь читается из Firestore, без миграции на /menu будет пусто
- **Приоритет**: КРИТИЧНО

## 8. PWA иконки
- **Что**: Создать и положить в `public/`:
  - `icon-192.png` (192x192)
  - `icon-512.png` (512x512)
  - `apple-touch-icon.png` (180x180, без прозрачности)
- **Зачем**: На iOS при "Добавить на главный экран" — белый квадрат вместо логотипа
- **Приоритет**: НИЗКИЙ

## 9. Sentry: регистрация и DSN
- **Что**: Зарегистрироваться на https://sentry.io, создать Next.js проект, скопировать DSN
- **Куда**: `.env.local` и Vercel env: `NEXT_PUBLIC_SENTRY_DSN=https://...`
- **Приоритет**: НИЗКИЙ

## 10. Mixpanel: регистрация и токен
- **Что**: Зарегистрироваться на https://mixpanel.com, получить токен проекта
- **Куда**: `.env.local` и Vercel env: `NEXT_PUBLIC_MIXPANEL_TOKEN=...`
- **Зачем**: trackEvent вызовы уже в коде, но без токена ничего не трекается
- **Приоритет**: НИЗКИЙ
