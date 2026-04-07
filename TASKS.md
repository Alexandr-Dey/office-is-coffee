# TASKS.md — Office is Coffee

> План работ для Claude Code. Выполняй задачи СТРОГО по порядку P0 → P5.
> Не пропускай. Не задавай вопросов. Не жди подтверждений.
>
> Перед началом обязательно прочитай: CLAUDE.md, DESIGN-SYSTEM.md, SCENE-SPEC.md.
> Для задач с меню — также MENU-DATA.md.
>
> После каждой задачи: `npm run build`. Если упал — чини.
> После каждого блока (P0/P1/P2/...): git commit с осмысленным сообщением.
> В конце: финальный build, деплой функций, git push, отчёт.
>
> Версия: 1.0 (2026-04-07)

---

## Условные обозначения

- **P0** — Критический фундамент, без него ничего не работает
- **P1** — Базовая стабилизация (миграция меню, фундаментальная админка)
- **P2** — Сцена Phase 1 (новая компоновка, базовая жизнь)
- **P3** — NPC и взаимодействия
- **P4** — Эффекты (освещение, погода)
- **P5** — Полировка и пасхалки

**Файлы**: `путь/к/файлу.tsx` относительно корня проекта.
**Зависит от**: какие задачи должны быть выполнены раньше.
**Готово когда**: чеклист, который должен пройти перед коммитом.

---

# P0 — Критический фундамент

## P0-1: Google OAuth авторизация

**Файлы**:
- `src/lib/auth.tsx` (полностью переписать)
- `src/lib/firebase.ts` (добавить getAuth)
- `src/app/page.tsx` (переписать landing)
- `src/app/layout.tsx` (обновить AuthProvider)

**Контекст**: 
Сейчас auth фейковый (имя + localStorage). Это блокирует продакшн и Cloud Functions через `request.auth`. Делаем настоящий Firebase Auth через Google OAuth — бесплатно, без SMS, без привязки карты.

**Что сделать**:
1. В Firebase Console → Authentication → Sign-in method → включить **Google**.
2. В `src/lib/firebase.ts` добавить `getFirebaseAuth()`:
```ts
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

let _auth: ReturnType<typeof getAuth> | null = null;

export const getFirebaseAuth = () => {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
};

export const googleProvider = new GoogleAuthProvider();
```

3. Переписать `src/lib/auth.tsx`:
   - Использовать `onAuthStateChanged` вместо localStorage
   - Хранить пользователя из Firebase Auth
   - При первом входе — создавать документ в `users/{uid}` с дефолтами
   - `signInWithGoogle()`, `signOut()` функции
   - Хук `useAuth()` возвращает `{ user, loading, signInWithGoogle, signOut }`
   - Хуки `useRequireAuth()`, `useRequireBarista()`, `useRequireCEO()` (читают role из Firestore документа `users/{uid}.role`)

4. Переписать `src/app/page.tsx`:
   - Если уже залогинен → redirect по роли (client → /menu, barista → /admin, ceo → /ceo)
   - Если не залогинен → большая кнопка "Войти через Google" с логотипом Google
   - После входа → проверить onboardingDone → redirect /onboarding или /menu
   - Никаких полей "введи имя" — имя берётся из Google аккаунта

5. **Назначение ролей** (одноразово):
   - Создать файл `scripts/set-roles.ts`:
```ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: cert(require('../service-account.json')) });

const ROLES = {
  'EMAIL_VITALIY@gmail.com': 'barista',
  'EMAIL_ASLAN@gmail.com': 'barista',
  'EMAIL_CEO@gmail.com': 'ceo',
};

async function setRoles() {
  for (const [email, role] of Object.entries(ROLES)) {
    const user = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(user.uid, { role });
    console.log(`Set role ${role} for ${email}`);
  }
}

setRoles().catch(console.error);
```
   - Вместо EMAIL_* плейсхолдеров — оставь их как есть, пользователь сам впишет реальные emails.

**Зависит от**: ничего

**Запреты**:
- Не удалять `src/lib/auth.tsx` — переписывай содержимое
- Не подключать SMS Phone Auth (это P3)
- Не убирать существующие маршруты — только обновлять защиту

**Готово когда**:
- [ ] При заходе на сайт пользователь видит экран с кнопкой "Войти через Google"
- [ ] После клика открывается стандартный Google popup
- [ ] После входа создаётся документ в `users/{uid}` с `role: 'client'`, `displayName: <имя из Google>`, `onboardingDone: false`
- [ ] Существующий пользователь редиректится на /menu (или /onboarding если первый раз)
- [ ] `useAuth()` возвращает залогиненного пользователя
- [ ] `npm run build` проходит
- [ ] localStorage больше не используется для auth

---

## P0-2: Firestore Security Rules

**Файлы**:
- `firestore.rules`

**Контекст**:
После настоящего auth у `request.auth.token` появятся Custom Claims с ролью. Перепиши правила так, чтобы они работали корректно.

