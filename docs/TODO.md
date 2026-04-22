# TODO — Office is Coffee

Рабочий список задач, требующих решения после стабилизации меню v2.0.

## Сезонная ротация hero-карточки

Hero-карточка на главном экране (`/menu`) сейчас показывает фиксированный напиток. Ранее предполагалась сезонная ротация:

- Октябрь–ноябрь: Тыквенно-пряный латте
- Декабрь–февраль: Глинтвейн
- Июнь–август: Фраппучино / Лимонад Лайм-малина
- Остальное: Раф классика

**Проблема:** Тыквенно-пряного латте в меню v2.0 **нет** (удалён владельцем). «Раф классика» теперь просто «Раф».

**Что сделать:**

1. Пересмотреть список кандидатов под v2.0. Варианты:
   - Осень (сент–ноя): `ginger_spice_latte` (Имбирно-пряный латте) как замена Тыквенно-пряного
   - Зима (дек–фев): `author_tea_mulled` (Глинтвейн)
   - Лето (июн–авг): `frappuccino` или `lemonade_lime_raspberry`
   - По умолчанию: `raf`
2. Решить — 3 сезона или 4. Нужен ли «межсезонный» дефолт или обойтись 4 окнами.
3. Использовать семантику `activeFrom`/`activeTo` из раздела **«Расширения схемы (backlog)»** в [docs/MENU.md](./MENU.md#расширения-схемы-backlog-не-реализовано). Когда поля появятся в `MenuItem` — переиспользовать.

**Зависимости:** нужна миграция меню в Firestore (P1-1) или ручной редактор в админке, чтобы владелец мог сам переключать без правки кода.

---

## Удалить legacy-ветку категорий

В `src/lib/menu.ts:normalizeCategoryId` и `functions/index.js:coffeeCategories` есть маппинг старых ID (`coffee_classic`, `coffee_author`, `tea_home`, `tea_author`) на новые.

Хелпер логирует в Sentry событие `legacy_category_format` (`level: info`) каждый раз, когда встречает старый ID в Firestore-данных. Когда события прекратятся (все исторические заказы старше определённого порога выйдут из отображаемой истории) — хелпер и легаси-ветка в `coffeeCategories` становятся мёртвым кодом и удаляются.

**Критерий удаления:** 0 событий `legacy_category_format` в Sentry за последние 30 дней.

---

## Откат миграции меню v2.0 (если понадобится)

**Актуально до: 2026-05-22** (после этой даты будет удалён transitional-код `coffeeCategories` в `functions/index.js`, revert перестанет применяться чисто).

**Команда отката:**

```bash
git revert 9ad43e4 07cc5b6 --no-edit && git push origin main
```

**Что откатится:**

- `07cc5b6` — основной v2.0 migration (menu.ts, категории, addons, composition)
- `9ad43e4` — legacy coverage fix в `/menu` и `/orders`

**Что НЕ откатится** (и это ок, оставляем):

- `63953b3` — `.gitignore` nul (безопасный, не связан)

**После revert обязательно:**

1. Проверить что `docs/MENU.md` и `docs/TODO.md` остались на месте — они полезны независимо от состояния кода.
2. Следить за Sentry — должен прекратиться поток `legacy_category_format` (его логировал удалённый `normalizeCategoryId`).
3. Если старое меню не работает — разбираться с исходными багами (но это маловероятно, оно работало месяцами).

---

## Cloud Functions: апгрейд рантайма

Google Cloud предупреждает при деплое (2026-04-22):

1. **Node.js 20 deprecated**
   - **2026-04-30** — помечено deprecated
   - **2026-10-30** — decommissioned, деплой без апгрейда перестанет работать
   - Поправить в `functions/package.json`: `"engines": { "node": "22" }` (или выше)
   - Протестировать локально через `firebase emulators:start` перед деплоем

2. **firebase-functions v5 → v6**
   - Google: «there will be breaking changes»
   - Текущее: `firebase-functions ^5` в `functions/package.json`
   - Команда апгрейда: `cd functions && npm install --save firebase-functions@latest`
   - Пройтись по всем 8 функциям в `functions/index.js`, проверить breaking changes:
     - `onDocumentCreated`, `onDocumentUpdated`, `onSchedule`, `onCall` — API v2
     - Проверить сигнатуры `event.data`, `event.params`, `request.auth`
   - Релиз-нотсы v6: https://firebase.google.com/support/release-notes/admin/node

**Связка**: желательно делать вместе (Node 22 + functions v6) за один деплой, чтобы не гонять двойной риск.

**Крайний срок**: до **2026-10-30** (Node 20 decommission). Не позже чем за месяц — т.е. до **2026-09-30**.
