# MENU-DATA.md — Полный каталог Love is Coffee

> Источник: официальное меню кофейни Love is Coffee (фото от владельца, апрель 2026).
> Цель: миграция из хардкода `MENU[]` в Firestore коллекцию `menu_items`.
> Задача в TASKS.md: **P1-1 Миграция меню в Firestore**.

---

## 1. Валюта и форматы

- Валюта: **тенге (₸)**
- Формат цены: `850₸`, `1 250₸` (пробел в тысячах)
- НИКОГДА не использовать: "тг", "KZT", "T", "тнг"

## 2. Размеры

| Код | Название |
|---|---|
| S | Small (маленький) |
| M | Medium (средний) |
| L | Large (большой) |

Не у всех напитков есть все 3 размера. Если размер недоступен — не показывать в UI.

## 3. Добавки (глобальные)

| Добавка | Цена |
|---|---|
| Сироп (любой вкус) | +200₸ |
| Альтернативное молоко (овсяное/кокосовое/миндальное) | +500₸ |

**ВАЖНО**: В текущем коде наценка на молоко "+150/+200". Это **неправильно**. На фото меню: "альтернативное молоко +500₸". Исправить во время миграции.

## 4. Категории (13 штук)

| id | Название | Порядок | Градиент карточек |
|---|---|---|---|
| `classic-coffee` | Кофейная классика | 1 | from-[#1a7a44] to-[#2d9e5a] |
| `author-coffee` | Авторский кофе | 2 | from-[#d42b4f] to-[#e85d7a] |
| `ice-coffee` | Айс кофе | 3 | from-[#0ea5e9] to-[#38bdf8] |
| `cocoa` | Какао и горячий шоколад | 4 | from-[#92400e] to-[#b45309] |
| `home-tea` | Домашний чай | 5 | from-[#f59e0b] to-[#fbbf24] |
| `author-tea` | Авторский чай | 6 | from-[#be123c] to-[#e11d48] |
| `matcha` | Матча | 7 | from-[#65a30d] to-[#84cc16] |
| `ice-tea` | Айс ти | 8 | from-[#06b6d4] to-[#22d3ee] |
| `milkshakes` | Молочные коктейли | 9 | from-[#ec4899] to-[#f472b6] |
| `fresh-juices` | Свежевыжатые соки | 10 | from-[#f97316] to-[#fb923c] |
| `fresh-smoothies` | Смузи на фреше | 11 | from-[#eab308] to-[#facc15] |
| `milk-smoothies` | Смузи на молоке | 12 | from-[#a855f7] to-[#c084fc] |
| `lemonades` | Лимонады | 13 | from-[#14b8a6] to-[#2dd4bf] |

---

## 5. Кофейная классика

### 5.1 Капучино
```json
{
  "id": "cappuccino",
  "category": "classic-coffee",
  "name": "Капучино",
  "sizes": { "S": 850, "M": 1050, "L": 1150 },
  "availableMilk": true,
  "tags": [],
  "radarData": { "acidity": 2, "sweetness": 3, "bitterness": 3, "body": 4, "aroma": 4 },
  "sortOrder": 101
}
```

### 5.2 Латте
```json
{
  "id": "latte",
  "category": "classic-coffee",
  "name": "Латте",
  "sizes": { "M": 900, "L": 1050 },
  "availableMilk": true,
  "tags": [],
  "radarData": { "acidity": 1, "sweetness": 4, "bitterness": 2, "body": 3, "aroma": 3 },
  "sortOrder": 102
}
```

### 5.3 Флэт уайт
```json
{
  "id": "flat-white",
  "category": "classic-coffee",
  "name": "Флэт уайт",
  "sizes": { "S": 1000, "M": 1150, "L": 1250 },
  "availableMilk": true,
  "tags": [],
  "radarData": { "acidity": 2, "sweetness": 2, "bitterness": 4, "body": 5, "aroma": 4 },
  "sortOrder": 103
}
```

### 5.4 Американо
```json
{
  "id": "americano",
  "category": "classic-coffee",
  "name": "Американо",
  "sizes": { "S": 750, "M": 850, "L": 950 },
  "availableMilk": false,
  "tags": [],
  "radarData": { "acidity": 3, "sweetness": 1, "bitterness": 4, "body": 2, "aroma": 3 },
  "sortOrder": 104
}
```

### 5.5 Эспрессо
```json
{
  "id": "espresso",
  "category": "classic-coffee",
  "name": "Эспрессо",
  "sizes": { "S": 450, "M": 550 },
  "availableMilk": false,
  "tags": [],
  "radarData": { "acidity": 3, "sweetness": 1, "bitterness": 5, "body": 5, "aroma": 5 },
  "sortOrder": 105
}
```

---

## 6. Авторский кофе

### 6.1 Айриш кофе
```json
{
  "id": "irish-coffee",
  "category": "author-coffee",
  "name": "Айриш кофе",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 201
}
```

### 6.2 Раф классика
```json
{
  "id": "raf-classic",
  "category": "author-coffee",
  "name": "Раф классика",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": true,
  "tags": ["hit"],
  "sortOrder": 202
}
```

### 6.3 Раф медовый
```json
{
  "id": "raf-honey",
  "category": "author-coffee",
  "name": "Раф медовый",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": true,
  "tags": ["hit"],
  "sortOrder": 203
}
```

### 6.4 Раф банан-карамель
```json
{
  "id": "raf-banana-caramel",
  "category": "author-coffee",
  "name": "Раф банан-карамель",
  "sizes": { "M": 1350, "L": 1450 },
  "availableMilk": true,
  "tags": ["hit"],
  "sortOrder": 204
}
```

### 6.5 Мокко
```json
{
  "id": "mocha",
  "category": "author-coffee",
  "name": "Мокко",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 205
}
```

### 6.6 Мокко белый шоколад
```json
{
  "id": "mocha-white-chocolate",
  "category": "author-coffee",
  "name": "Мокко белый шоколад",
  "sizes": { "M": 1350, "L": 1450 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 206
}
```

### 6.7 Латте халва
```json
{
  "id": "latte-halva",
  "category": "author-coffee",
  "name": "Латте халва",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 207
}
```

### 6.8 Тыквенно-пряный латте
```json
{
  "id": "pumpkin-spice-latte",
  "category": "author-coffee",
  "name": "Тыквенно-пряный латте",
  "sizes": { "M": 1350, "L": 1450 },
  "availableMilk": true,
  "tags": ["season"],
  "activeFrom": "09-01",
  "activeTo": "11-30",
  "sortOrder": 208
}
```

---

## 7. Айс кофе

### 7.1 Айс американо
```json
{
  "id": "ice-americano",
  "category": "ice-coffee",
  "name": "Айс американо",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 301
}
```

### 7.2 Айс капучино
```json
{
  "id": "ice-cappuccino",
  "category": "ice-coffee",
  "name": "Айс капучино",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 302
}
```

### 7.3 Айс латте
```json
{
  "id": "ice-latte",
  "category": "ice-coffee",
  "name": "Айс латте",
  "sizes": { "M": 1150, "L": 1250 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 303
}
```

### 7.4 Фраппучино
```json
{
  "id": "frappuccino",
  "category": "ice-coffee",
  "name": "Фраппучино",
  "sizes": { "M": 1350, "L": 1450 },
  "availableMilk": true,
  "tags": ["hit"],
  "sortOrder": 304
}
```

### 7.5 Банановый кофе
```json
{
  "id": "banana-coffee",
  "category": "ice-coffee",
  "name": "Банановый кофе",
  "sizes": { "M": 1350, "L": 1450 },
  "availableMilk": true,
  "tags": ["hit"],
  "sortOrder": 305
}
```

### 7.6 Бамбл би
```json
{
  "id": "bumble-bee",
  "category": "ice-coffee",
  "name": "Бамбл би",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 306
}
```

### 7.7 Эспрессо тоник
```json
{
  "id": "espresso-tonic",
  "category": "ice-coffee",
  "name": "Эспрессо тоник",
  "sizes": { "M": 1150, "L": 1250 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 307
}
```

---

## 8. Какао и горячий шоколад

### 8.1 Какао
```json
{
  "id": "cocoa",
  "category": "cocoa",
  "name": "Какао",
  "sizes": { "M": 1050, "L": 1150 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 401
}
```

### 8.2 Горячий шоколад
```json
{
  "id": "hot-chocolate",
  "category": "cocoa",
  "name": "Горячий шоколад",
  "sizes": { "M": 1150, "L": 1250 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 402
}
```

---

## 9. Домашний чай

### 9.1 Нарядный
```json
{
  "id": "home-tea-naryadniy",
  "category": "home-tea",
  "name": "Нарядный",
  "ingredients": "апельсин, лимон, мята",
  "sizes": { "M": 850, "L": 950 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 501
}
```

### 9.2 Имбирный
```json
{
  "id": "home-tea-ginger",
  "category": "home-tea",
  "name": "Имбирный",
  "ingredients": "имбирь, мёд, лимон, апельсин",
  "sizes": { "M": 850, "L": 950 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 502
}
```

### 9.3 Облепиховый
```json
{
  "id": "home-tea-sea-buckthorn",
  "category": "home-tea",
  "name": "Облепиховый",
  "ingredients": "облепиха, сироп маракуйя, чай",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 503
}
```

### 9.4 Малиновый
```json
{
  "id": "home-tea-raspberry",
  "category": "home-tea",
  "name": "Малиновый",
  "ingredients": "малина, мята, апельсин, лимон",
  "sizes": { "M": 1050, "L": 1150 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 504
}
```

### 9.5 Ягодный
```json
{
  "id": "home-tea-berry",
  "category": "home-tea",
  "name": "Ягодный",
  "ingredients": "смородина, клюква, лимон",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 505
}
```

---

## 10. Авторский чай

### 10.1 Чай латте
```json
{
  "id": "chai-latte",
  "category": "author-tea",
  "name": "Чай латте",
  "ingredients": "чай со взбитым молоком и корицей",
  "sizes": { "M": 550, "L": 650 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 601
}
```

### 10.2 Грог
```json
{
  "id": "grog",
  "category": "author-tea",
  "name": "Грог",
  "ingredients": "чай, имбирь, корица, кардамон, апельсин, лимон, мёд",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 602
}
```

### 10.3 Глинтвейн
```json
{
  "id": "mulled-wine",
  "category": "author-tea",
  "name": "Глинтвейн",
  "ingredients": "апельсин, лимон, мята, вишнёвый сок, гвоздика, корица",
  "sizes": { "M": 1050, "L": 1150 },
  "availableMilk": false,
  "tags": ["hit", "season"],
  "activeFrom": "11-01",
  "activeTo": "03-31",
  "sortOrder": 603
}
```

### 10.4 Марокканский
```json
{
  "id": "moroccan-tea",
  "category": "author-tea",
  "name": "Марокканский",
  "ingredients": "апельсин, лимон, мята, чай, гвоздика, корица",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 604
}
```

### 10.5 Чай тары
```json
{
  "id": "tara-tea",
  "category": "author-tea",
  "name": "Чай тары",
  "ingredients": "тары, молоко, мёд",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 605
}
```

### 10.6 Мандариновый
```json
{
  "id": "tangerine-tea",
  "category": "author-tea",
  "name": "Мандариновый",
  "ingredients": "мандарин, лимон, мята",
  "sizes": { "M": 1150, "L": 1250 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 606
}
```

### 10.7 Пряная смородина
```json
{
  "id": "spicy-currant-tea",
  "category": "author-tea",
  "name": "Пряная смородина",
  "ingredients": "смородина, гвоздика, корица",
  "sizes": { "M": 1050, "L": 1150 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 607
}
```

### 10.8 Малина-имбирь
```json
{
  "id": "raspberry-ginger-tea",
  "category": "author-tea",
  "name": "Малина-имбирь",
  "ingredients": "малина, имбирь, лимон, апельсин",
  "sizes": { "M": 1350, "L": 1450 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 608
}
```

---

## 11. Матча

### 11.1 Зелёная матча
```json
{
  "id": "green-matcha",
  "category": "matcha",
  "name": "Зелёная матча",
  "sizes": { "M": 1150, "L": 1250 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 701
}
```

### 11.2 Голубая матча
```json
{
  "id": "blue-matcha",
  "category": "matcha",
  "name": "Голубая матча",
  "sizes": { "M": 1150, "L": 1250 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 702
}
```

---

## 12. Айс ти

### 12.1 Ягодный айс ти
```json
{
  "id": "ice-tea-berry",
  "category": "ice-tea",
  "name": "Ягодный",
  "sizes": { "M": 750, "L": 850 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 801
}
```

### 12.2 Манго айс ти
```json
{
  "id": "ice-tea-mango",
  "category": "ice-tea",
  "name": "Манго",
  "sizes": { "M": 750, "L": 850 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 802
}
```

### 12.3 Маракуйя айс ти
```json
{
  "id": "ice-tea-passion-fruit",
  "category": "ice-tea",
  "name": "Маракуйя",
  "sizes": { "M": 750, "L": 850 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 803
}
```

### 12.4 Гранатовый айс ти
```json
{
  "id": "ice-tea-pomegranate",
  "category": "ice-tea",
  "name": "Гранатовый",
  "sizes": { "M": 750, "L": 850 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 804
}
```

### 12.5 Малиновый айс ти
```json
{
  "id": "ice-tea-raspberry",
  "category": "ice-tea",
  "name": "Малиновый",
  "sizes": { "M": 750, "L": 850 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 805
}
```

### 12.6 Вишнёвый айс ти
```json
{
  "id": "ice-tea-cherry",
  "category": "ice-tea",
  "name": "Вишнёвый",
  "sizes": { "M": 750, "L": 850 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 806
}
```

---

## 13. Молочные коктейли

### 13.1 Банановый
```json
{
  "id": "milkshake-banana",
  "category": "milkshakes",
  "name": "Банановый",
  "sizes": { "M": 1350, "L": 1450 },
  "availableMilk": true,
  "tags": ["hit"],
  "sortOrder": 901
}
```

### 13.2 Клубничный
```json
{
  "id": "milkshake-strawberry",
  "category": "milkshakes",
  "name": "Клубничный",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 902
}
```

### 13.3 Шоколадный
```json
{
  "id": "milkshake-chocolate",
  "category": "milkshakes",
  "name": "Шоколадный",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 903
}
```

### 13.4 Ванильный
```json
{
  "id": "milkshake-vanilla",
  "category": "milkshakes",
  "name": "Ванильный",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 904
}
```

---

## 14. Свежевыжатые соки

### 14.1 Апельсин
```json
{
  "id": "juice-orange",
  "category": "fresh-juices",
  "name": "Апельсин",
  "sizes": { "M": 1750, "L": 1950 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1001
}
```

### 14.2 Грейпфрут
```json
{
  "id": "juice-grapefruit",
  "category": "fresh-juices",
  "name": "Грейпфрут",
  "sizes": { "M": 1750, "L": 1950 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1002
}
```

### 14.3 Яблоко
```json
{
  "id": "juice-apple",
  "category": "fresh-juices",
  "name": "Яблоко",
  "sizes": { "M": 1200, "L": 1400 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1003
}
```

### 14.4 Апельсин-грейпфрут
```json
{
  "id": "juice-orange-grapefruit",
  "category": "fresh-juices",
  "name": "Апельсин-грейпфрут",
  "sizes": { "M": 1750, "L": 2050 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1004
}
```

### 14.5 Апельсин-яблоко
```json
{
  "id": "juice-orange-apple",
  "category": "fresh-juices",
  "name": "Апельсин-яблоко",
  "sizes": { "M": 1550, "L": 1750 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1005
}
```

### 14.6 Яблоко-грейпфрут
```json
{
  "id": "juice-apple-grapefruit",
  "category": "fresh-juices",
  "name": "Яблоко-грейпфрут",
  "sizes": { "M": 1550, "L": 1850 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1006
}
```

---

## 15. Смузи на фреше

### 15.1 Фруктовый микс
```json
{
  "id": "smoothie-fruit-mix",
  "category": "fresh-smoothies",
  "name": "Фруктовый микс",
  "ingredients": "банан, киви, фреш апельсиновый, фреш яблочный",
  "sizes": { "M": 1750, "L": 1950 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 1101
}
```

### 15.2 Яблоко-малина
```json
{
  "id": "smoothie-apple-raspberry",
  "category": "fresh-smoothies",
  "name": "Яблоко-малина",
  "ingredients": "малина, банан, фреш яблочный",
  "sizes": { "M": 1550, "L": 1750 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 1102
}
```

### 15.3 Смородина-банан
```json
{
  "id": "smoothie-currant-banana",
  "category": "fresh-smoothies",
  "name": "Смородина-банан",
  "ingredients": "смородина, банан, фреш апельсиновый",
  "sizes": { "M": 1550, "L": 1750 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1103
}
```

### 15.4 Щавель-ананас
```json
{
  "id": "smoothie-sorrel-pineapple",
  "category": "fresh-smoothies",
  "name": "Щавель-ананас",
  "ingredients": "щавель, ананас",
  "sizes": { "M": 950, "L": 1150 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1104
}
```

---

## 16. Смузи на молоке

### 16.1 Ягодный микс
```json
{
  "id": "milk-smoothie-berry-mix",
  "category": "milk-smoothies",
  "name": "Ягодный микс",
  "ingredients": "смородина, клюква, молоко, сливки",
  "sizes": { "M": 1450, "L": 1650 },
  "availableMilk": true,
  "tags": [],
  "sortOrder": 1201
}
```

### 16.2 Клубника-банан
```json
{
  "id": "milk-smoothie-strawberry-banana",
  "category": "milk-smoothies",
  "name": "Клубника-банан",
  "ingredients": "клубника, банан, молоко, сливки",
  "sizes": { "M": 1450, "L": 1650 },
  "availableMilk": true,
  "tags": ["hit"],
  "sortOrder": 1202
}
```

---

## 17. Лимонады

### 17.1 Домашний
```json
{
  "id": "lemonade-homemade",
  "category": "lemonades",
  "name": "Домашний",
  "sizes": { "M": 850, "L": 950 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1301
}
```

### 17.2 Мохито
```json
{
  "id": "lemonade-mojito",
  "category": "lemonades",
  "name": "Мохито",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1302
}
```

### 17.3 Арбуз-киви
```json
{
  "id": "lemonade-watermelon-kiwi",
  "category": "lemonades",
  "name": "Арбуз-киви",
  "sizes": { "M": 950, "L": 1050 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1303
}
```

### 17.4 Яблоко-маракуйя
```json
{
  "id": "lemonade-apple-passion",
  "category": "lemonades",
  "name": "Яблоко-маракуйя",
  "sizes": { "M": 1050, "L": 1150 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 1304
}
```

### 17.5 Ягодный бум
```json
{
  "id": "lemonade-berry-boom",
  "category": "lemonades",
  "name": "Ягодный бум",
  "sizes": { "M": 1050, "L": 1150 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1305
}
```

### 17.6 Апельсин
```json
{
  "id": "lemonade-orange",
  "category": "lemonades",
  "name": "Апельсин",
  "sizes": { "M": 1050, "L": 1150 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 1306
}
```

### 17.7 Лайм-малина
```json
{
  "id": "lemonade-lime-raspberry",
  "category": "lemonades",
  "name": "Лайм-малина",
  "sizes": { "M": 1150, "L": 1250 },
  "availableMilk": false,
  "tags": ["hit"],
  "sortOrder": 1307
}
```

### 17.8 Киви-алоэ
```json
{
  "id": "lemonade-kiwi-aloe",
  "category": "lemonades",
  "name": "Киви-алоэ",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1308
}
```

### 17.9 Клубника-карамель
```json
{
  "id": "lemonade-strawberry-caramel",
  "category": "lemonades",
  "name": "Клубника-карамель",
  "sizes": { "M": 1250, "L": 1350 },
  "availableMilk": false,
  "tags": [],
  "sortOrder": 1309
}
```

---

## 18. Скрипт миграции

Создать файл `scripts/migrate-menu.ts`:

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import menuData from '../MENU-DATA.json'; // экспортированный JSON

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
      createdAt: new Date(),
    });
  }
  
  await batch.commit();
  console.log(`Migrated ${menuData.length} items`);
}

migrate().catch(console.error);
```

Запуск: `npx ts-node scripts/migrate-menu.ts`

---

## 19. Hero-карточка на главном экране

По умолчанию — **Раф классика** (флагман, tag: hit).

```tsx
// В menu/page.tsx, вверху списка
<HeroCard
  item={menuItems.find(i => i.id === 'raf-classic')}
  background="linear-gradient(135deg, #1a7a44 0%, #2d9e5a 100%)"
  label="Хит сезона"
/>
```

Сезонное переключение:
- Октябрь-ноябрь: **Тыквенно-пряный латте**
- Декабрь-февраль: **Глинтвейн**
- Июнь-август: **Фраппучино** или **Лимонад Лайм-малина**
- Остальное время: **Раф классика**

---

## 20. Чеклист миграции

После запуска скрипта проверить:
- [ ] В Firestore Console видны все 13 категорий через фильтр
- [ ] Всего ~60+ документов в `menu_items`
- [ ] Цены на капучино S/M/L = 850/1050/1150
- [ ] `availableMilk: true` у всех кроме американо, эспрессо, соков, лимонадов, айс ти
- [ ] `tags: ["hit"]` у 15+ позиций (согласно фото)
- [ ] Сезонные (`tags: ["season"]`) — Глинтвейн, Тыквенно-пряный латте
- [ ] В `menu/page.tsx` хардкодный `MENU[]` удалён, вместо него — `onSnapshot` из `menu_items`

---

**Конец MENU-DATA.md**. Обновлять при изменении меню кофейни.