**Что сделать**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }
    
    function hasRole(role) {
      return isAuthenticated() && request.auth.token.role == role;
    }
    
    function isBaristaOrCEO() {
      return hasRole('barista') || hasRole('ceo');
    }
    
    function isCEO() {
      return hasRole('ceo');
    }
    
    // users
    match /users/{uid} {
      allow read: if isOwner(uid) || isBaristaOrCEO();
      // Создание только при регистрации (через client SDK)
      allow create: if isOwner(uid);
      // Обновление: владелец может обновлять только определённые поля
      allow update: if isOwner(uid) 
        && !request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['role', 'loyaltyCount', 'streak']);
      // CEO может менять role
      allow update: if isCEO();
      allow delete: if false;
    }
    
    // orders
    match /orders/{orderId} {
      allow read: if (resource.data.userId == request.auth.uid) || isBaristaOrCEO();
      allow create: if isAuthenticated() 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.status == 'new';
      // Только бариста/CEO могут менять статус
      allow update: if isBaristaOrCEO();
      allow delete: if false;
    }
    
    // deposits — только чтение владельца + бариста/CEO
    match /deposits/{uid} {
      allow read: if isOwner(uid) || isBaristaOrCEO();
      // Запись ТОЛЬКО через Cloud Functions (admin SDK обходит правила)
      allow write: if false;
    }
    
    // barista_bonuses — только сам бариста + CEO
    match /barista_bonuses/{uid} {
      allow read: if isOwner(uid) || isCEO();
      allow write: if false;
    }
    
    // cafe_status
    match /cafe_status/{cafeId} {
      allow read: if true;
      allow write: if isBaristaOrCEO();
    }
    
    // push_tokens
    match /push_tokens/{uid} {
      allow read: if isOwner(uid);
      allow write: if isOwner(uid);
    }
    
    // menu_items
    match /menu_items/{itemId} {
      allow read: if true;
      allow write: if isCEO();
    }
    
    // cache (для погоды)
    match /cache/{docId} {
      allow read: if true;
      allow write: if false; // только Cloud Functions
    }
    
    // scene_ambient (NPC состояние)
    match /scene_ambient/{docId} {
      allow read: if true;
      allow write: if false; // только Cloud Functions
    }
    
    // promo_codes (на будущее)
    match /promo_codes/{code} {
      allow read: if isAuthenticated();
      allow write: if isCEO();
    }
  }
}
```

**Зависит от**: P0-1

**Готово когда**:
- [ ] Файл `firestore.rules` обновлён
- [ ] Запушено в Firebase: `npx firebase deploy --only firestore:rules`
- [ ] В Firebase Console → Firestore → Rules видна новая версия
- [ ] Тестовый запрос с клиента: попытка изменить `users/{uid}.loyaltyCount` → отклоняется

---

## P0-3: Деплой Cloud Functions

**Файлы**:
- `functions/index.js`
- `functions/package.json`

**Контекст**: 
Функции есть в коде, но никогда не деплоились. Без них не работают: автопереход статусов, лояльность, депозит, push.

**Что сделать**:
1. Проверить `functions/package.json` — должны быть `firebase-admin: ^12`, `firebase-functions: ^5`, `node: 18` в `engines`.
2. В `functions/index.js` — пройтись по всем 5 функциям:
   - `onOrderCreate` — проверить транзакции
   - `onOrderReady` — проверить защиту от дубликатов
   - `onDepositTopup` — проверить роль через `request.auth.token.role`
   - `scheduledStreakCheck` — формат cron expression
   - `onCafeOpen` — фильтр `false → true`
3. **Авторизация Firebase CLI** (если ещё не):
```bash
cd functions
npx firebase login
npx firebase use <PROJECT_ID>
```
4. Деплой:
```bash
cd functions
npx firebase deploy --only functions
```
5. Если ошибки — чини. Типичные:
   - "Function failed on loading user code" → синтаксис, проверь логи
   - "Billing not enabled" → нужен Blaze план для cron функций. Но `scheduledStreakCheck` можно заменить на webhook + внешний cron, если не хочется Blaze.
   - **Для Spark плана**: можно временно закомментировать `scheduledStreakCheck` и заменить на внешний cron (например, cron-job.org → HTTP endpoint).

**Зависит от**: P0-1, P0-2

**Готово когда**:
- [ ] `npx firebase deploy --only functions` завершается успешно
- [ ] В Firebase Console → Functions видны 5 функций (или 4 + комментарий по scheduled)
- [ ] Тестовый заказ → автоматически становится `pending`
- [ ] При accepted → ready: бонус начисляется баристе в `barista_bonuses/{uid}`

---

## P0-4: VAPID key и FCM push

**Файлы**:
- `.env.local` (создать если нет)
- `.env.example` (обновить)
- `src/lib/push.ts` (проверить)
- `public/firebase-messaging-sw.js` (проверить)

**Контекст**:
FCM Push не работает без VAPID ключа. Сгенерировать в Firebase Console.

**Что сделать**:
1. Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → **Generate key pair**.
2. Скопировать ключ в `.env.local`:
```
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BHl...
```
3. В Vercel → Project Settings → Environment Variables — добавить тот же ключ для production.
4. Проверить `src/lib/push.ts`:
   - `getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })`
   - Сохранение токена в `users/{uid}.pushToken` И в `push_tokens/{uid}`
   - Запрос разрешения через `Notification.requestPermission()`
5. Проверить `public/firebase-messaging-sw.js`:
   - Импорты Firebase правильные (используй `importScripts` для compat версии 9.x)
   - `messaging.onBackgroundMessage` обрабатывает входящие
   - При клике на нотификацию — открывается правильная страница
6. Запустить локально: `npm run dev` → /menu → принять разрешение на push → проверить токен в `push_tokens` коллекции.

**Зависит от**: P0-1, P0-3

**Готово когда**:
- [ ] VAPID ключ в env переменных (локально и на Vercel)
- [ ] При первом заходе на /menu появляется системный запрос на уведомления
- [ ] После принятия — токен сохраняется в `push_tokens/{uid}`
- [ ] Тестовый push отправляется (через Firebase Console → Cloud Messaging → Send test) и получается на устройстве
- [ ] Клик на уведомление открывает нужную страницу

---

## P0-5: PWA иконки

**Файлы**:
- `public/icon-192.png` (создать)
- `public/icon-512.png` (создать)
- `public/apple-touch-icon.png` (создать, 180x180)
- `public/manifest.json` (проверить ссылки)

**Контекст**: 
Manifest ссылается на иконки, которых нет. На iOS при "Добавить на главный экран" появляется белый квадрат вместо логотипа.

**Что сделать**:
1. Использовать **сердце Love is Coffee** как иконку (красное сердце с белым кофейным зерном внутри на зелёном фоне):
   - Если есть готовый логотип кофейни — взять его
   - Если нет — создать через Figma/Canva/Photoshop
   - Альтернативно: использовать https://realfavicongenerator.net/ для генерации полного набора иконок из одного PNG
2. Размеры:
   - `icon-192.png` — 192x192px
   - `icon-512.png` — 512x512px
   - `apple-touch-icon.png` — 180x180px (без прозрачности, иначе iOS делает чёрный фон)
3. Положить в `public/`
4. Проверить `manifest.json`:
```json
{
  "name": "Office is Coffee",
  "short_name": "OiC",
  "start_url": "/menu",
  "display": "standalone",
  "background_color": "#f2fdf6",
  "theme_color": "#1a7a44",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```
5. В `src/app/layout.tsx` добавить мета-теги для iOS:
```tsx
<head>
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Love is Coffee" />
  <meta name="theme-color" content="#1a7a44" />
</head>
```

**Зависит от**: ничего

**Готово когда**:
- [ ] 3 файла иконок в `public/`
- [ ] Manifest.json валиден (https://manifest-validator.appspot.com/)
- [ ] На iPhone Safari "Поделиться → На экран Домой" — иконка появляется как красное сердце
- [ ] На Android Chrome "Установить приложение" — иконка отображается

---

## P0-6: Защита роутов и обновление навигации

**Файлы**:
- `src/lib/auth.tsx`
- `src/components/BottomNav.tsx`
- `src/app/admin/page.tsx`
- `src/app/ceo/page.tsx`

**Контекст**:
После настоящего auth нужно убедиться что роуты защищены правильно.

**Что сделать**:
1. В `src/lib/auth.tsx` добавить хуки:
```tsx
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading]);
  return { user, loading };
}

export function useRequireBarista() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/'); return; }
    if (user.role !== 'barista' && user.role !== 'ceo') {
      router.push('/menu');
    }
  }, [user, loading]);
  return { user, loading };
}

export function useRequireCEO() { /* аналогично, только role === 'ceo' */ }
```

2. В `src/app/admin/page.tsx` в начале компонента:
```tsx
const { user, loading } = useRequireBarista();
if (loading) return <SkeletonAdmin />;
```

3. В `src/app/ceo/page.tsx` — `useRequireCEO()`.

4. В `src/components/BottomNav.tsx` — скрывать таб "Профиль" для barista и CEO (у них нет клиентского профиля), показывать ссылку "Админка" вместо одного из табов.

**Зависит от**: P0-1

**Готово когда**:
- [ ] Клиент не может зайти на /admin → редирект на /menu
- [ ] Бариста заходит на /admin → видит админку
- [ ] CEO заходит на /ceo → видит дашборд
- [ ] BottomNav скрыт на /admin, /ceo, /, /onboarding

---

## P0-7: Sentry активация

**Файлы**:
- `.env.local`
- `sentry.client.config.ts`
- `sentry.server.config.ts`

**Контекст**:
Sentry уже настроен в коде, но DSN может быть не задан → ошибки никуда не уходят.

**Что сделать**:
1. Зарегистрироваться на https://sentry.io (бесплатный план)
2. Создать проект → Next.js
3. Скопировать DSN
4. Добавить в `.env.local` и Vercel:
```
NEXT_PUBLIC_SENTRY_DSN=https://...
```
5. Проверить `sentry.client.config.ts` — `Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })`
6. Тестовая ошибка: добавить временную кнопку "Test Sentry" в /profile, при клике `throw new Error('Test')`. Проверить что ошибка появляется в Sentry dashboard.
7. Удалить тестовую кнопку.

**Зависит от**: ничего

**Готово когда**:
- [ ] DSN добавлен в env
- [ ] Тестовая ошибка приходит в Sentry dashboard
- [ ] Тестовая кнопка удалена

---

## ⛔ Чек-пойнт после P0

**Перед началом P1 проверь**:
- [ ] `npm run build` проходит без ошибок
- [ ] Деплой на Vercel прошёл (`git push origin main`)
- [ ] Сайт открывается, можно войти через Google
- [ ] `firestore.rules` задеплоены
- [ ] Cloud Functions задеплоены (или scheduled закомментирована)
- [ ] VAPID работает, push приходит
- [ ] Иконки PWA на месте
- [ ] Sentry получает ошибки

**Git commit**: `feat: P0 фундамент — Google Auth, security rules, Cloud Functions, FCM, PWA icons, Sentry`

---

# P1 — Базовая стабилизация

## P1-1: Миграция меню в Firestore

**Файлы**:
- `scripts/migrate-menu.ts` (создать)
- `MENU-DATA.json` (создать как экспорт из MENU-DATA.md)
- `src/app/menu/page.tsx` (рефакторинг — чтение из Firestore)
- `src/lib/types.ts` (создать если нет, добавить тип `MenuItem`)

**Контекст**:
Сейчас меню хардкодом ~20 напитков. По фото меню кофейни — должно быть ~70 напитков в 13 категориях. Все цены, теги и описания — в MENU-DATA.md.

**Что сделать**:
1. Создать `MENU-DATA.json` — извлечь все JSON блоки из MENU-DATA.md в один массив:
```json
[
  { "id": "cappuccino", "category": "classic-coffee", "name": "Капучино", ... },
  { "id": "latte", ... },
  ...
]
```
**ВАЖНО**: внимательно перенести все позиции из всех 13 категорий MENU-DATA.md. Не пропускай.

2. Создать `scripts/migrate-menu.ts`:
```ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import menuData from '../MENU-DATA.json';

initializeApp({
  credential: cert(require('../service-account.json')),
});

const db = getFirestore();

async function migrate() {
  const batch = db.batch();
  
  for (const item of menuData) {
    const ref = db.collection('menu_items').doc(item.id);
    batch.set(ref, {
      ...item,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(`✅ Migrated ${menuData.length} menu items`);
}

migrate().catch(console.error);
```

3. Скачать service account из Firebase Console → Project Settings → Service accounts → Generate new private key. Положить в корень как `service-account.json`. **Добавить в .gitignore!**

4. Запустить миграцию: `npx tsx scripts/migrate-menu.ts`. Проверить в Firebase Console что появились ~70 документов.

5. Обновить `src/app/menu/page.tsx`:
```tsx
const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const q = query(
    collection(db, 'menu_items'),
    orderBy('sortOrder', 'asc')
  );
  return onSnapshot(q, (snap) => {
    setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    setLoading(false);
  });
}, []);
```

6. Удалить хардкодный массив `MENU[]` из файла полностью.

7. Проверить фильтрацию по категориям, бейджи, цены, доступность молока.

8. Найти и исправить наценку на молоко: должно быть **+500₸ за альтернативное молоко**, не +150/+200. Это ошибка в текущем коде — на фото меню чётко указано "альтернативное молоко 500".

9. Добавить опцию **сиропа +200₸** в выбор при оформлении.

**Зависит от**: P0-1

**Запреты**:
- Не выдумывай позиции, которых нет в MENU-DATA.md
- Не меняй цены — они с реального меню кофейни
- Не удаляй всю меню-страницу, только массив MENU[]

**Готово когда**:
- [ ] В Firestore коллекция `menu_items` содержит ~70 документов
- [ ] /menu отображает все категории и напитки из Firestore
- [ ] Категорий 13 (не 5)
- [ ] Капучино: 850/1050/1150₸
- [ ] HIT-бейджи у правильных позиций (Раф классика, Раф медовый, Фраппучино, Глинтвейн, и т.д. — см. MENU-DATA.md)
- [ ] При выборе альтернативного молока → +500₸
- [ ] При выборе сиропа → +200₸
- [ ] `npm run build` проходит

---

## P1-2: CEO интерфейс управления меню

**Файлы**:
- `src/app/ceo/page.tsx` (расширить)
- `src/app/ceo/menu/page.tsx` (создать)
- `src/components/MenuItemEditor.tsx` (создать)

**Контекст**:
После миграции в Firestore — нужен интерфейс чтобы CEO мог редактировать меню без программиста (цены меняются, сезонные приходят, и т.д.).

**Что сделать**:
1. В /ceo добавить новую вкладку "Меню" → ссылка на /ceo/menu
2. На /ceo/menu:
   - Список всех `menu_items`, сгруппированных по категориям
   - У каждой позиции: кнопки "Редактировать", "Удалить", переключатель "Доступен"
   - Кнопка "+ Добавить позицию"
3. `MenuItemEditor` — модальное окно (bottom sheet):
   - Поля: name, category (select), sizes (S/M/L цены), tags (checkboxes), milkAvailable (toggle), description, ingredients, sortOrder, activeFrom/activeTo (для сезонных)
   - Сохранение через `setDoc(doc(db, 'menu_items', id), data)`
4. **Защита**: только CEO. Используй `useRequireCEO()`.

**Зависит от**: P1-1

**Готово когда**:
- [ ] CEO может редактировать любое поле любой позиции
- [ ] Изменения видны на /menu в реальном времени (через onSnapshot)
- [ ] Можно добавить новую позицию
- [ ] Можно удалить позицию
- [ ] Стоп-лист (toggle "Доступен") работает мгновенно

---

## P1-3: Систематический QA-проход

**Файлы**: все

**Контекст**:
Тестеры (включая тебя) видели баги, но конкретного списка нет. Делаем системный проход по всему проекту, ищем и исправляем.

**Что сделать**:
Пройдись по каждому экрану в этом порядке и найди проблемы. Используй DevTools на iPhone Safari (через Mac) и Chrome DevTools для Android.

### /
- [ ] Кнопка Google входа работает
- [ ] После входа — правильный редирект
- [ ] Loading state не дёргается

### /onboarding
- [ ] Все 6 шагов проходятся
- [ ] Геолокация: запрос только после тапа на кнопку
- [ ] Push: запрос только после тапа на кнопку
- [ ] iOS PWA шаг показывается только на iPhone не в PWA режиме
- [ ] После завершения onboardingDone = true в Firestore

### /menu
- [ ] CoffeeScene рендерится
- [ ] Меню загружается из Firestore (не из хардкода)
- [ ] Категории прокручиваются
- [ ] Тап на карточку → bottom sheet с деталями
- [ ] Выбор размера, молока, сиропа → правильная цена
- [ ] Добавление в корзину → счётчик в углу обновляется
- [ ] Hero-карточка отображается

### /order (оформление)
- [ ] Корзина показывает выбранные позиции
- [ ] Можно изменить количество
- [ ] Выбор оплаты: депозит / наличные
- [ ] Если депозит и не хватает баланса → блокировка кнопки
- [ ] Поле комментария работает
- [ ] При создании заказа → редирект на /order/[id]

### /order/[id] (ожидание)
- [ ] Real-time обновление статуса работает
- [ ] Таймер обратного отсчёта (если accepted)
- [ ] CoffeeScene на экране ожидания тоже работает
- [ ] При ready → confetti
- [ ] Кнопка "Я в пути" (если есть)
- [ ] После paid → форма рейтинга

### /orders (история)
- [ ] Загружаются заказы текущего юзера
- [ ] Кнопка "Повторить" работает
- [ ] Skeleton при загрузке

### /coins (лояльность)
- [ ] 8 чашек отображаются правильно (заполненные/пустые)
- [ ] Стрик отображается с правильным числом дней
- [ ] При loyaltyCount === 8 → особое состояние "ваш следующий бесплатный"

### /profile
- [ ] Баланс депозита отображается
- [ ] QR-код генерируется
- [ ] Геолокация можно включить/выключить
- [ ] Push разрешение можно поменять (если возможно)
- [ ] Кнопка "Выйти" работает

### /admin (для бариста)
- [ ] Только бариста/CEO имеют доступ
- [ ] 5 вкладок: Заказы, Депозиты, Бонусы, Стоп-лист, Кафе
- [ ] Real-time обновление новых заказов
- [ ] Можно сменить статус заказа
- [ ] Пополнение депозита работает (вызов Cloud Function)
- [ ] Стоп-лист обновляется мгновенно у клиентов

### /ceo
- [ ] Только CEO
- [ ] Видны суммы к выплате каждому баристе
- [ ] Кнопка "Выплачено" работает (сброс pendingPayout)
- [ ] Управление меню (после P1-2)

### Cross-cutting
- [ ] Все цены в формате `1 200₸`
- [ ] Нигде нет "тг", "KZT", "T"
- [ ] Все loading состояния используют skeleton, не spinner
- [ ] Bottom Nav скрыт на правильных страницах
- [ ] Нет console.errors при стандартных действиях

### Mobile-specific (на iPhone Safari в PWA режиме)
- [ ] Safe area внизу для notch
- [ ] Скролл работает плавно
- [ ] Тапы не висят (no 300ms delay)
- [ ] Backдеют button работает (если есть)
- [ ] Push приходят даже когда PWA закрыто

**Контекст для Claude Code**: пройдись по этому списку, открывай каждый файл, ищи проблемы, фикси. Не нужно идти на iPhone — проверь то что можно проверить через код, остальное оставь в QA-CHECKLIST.md как задачу для пользователя.

**Зависит от**: P0 полностью + P1-1

**Готово когда**:
- [ ] Все пункты выше проверены
- [ ] Найденные баги исправлены
- [ ] Список оставшихся проблем сохранён в `KNOWN-ISSUES.md` для ручной проверки

---

## P1-4: Mixpanel трекинг ключевых событий

**Файлы**:
- `src/lib/mixpanel.ts` (проверить)
- Множество компонентов (добавить вызовы)

**Контекст**:
Mixpanel инициализирован, но `trackEvent` нигде не вызывается. Без трекинга мы не узнаем как используется приложение.

**Что сделать**:
Добавить `trackEvent` вызовы на ключевых действиях:

```ts
// Регистрация
trackEvent('User Signed Up', { method: 'google' });

// Завершение онбординга
trackEvent('Onboarding Completed', { stepsCompleted: 6 });

// Просмотр меню
trackEvent('Menu Viewed', { category: 'classic-coffee' });

// Добавление в корзину
trackEvent('Item Added to Cart', { itemId, name, size, milk, price });

// Создание заказа
trackEvent('Order Created', { 
  total, paymentMethod, itemsCount, isRepeat 
});

// Получение заказа
trackEvent('Order Received', { orderId, waitTime });

// Рейтинг
trackEvent('Order Rated', { rating });

// Пополнение депозита
trackEvent('Deposit Topped Up', { amount });

// Бесплатный кофе по лояльности
trackEvent('Loyalty Reward Earned');

// Открытие пасхалки
trackEvent('Easter Egg Triggered', { type: 'vitaliy_8_taps' });
```

В `src/lib/mixpanel.ts` обернуть `mixpanel.track()` для безопасности (не падать если токен не настроен):
```ts
export function trackEvent(name: string, properties?: Record<string, any>) {
  try {
    if (typeof window === 'undefined') return;
    mixpanel.track(name, properties);
  } catch (e) {
    console.error('Mixpanel error:', e);
  }
}
```

**Зависит от**: ничего

**Готово когда**:
- [ ] 10+ ключевых событий трекаются
- [ ] В Mixpanel dashboard видны события (если токен настроен)
- [ ] Не падает если токен не настроен

---

## ⛔ Чек-пойнт после P1

- [ ] Build, deploy, git push
- [ ] Меню в Firestore работает
- [ ] CEO может редактировать меню
- [ ] QA-проход показал все основные проблемы исправлены
- [ ] Mixpanel трекает события

**Git commit**: `feat: P1 миграция меню в Firestore, CEO интерфейс, QA fixes, Mixpanel`

---

# P2 — Сцена Phase 1 (новая компоновка и базовая жизнь)

> Перед началом P2 ОБЯЗАТЕЛЬНО перечитай SCENE-SPEC.md.

## P2-1: Реструктуризация компонента CoffeeScene

**Файлы**:
- `src/components/CoffeeScene.tsx` (полностью переписать)
- `src/components/scene/` (новая папка со структурой из SCENE-SPEC.md раздел 2.3)

**Контекст**:
Текущий CoffeeScene — 666 строк в одном файле. По SCENE-SPEC.md нужна модульная структура с папками layers/, characters/, behaviors/, effects/, utils/.

**Что сделать**:
1. Создать структуру папок:
```
src/components/scene/
├── layers/
│   ├── BackgroundLayer.tsx
│   ├── FurnitureLayer.tsx
│   ├── ObjectsLayer.tsx
│   ├── SpritesLayer.tsx
│   └── EffectsLayer.tsx
├── characters/
│   ├── BaristaVitaliy.tsx
│   ├── BaristaAslan.tsx
│   └── NpcCharacter.tsx
├── behaviors/
│   ├── baristaIdleActions.ts
│   └── sceneTime.ts
├── effects/
│   ├── Steam.tsx
│   └── OrderBubble.tsx
└── utils/
    └── procGen.ts
```

2. Переписать `CoffeeScene.tsx` как тонкий wrapper:
```tsx
'use client';
import { BackgroundLayer } from './scene/layers/BackgroundLayer';
import { FurnitureLayer } from './scene/layers/FurnitureLayer';
import { ObjectsLayer } from './scene/layers/ObjectsLayer';
import { SpritesLayer } from './scene/layers/SpritesLayer';
import { EffectsLayer } from './scene/layers/EffectsLayer';

interface CoffeeSceneProps {
  userUid: string | null;
  activeOrder: Order | null;
  streakDays: number;
  lastOrderDate: string | null;
}

export default function CoffeeScene({ userUid, activeOrder, streakDays, lastOrderDate }: CoffeeSceneProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      className="w-full h-full"
      style={{ shapeRendering: 'crispEdges' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <BackgroundLayer />
      <FurnitureLayer />
      <ObjectsLayer orderStatus={activeOrder?.status ?? 'idle'} />
      <SpritesLayer 
        activeOrder={activeOrder}
        streakDays={streakDays}
        lastOrderDate={lastOrderDate}
      />
      <EffectsLayer orderStatus={activeOrder?.status ?? 'idle'} />
    </svg>
  );
}
```

3. Распределить существующий код по новым файлам.

4. Каждый файл должен быть **< 300 строк**. Если больше — разбивай на подкомпоненты.

**Зависит от**: ничего (но требует SCENE-SPEC.md прочитать)

**Запреты**:
- Не удалять старый CoffeeScene.tsx до того как новая структура работает
- Не оставлять все 666 строк в одном файле "пока что"

**Готово когда**:
- [ ] Структура папок создана
- [ ] CoffeeScene.tsx < 50 строк (только импорты и композиция)
- [ ] Все слои в отдельных файлах
- [ ] Каждый файл < 300 строк
- [ ] Сцена визуально работает как раньше (только переехала)

---

## P2-2: Новая компоновка viewBox 800x600

**Файлы**:
- `src/components/scene/layers/BackgroundLayer.tsx`
- `src/components/scene/layers/FurnitureLayer.tsx`
- `src/components/scene/layers/ObjectsLayer.tsx`
- `src/app/menu/page.tsx` (изменить layout)

**Контекст**:
Сейчас сцена 390x220. По SCENE-SPEC.md — должна быть 800x600 и занимать 60% экрана.

**Что сделать**:
1. В `/menu/page.tsx` — изменить layout сцены:
```tsx
<div className="min-h-screen bg-brand-bg">
  {/* Сцена: 60vh, без паддингов */}
  <div className="h-[60vh] relative overflow-hidden">
    <CoffeeScene {...sceneProps} />
  </div>
  
  {/* Контент: накладывается на нижнюю часть сцены */}
  <div className="relative z-10 -mt-12 px-4">
    <HeroCard />
    <Categories className="mt-4" />
    <MenuGrid className="mt-4" />
  </div>
  
  <BottomNav />
</div>
```

2. Перерисовать BackgroundLayer под viewBox 800x600:
   - Окна (0-150 по Y)
   - Стены (150-400)
   - Зона персонажей (400-550)
   - Пол (550-600)
   - Левая красная стена (0-250 по X) с логотипом Love is Coffee
   - Центральная и правая светлая стена

3. Перерисовать FurnitureLayer:
   - Стойка (150-650 по X, 300-400 по Y) с правильным цветом и тенями
   - Столики у окон (опционально для Phase 1)

4. Перерисовать ObjectsLayer с правильными координатами объектов на стойке (см. SCENE-SPEC.md раздел 3.2):
   - Холодильная витрина
   - Микроволновка
   - Кофемашина
   - Кофемолка
   - POS терминал
   - Зона выдачи
   - Стопки стаканчиков

**Зависит от**: P2-1

**Готово когда**:
- [ ] Сцена занимает 60% высоты экрана на /menu
- [ ] viewBox 800x600
- [ ] Контент под сценой "выглядывает" снизу (благодаря -mt-12)
- [ ] Все объекты на правильных координатах из SCENE-SPEC.md
- [ ] Логотип Love is Coffee на красной стене
- [ ] Сцена выглядит "богаче" чем раньше

---

## P2-3: Виталий и Аслан — детализация и базовые idle-действия

**Файлы**:
- `src/components/scene/characters/BaristaVitaliy.tsx`
- `src/components/scene/characters/BaristaAslan.tsx`
- `src/components/scene/behaviors/baristaIdleActions.ts`

**Контекст**:
У баристов сейчас 2-3 примитивных действия. Нужно минимум 8 каждый, с характерами.

**Что сделать**:

1. `baristaIdleActions.ts`:
```ts
export const VITALIY_IDLE_ACTIONS = [
  { id: 'wipe_counter', duration: 3000, weight: 20 },
  { id: 'check_machine', duration: 2500, weight: 15 },
  { id: 'adjust_apron', duration: 1500, weight: 10 },
  { id: 'stretch_back', duration: 2000, weight: 8 },
  { id: 'polish_cup', duration: 3000, weight: 12 },
  { id: 'check_phone', duration: 2500, weight: 10 },
  { id: 'organize_cups', duration: 2500, weight: 12 },
  { id: 'look_at_clock', duration: 1500, weight: 8 },
  { id: 'tap_rhythm', duration: 2000, weight: 5 },
] as const;

export const ASLAN_IDLE_ACTIONS = [
  { id: 'juggle_cup', duration: 3000, weight: 18 },
  { id: 'dance_move', duration: 2000, weight: 12 },
  { id: 'check_phone', duration: 2500, weight: 15 },
  { id: 'laugh', duration: 1500, weight: 10 },
  { id: 'stretch_arms', duration: 1500, weight: 8 },
  { id: 'wipe_cup', duration: 2500, weight: 12 },
  { id: 'pose', duration: 1500, weight: 7 },
  { id: 'air_drums', duration: 2000, weight: 10 },
  { id: 'write_on_cup', duration: 2500, weight: 8 },
] as const;

export function pickWeightedRandom<T extends { weight: number }>(items: readonly T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}
```

2. `BaristaVitaliy.tsx`:
```tsx
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VITALIY_IDLE_ACTIONS, pickWeightedRandom } from '../behaviors/baristaIdleActions';

interface Props {
  state: 'idle' | 'pending' | 'accepted' | 'ready' | 'sad';
  onTap: () => void;
}

export function BaristaVitaliy({ state, onTap }: Props) {
  const [currentAction, setCurrentAction] = useState(VITALIY_IDLE_ACTIONS[0]);
  
  useEffect(() => {
    if (state !== 'idle') return;
    
    const cycle = () => {
      const next = pickWeightedRandom(VITALIY_IDLE_ACTIONS);
      setCurrentAction(next);
      setTimeout(cycle, next.duration);
    };
    
    cycle();
  }, [state]);
  
  return (
    <motion.g 
      onClick={onTap}
      style={{ cursor: 'pointer' }}
      transform="translate(180, 380)"
    >
      {/* Тело — пиксельная композиция */}
      <VitaliyBody action={state === 'idle' ? currentAction.id : state} />
    </motion.g>
  );
}

function VitaliyBody({ action }: { action: string }) {
  // Здесь композиция из <rect> или <image href="/sprites/vitaliy/idle.png" />
  // Для Phase 1 — улучшенная SVG композиция
  // Для Phase 2 — заменим на спрайты
  return (
    <g>
      {/* Голова */}
      <rect x={0} y={0} width={32} height={32} fill="#e8b88a" />
      {/* Волосы */}
      <rect x={-2} y={-4} width={36} height={10} fill="#2c1810" />
      {/* Глаза */}
      <rect x={8} y={12} width={3} height={3} fill="#1a1a1a" />
      <rect x={21} y={12} width={3} height={3} fill="#1a1a1a" />
      {/* Тело (зависит от action) */}
      {action === 'wipe_counter' && <WipingArm />}
      {action === 'check_machine' && <CheckingMachineArm />}
      {/* ... и т.д. */}
    </g>
  );
}
```

3. Аналогично `BaristaAslan.tsx`.

4. **Phase 1 нюанс**: пока используем улучшенные SVG-композиции, без PNG спрайтов. Спрайты — Phase 2.

**Зависит от**: P2-1, P2-2

**Готово когда**:
- [ ] Виталий имеет 9 разных idle-действий
- [ ] Аслан имеет 9 разных idle-действий
- [ ] Действия меняются автоматически каждые 1.5-3 секунды
- [ ] Виталий выглядит как педант, Аслан как шутник (через действия)
- [ ] Тап на бариста работает (для пасхалок в P5)

---

## P2-4: Связь сцены с активным заказом

**Файлы**:
- `src/components/CoffeeScene.tsx`
- `src/components/scene/characters/BaristaVitaliy.tsx`
- `src/components/scene/characters/BaristaAslan.tsx`
- `src/components/scene/effects/OrderBubble.tsx`
- `src/app/menu/page.tsx`

**Контекст**:
Сцена должна реагировать на статус заказа: pending → внимание, accepted → работа, ready → выдача.

**Что сделать**:
1. В `/menu/page.tsx`:
```tsx
const [activeOrder, setActiveOrder] = useState<Order | null>(null);

useEffect(() => {
  if (!user?.uid) return;
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', user.uid),
    where('status', 'in', ['pending', 'accepted', 'ready']),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  return onSnapshot(q, (snap) => {
    setActiveOrder(snap.docs[0]?.data() as Order ?? null);
  });
}, [user?.uid]);

return <CoffeeScene userUid={user?.uid} activeOrder={activeOrder} ... />;
```

2. В баристах добавить реакции на состояния:
   - `pending` → оба смотрят к экрану заказов, idle паузится на 3 секунды
   - `accepted` → Виталий → к кофемашине (анимация перемещения), Аслан → пишет на стаканчике
   - `ready` → Аслан → к зоне выдачи, машет рукой
   - `paid` → плавный возврат в idle через 2 секунды

3. `OrderBubble.tsx` — компонент облачка над сценой:
```tsx
<AnimatePresence>
  {activeOrder && (
    <motion.g
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <rect x={300} y={150} width={200} height={50} rx={8} fill="white" stroke="#1a7a44" />
      <text x={400} y={180} textAnchor="middle" fill="#1a7a44" fontSize={14} fontWeight={600}>
        {getStatusText(activeOrder.status)}
      </text>
    </motion.g>
  )}
</AnimatePresence>
```

**Зависит от**: P2-3

**Готово когда**:
- [ ] При создании заказа сцена реагирует
- [ ] Изменение статуса в Firestore → визуальное изменение в сцене (1-2 сек)
- [ ] При ready Аслан машет рукой
- [ ] Облачко статуса появляется над сценой
- [ ] После paid сцена возвращается в idle

---

## P2-5: Грустный Виталий

**Файлы**:
- `src/components/scene/characters/BaristaVitaliy.tsx`

**Контекст**:
Если у пользователя стрик = 0 и не заказывал 2+ дня → Виталий грустный.

**Что сделать**:
1. В CoffeeScene вычислить:
```ts
const isVitaliySad = streakDays === 0 && daysSinceOrder(lastOrderDate) >= 2;
```

2. В BaristaVitaliy добавить состояние `sad`:
```tsx
{state === 'sad' && (
  <g>
    {/* Опущенная голова */}
    <rect x={0} y={5} ... /> {/* Голова сдвинута вниз */}
    {/* Грустный рот (перевёрнутая дуга) */}
    <path d="M 8 22 Q 16 18 24 22" stroke="#1a1a1a" strokeWidth={2} fill="none" />
    {/* Облачко мысли */}
    <g transform="translate(-30, -40)">
      <ellipse cx={20} cy={20} rx={20} ry={15} fill="white" stroke="#d0f0e0" />
      <text x={20} y={26} textAnchor="middle" fontSize={20}>?</text>
    </g>
    {/* Иногда вздох — плечи поднимаются-опускаются */}
    <motion.g
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* плечи */}
    </motion.g>
  </g>
)}
```

**Зависит от**: P2-3

**Готово когда**:
- [ ] При условии (стрик=0, 2+ дня) Виталий грустит
- [ ] Видна грустная мимика
- [ ] Облачко с "?" над головой
- [ ] Лёгкая анимация вздоха

---

## ⛔ Чек-пойнт после P2

- [ ] Build, deploy, git push
- [ ] CoffeeScene на 60% экрана
- [ ] Богатая компоновка с правильными зонами
- [ ] Виталий и Аслан с 9 действиями каждый
- [ ] Сцена реагирует на активный заказ
- [ ] Грустный Виталий работает

**Git commit**: `feat: P2 сцена phase 1 — новая компоновка 60vh, баристы с богатой жизнью, реакция на заказ`

---

# P3 — NPC система и взаимодействия

## P3-1: Процедурная генерация NPC

**Файлы**:
- `src/components/scene/utils/procGen.ts`
- `src/components/scene/characters/NpcCharacter.tsx`

**Контекст**:
В сцене должны жить NPC — фейковые клиенты для атмосферы.

**Что сделать**:

1. `procGen.ts` — генератор внешности из seed:
```ts
const SKIN_TONES = ['#e8b88a', '#d4a574', '#c39368', '#a87850'];
const HAIR_COLORS = ['#2c1810', '#1a1a1a', '#8b4513', '#d4a574', '#f5deb3', '#a52a2a'];
const SHIRT_COLORS = [
  '#c0392b', '#27ae60', '#2980b9', '#f39c12', 
  '#8e44ad', '#16a085', '#e74c3c', '#3498db',
  '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
];
const PANTS_COLORS = ['#1a3c5e', '#2c3e50', '#34495e', '#8b4513'];
const ACCESSORIES = [null, 'backpack', 'phone', 'tote-bag', 'book'];

export interface NpcAppearance {
  seed: number;
  bodyColor: string;
  hairStyle: number;
  hairColor: string;
  shirtStyle: number;
  shirtColor: string;
  pantsColor: string;
  accessory: string | null;
  height: 'short' | 'medium' | 'tall';
  archetype: NpcArchetype;
}

export type NpcArchetype = 'student' | 'businessman' | 'mom' | 'couple' | 'sportsman' | 'freelancer' | 'tourist';

// Простой seeded RNG (mulberry32)
function seededRandom(seed: number) {
  let state = seed;
  return {
    next: () => {
      state |= 0; state = state + 0x6D2B79F5 | 0;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    },
    int: (min: number, max: number) => Math.floor(seededRandom(seed).next() * (max - min + 1)) + min,
    pick: <T>(arr: T[]) => arr[Math.floor(seededRandom(seed).next() * arr.length)],
  };
}

export function generateNpc(seed: number, archetype?: NpcArchetype): NpcAppearance {
  const rng = seededRandom(seed);
  const arch = archetype ?? rng.pick(['student', 'businessman', 'mom', 'sportsman', 'freelancer', 'tourist']);
  
  return {
    seed,
    bodyColor: rng.pick(SKIN_TONES),
    hairStyle: rng.int(0, 7),
    hairColor: rng.pick(HAIR_COLORS),
    shirtStyle: rng.int(0, 5),
    shirtColor: rng.pick(SHIRT_COLORS),
    pantsColor: rng.pick(PANTS_COLORS),
    accessory: rng.pick(ACCESSORIES),
    height: rng.pick(['short', 'medium', 'tall']),
    archetype: arch,
  };
}
```

2. `NpcCharacter.tsx` — компонент NPC:
```tsx
export function NpcCharacter({ appearance, position }: { appearance: NpcAppearance; position: { x: number; y: number } }) {
  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Композиция из частей по appearance */}
      <NpcBody color={appearance.bodyColor} />
      <NpcHair style={appearance.hairStyle} color={appearance.hairColor} />
      <NpcShirt style={appearance.shirtStyle} color={appearance.shirtColor} />
      <NpcPants color={appearance.pantsColor} />
      {appearance.accessory && <NpcAccessory type={appearance.accessory} />}
    </g>
  );
}
```

**Зависит от**: P2-1

**Готово когда**:
- [ ] `procGen.ts` генерирует разнообразных NPC из seed
- [ ] Один и тот же seed → одинаковый NPC (детерминизм)
- [ ] NpcCharacter рендерится корректно
- [ ] Видны 7 архетипов

---

## P3-2: Спавн и движение NPC

**Файлы**:
- `src/components/scene/layers/SpritesLayer.tsx`
- `src/components/scene/behaviors/npcMovement.ts`

**Контекст**:
NPC должны появляться, ходить по сцене, исчезать.

**Что сделать**:

1. `npcMovement.ts`:
```ts
export const WAYPOINTS = {
  door: { x: 740, y: 480 },
  queue1: { x: 380, y: 450 },
  queue2: { x: 420, y: 450 },
  queue3: { x: 460, y: 450 },
  counter: { x: 340, y: 440 },
  pickup: { x: 460, y: 440 },
  table_left: { x: 100, y: 490 },
  table_right: { x: 680, y: 490 },
  exit: { x: 750, y: 490 },
} as const;

export const NPC_LIFECYCLE_DURATIONS = {
  walking_to_queue: 4000,
  waiting_in_queue: 8000,
  ordering: 3000,
  walking_to_pickup: 3000,
  waiting_for_drink: 5000,
  taking_drink: 1500,
  sitting_at_table: 30000,
  walking_to_exit: 4000,
};

export type NpcState = 
  | 'spawning' 
  | 'walking_to_queue' 
  | 'waiting_in_queue' 
  | 'ordering' 
  | 'walking_to_pickup' 
  | 'waiting_for_drink' 
  | 'taking_drink' 
  | 'sitting_at_table' 
  | 'walking_to_exit' 
  | 'despawning';
```

2. В `SpritesLayer.tsx` — менеджер NPC:
```tsx
const [activeNpcs, setActiveNpcs] = useState<ActiveNpc[]>([]);

// Спавнить нового NPC каждые 15-30 секунд (если меньше 5)
useEffect(() => {
  const spawn = () => {
    if (activeNpcs.length >= 5) return;
    
    const seed = Date.now();
    const npc: ActiveNpc = {
      id: `npc_${seed}`,
      appearance: generateNpc(seed),
      state: 'spawning',
      position: WAYPOINTS.door,
      stateStartedAt: Date.now(),
    };
    
    setActiveNpcs(prev => [...prev, npc]);
  };
  
  const interval = setInterval(spawn, 15000 + Math.random() * 15000);
  return () => clearInterval(interval);
}, [activeNpcs.length]);

// Цикл состояний для каждого NPC
useEffect(() => {
  const tick = () => {
    setActiveNpcs(prev => prev.map(npc => updateNpcState(npc)).filter(Boolean));
  };
  const interval = setInterval(tick, 100);
  return () => clearInterval(interval);
}, []);

return (
  <g>
    {activeNpcs.map(npc => (
      <NpcCharacter 
        key={npc.id} 
        appearance={npc.appearance} 
        position={npc.position} 
      />
    ))}
  </g>
);
```

3. `updateNpcState` — функция переходов:
```ts
function updateNpcState(npc: ActiveNpc): ActiveNpc | null {
  const elapsed = Date.now() - npc.stateStartedAt;
  
  switch (npc.state) {
    case 'spawning':
      if (elapsed > 500) return { ...npc, state: 'walking_to_queue', stateStartedAt: Date.now() };
      return npc;
    case 'walking_to_queue':
      // Анимация движения через интерполяцию (или Framer Motion в компоненте)
      if (elapsed > NPC_LIFECYCLE_DURATIONS.walking_to_queue) {
        return { ...npc, state: 'waiting_in_queue', position: WAYPOINTS.queue1, stateStartedAt: Date.now() };
      }
      return npc;
    // ... и т.д. для всех состояний
    case 'despawning':
      return null; // удаляем
    default:
      return npc;
  }
}
```

**Зависит от**: P3-1

**Готово когда**:
- [ ] NPC спавнятся каждые 15-30 секунд
- [ ] Максимум 5 NPC одновременно
- [ ] NPC проходят полный жизненный цикл
- [ ] Движение плавное через Framer Motion
- [ ] NPC исчезают через дверь

---

## P3-3: Реальные клиенты в сцене

**Файлы**:
- `src/lib/auth.tsx` (добавить sceneAvatar генерацию)
- `src/components/scene/layers/SpritesLayer.tsx`
- `src/app/menu/page.tsx`

**Контекст**:
Когда у пользователя есть активный заказ, он должен видеть себя в сцене.

**Что сделать**:
1. При первом создании пользователя в `users/{uid}` — генерировать `sceneAvatar`:
```ts
const avatar = generateNpc(hashCode(user.uid), 'student'); // дефолтный архетип
await setDoc(doc(db, 'users', user.uid), {
  ...userDoc,
  sceneAvatar: avatar,
});
```

2. Когда `activeOrder` есть — добавить персонажа пользователя в список NPC сцены с особым флагом `isPlayer: true`.

3. Реальный игрок имеет приоритет в очереди (стоит первым).

4. После завершения заказа (paid) — `isPlayer` NPC уходит через дверь.

**Зависит от**: P3-2

**Готово когда**:
- [ ] У каждого пользователя есть `sceneAvatar` в Firestore
- [ ] При активном заказе видно своего персонажа
- [ ] Персонаж двигается по сценарию заказа
- [ ] После оплаты уходит из сцены

---

## ⛔ Чек-пойнт после P3

- [ ] Build, deploy, git push
- [ ] NPC живут в сцене
- [ ] Реальные клиенты видны
- [ ] Сцена не лагает (60fps на iPhone)

**Git commit**: `feat: P3 NPC система — процедурная генерация, движение, реальные клиенты в сцене`

---

# P4 — Эффекты (освещение и погода)

## P4-1: Время суток влияет на освещение

**Файлы**:
- `src/components/scene/behaviors/sceneTime.ts`
- `src/components/scene/effects/Lighting.tsx`
- `src/components/scene/layers/EffectsLayer.tsx`

**Что сделать**:
1. `sceneTime.ts` — функция определения пресета:
```ts
export type LightingPreset = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export function getLightingPreset(date = new Date()): LightingPreset {
  // Используй UTC+5 (Алматы)
  const almatyHour = (date.getUTCHours() + 5) % 24;
  if (almatyHour < 6) return 'night';
  if (almatyHour < 8) return 'dawn';
  if (almatyHour < 11) return 'morning';
  if (almatyHour < 15) return 'noon';
  if (almatyHour < 18) return 'afternoon';
  if (almatyHour < 21) return 'evening';
  return 'night';
}

export const LIGHTING_OVERLAYS: Record<LightingPreset, string> = {
  dawn: 'rgba(255, 180, 120, 0.15)',
  morning: 'rgba(255, 240, 200, 0.05)',
  noon: 'rgba(0, 0, 0, 0)',
  afternoon: 'rgba(255, 220, 150, 0.08)',
  evening: 'rgba(255, 180, 100, 0.15)',
  night: 'rgba(40, 30, 80, 0.25)',
};
```

2. `Lighting.tsx`:
```tsx
import { motion } from 'framer-motion';
import { getLightingPreset, LIGHTING_OVERLAYS } from '../behaviors/sceneTime';

export function Lighting() {
  const preset = getLightingPreset();
  return (
    <motion.rect
      x={0} y={0} width={800} height={600}
      fill={LIGHTING_OVERLAYS[preset]}
      style={{ mixBlendMode: 'overlay', pointerEvents: 'none' }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />
  );
}
```

3. Добавить в EffectsLayer.

**Зависит от**: P2-1

**Готово когда**:
- [ ] Утром (6-8) сцена розовая
- [ ] Днём (11-15) сцена обычная
- [ ] Вечером (18-21) сцена жёлтая
- [ ] Ночью (21-6) сцена тёмно-синяя
- [ ] Изменения плавные

---

## P4-2: Погода в окнах

**Файлы**:
- `functions/index.js` (добавить updateWeather функцию)
- `src/components/scene/effects/Weather.tsx`
- `src/components/scene/layers/EffectsLayer.tsx`

**Что сделать**:

1. Зарегистрироваться на https://openweathermap.org/api → бесплатный план → получить API key.

2. Добавить в Firebase Functions Config: `firebase functions:config:set openweather.key="API_KEY"`

3. В `functions/index.js`:
```js
exports.updateWeather = onSchedule('every 30 minutes', async (event) => {
  const apiKey = functions.config().openweather.key;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=43.2220&lon=76.8512&appid=${apiKey}&units=metric`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  await db.collection('cache').doc('weather').set({
    condition: data.weather[0].main,
    description: data.weather[0].description,
    temp: Math.round(data.main.temp),
    updatedAt: FieldValue.serverTimestamp(),
  });
});
```

4. На клиенте в `/menu/page.tsx`:
```tsx
const [weather, setWeather] = useState<WeatherData | null>(null);

useEffect(() => {
  return onSnapshot(doc(db, 'cache', 'weather'), (snap) => {
    setWeather(snap.data() as WeatherData);
  });
}, []);
```

5. `Weather.tsx` — компонент для окон:
```tsx
export function Weather({ condition }: { condition: string }) {
  if (condition === 'Rain') return <RainEffect />;
  if (condition === 'Snow') return <SnowEffect />;
  if (condition === 'Clouds') return <CloudsEffect />;
  return <ClearEffect />;
}

function RainEffect() {
  return (
    <g>
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.line
          key={i}
          x1={Math.random() * 800}
          y1={-10}
          x2={Math.random() * 800 - 10}
          y2={10}
          stroke="rgba(150, 200, 255, 0.5)"
          strokeWidth={1}
          animate={{ y1: [-10, 600], y2: [10, 620] }}
          transition={{ duration: 0.8, delay: Math.random() * 3, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </g>
  );
}

// Аналогично для Snow, Clouds, Clear
```

**Зависит от**: P0-3

**Готово когда**:
- [ ] Cloud Function `updateWeather` задеплоена
- [ ] В Firestore `cache/weather` обновляется каждые 30 минут
- [ ] В сцене окна показывают актуальную погоду
- [ ] Минимум 4 типа погоды (clear, rain, snow, clouds)

---

## P4-3: Усиленный пар от кофемашины

**Файлы**:
- `src/components/scene/effects/Steam.tsx`

**Что сделать**:
Уже частично есть. Улучшить:
- 6 ellipse элементов вместо 3
- Разные размеры
- Скорость зависит от состояния заказа (accepted = быстрее)
- Цвет с blend mode для реалистичности

**Зависит от**: P2-1

**Готово когда**:
- [ ] Пар выглядит мягким и реалистичным
- [ ] При accepted — пар интенсивнее
- [ ] При idle — спокойный

---

## ⛔ Чек-пойнт после P4

- [ ] Build, deploy, git push
- [ ] Освещение меняется по времени
- [ ] Погода работает (или скриншот ошибки если API не подключён)
- [ ] Пар выглядит хорошо

**Git commit**: `feat: P4 эффекты — освещение по времени суток, погода через OpenWeatherMap, пар`

---

# P5 — Полировка и пасхалки

## P5-1: Все пасхалки баристов

**Файлы**:
- `src/components/scene/characters/BaristaVitaliy.tsx`
- `src/components/scene/characters/BaristaAslan.tsx`

**Что сделать**:
1. **8× тап Виталия** за 10 секунд → красное лицо, бросок фартука, уходит за левый край (translateX -100), через 30 сек возвращается.
2. **5× тап Аслана** за 10 секунд → прыжок (translateY -20), вращение (rotate 360), падение, отряхивается.
3. **Тап на кофемашину** → пар выстреливает (большое облако), Виталий отскакивает на 1 секунду.
4. **23:00-07:00** → оба спят на стойке (наклонённые головы, "Zzz" над головами). Тап → просыпаются.
5. **10-й заказ подряд** → текст "Легенда кофейни! 🏆" + оба танцуют 3 секунды.
6. **Первый заказ дня (07:30-08:00)** → "Первый заказ дня! 🌅" + спец конфетти + 50 монет в баланс.

**Зависит от**: P2-3

**Готово когда**:
- [ ] Все 6 пасхалок работают
- [ ] Тапы корректно считаются
- [ ] Анимации плавные

---

## P5-2: Shake детекция

**Файлы**:
- `src/components/scene/effects/ShakeHandler.tsx`
- `src/components/CoffeeScene.tsx`

**Что сделать**:
```tsx
useEffect(() => {
  const handleMotion = (e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const total = Math.abs(acc.x ?? 0) + Math.abs(acc.y ?? 0) + Math.abs(acc.z ?? 0);
    if (total > 35) {
      triggerShakeEvent();
    }
  };
  
  // iOS требует разрешения на DeviceMotion
  if (typeof DeviceMotionEvent !== 'undefined' && (DeviceMotionEvent as any).requestPermission) {
    (DeviceMotionEvent as any).requestPermission().then((response: string) => {
      if (response === 'granted') {
        window.addEventListener('devicemotion', handleMotion);
      }
    });
  } else {
    window.addEventListener('devicemotion', handleMotion);
  }
  
  return () => window.removeEventListener('devicemotion', handleMotion);
}, []);
```

При шейке:
- Стаканчики падают (анимация)
- Баристы удивлены
- Через 3 секунды Аслан поднимает

**Зависит от**: P5-1

**Готово когда**:
- [ ] Shake детектится
- [ ] iOS разрешение запрашивается корректно
- [ ] Анимация падения стаканчиков работает

---

## P5-3: Финальная полировка UI

**Файлы**: множество

**Что сделать**:
Пройдись по всем экранам и проверь соответствие DESIGN-SYSTEM.md:

1. **Цвета**: все из палитры, никаких рандомных hex
2. **Шрифты**: Inter везде, Playfair только в hero/заголовках
3. **Skeleton loading** на всех асинхронных данных (нет spinner'ов)
4. **Framer Motion переходы** между экранами
5. **Spring анимации** на всех кнопках
6. **Bottom sheets** вместо центральных модалок
7. **Валюта** везде ₸
8. **Tap зоны** ≥ 44x44px
9. **Safe area** для iPhone notch
10. **Никаких console.log** в продакшн коде

**Зависит от**: всё предыдущее

**Готово когда**:
- [ ] Все 10 пунктов проверены
- [ ] Нет визуальных багов
- [ ] Все экраны выглядят согласованно

---

## P5-4: Производительность

**Файлы**: разные

**Что сделать**:
1. `next build` → проверить размер бандла
2. Если > 300KB на главную → анализ через `@next/bundle-analyzer`
3. Lazy load для `avatar/page.tsx` (не должен грузиться в основном flow)
4. Memo для статичных компонентов сцены (BackgroundLayer, FurnitureLayer)
5. Pause анимаций когда tab неактивен (`document.hidden`)
6. Image optimization через `next/image`

**Зависит от**: всё

**Готово когда**:
- [ ] Bundle размер главной < 300KB gzip
- [ ] FCP < 2s на 4G
- [ ] Сцена 60fps на iPhone 12+
- [ ] Avatar page lazy loaded

---

## ⛔ Финальный чек-пойнт

- [ ] Финальный `npm run build` без ошибок
- [ ] Деплой Cloud Functions: `cd functions && npx firebase deploy --only functions`
- [ ] Деплой Firestore Rules: `npx firebase deploy --only firestore:rules`
- [ ] Git push origin main
- [ ] Vercel deploy успешен
- [ ] Открыть https://office-is-coffee.vercel.app — всё работает

**Git commit**: `feat: P5 пасхалки, shake, полировка UI, производительность`

---

# Финальный отчёт

После выполнения всех задач напиши отчёт в формате:

```
## Выполнено

### P0 — Фундамент
- [x] P0-1: Google OAuth ...
- [x] P0-2: Firestore Rules ...
...

## Пропущено

- P0-7 Sentry: пропущено, причина: DSN не предоставлен пользователем

## Требует ручной проверки

1. Тест на iPhone Safari в PWA режиме (см. QA-CHECKLIST.md)
2. Тест push на реальном устройстве
3. Проверить погоду в окнах когда дождь в Алматы

## Следующие шаги

Из IDEAS.md рекомендую:
- Раздел 3.1: Pre-order
- Раздел 1.4: Звуки
```

---

**Конец TASKS.md**.
