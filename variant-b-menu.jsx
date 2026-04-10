import { useState, useEffect, useRef, useMemo } from "react";

// ══════════════════════════════════════════════
//  VARIANT B — Full-Screen Detail (Starbucks+)
//  Love is Coffee — Полное меню, 13 категорий
// ══════════════════════════════════════════════

// ── Brand Colors ──
const C = {
  bg: "#f2fdf6",
  dark: "#1a7a44",
  mid: "#2d9e5a",
  mint: "#3ecf82",
  pink: "#d42b4f",
  text: "#0f3a20",
  gray: "#6b7280",
  card: "#ffffff",
  border: "#d0f0e0",
  shadow: "0 2px 12px rgba(30,120,70,0.08)",
  orange: "#f59e0b",
};

// ── Categories ──
const CATEGORIES = [
  { id: "all", name: "Все", icon: "✨", gradient: ["#1a7a44", "#2d9e5a"] },
  { id: "classic-coffee", name: "Классика", icon: "☕", gradient: ["#1a7a44", "#2d9e5a"] },
  { id: "author-coffee", name: "Авторский", icon: "🎨", gradient: ["#d42b4f", "#e85d7a"] },
  { id: "ice-coffee", name: "Айс кофе", icon: "🧊", gradient: ["#0ea5e9", "#38bdf8"] },
  { id: "cocoa", name: "Какао", icon: "🍫", gradient: ["#92400e", "#b45309"] },
  { id: "home-tea", name: "Домашний чай", icon: "🫖", gradient: ["#f59e0b", "#fbbf24"] },
  { id: "author-tea", name: "Авторский чай", icon: "🌿", gradient: ["#be123c", "#e11d48"] },
  { id: "matcha", name: "Матча", icon: "🍵", gradient: ["#65a30d", "#84cc16"] },
  { id: "ice-tea", name: "Айс ти", icon: "🧋", gradient: ["#06b6d4", "#22d3ee"] },
  { id: "milkshakes", name: "Коктейли", icon: "🥤", gradient: ["#ec4899", "#f472b6"] },
  { id: "fresh-juices", name: "Соки", icon: "🍊", gradient: ["#f97316", "#fb923c"] },
  { id: "fresh-smoothies", name: "Смузи фреш", icon: "🥝", gradient: ["#eab308", "#facc15"] },
  { id: "milk-smoothies", name: "Смузи молоко", icon: "🫐", gradient: ["#a855f7", "#c084fc"] },
  { id: "lemonades", name: "Лимонады", icon: "🍋", gradient: ["#14b8a6", "#2dd4bf"] },
];

// ── Full Menu Data ──
const MENU = [
  // Кофейная классика
  { id:"cappuccino", cat:"classic-coffee", name:"Капучино", sizes:{S:850,M:1050,L:1150}, milk:true, tags:[], emoji:"☕", radar:{acidity:2,sweetness:3,bitterness:3,body:4,aroma:4}, desc:"Классический итальянский напиток с идеальным балансом эспрессо и молочной пенки" },
  { id:"latte", cat:"classic-coffee", name:"Латте", sizes:{M:900,L:1050}, milk:true, tags:[], emoji:"☕", radar:{acidity:1,sweetness:4,bitterness:2,body:3,aroma:3}, desc:"Нежный кофе с большим количеством молока и тонкой пенкой" },
  { id:"flat-white", cat:"classic-coffee", name:"Флэт уайт", sizes:{S:1000,M:1150,L:1250}, milk:true, tags:[], emoji:"☕", radar:{acidity:2,sweetness:2,bitterness:4,body:5,aroma:4}, desc:"Сильный кофейный характер с бархатистой текстурой молока" },
  { id:"americano", cat:"classic-coffee", name:"Американо", sizes:{S:750,M:850,L:950}, milk:false, tags:[], emoji:"☕", radar:{acidity:3,sweetness:1,bitterness:4,body:2,aroma:3}, desc:"Чистый вкус кофе — эспрессо с горячей водой" },
  { id:"espresso", cat:"classic-coffee", name:"Эспрессо", sizes:{S:450,M:550}, milk:false, tags:[], emoji:"☕", radar:{acidity:3,sweetness:1,bitterness:5,body:5,aroma:5}, desc:"Основа всех кофейных напитков — концентрированный, насыщенный, честный" },
  // Авторский кофе
  { id:"irish-coffee", cat:"author-coffee", name:"Айриш кофе", sizes:{M:950,L:1050}, milk:true, tags:[], emoji:"🍀", desc:"Кофе с ирландским характером — согревающий и ароматный" },
  { id:"raf-classic", cat:"author-coffee", name:"Раф классика", sizes:{M:1250,L:1350}, milk:true, tags:["hit"], emoji:"🧁", radar:{acidity:1,sweetness:5,bitterness:1,body:4,aroma:5}, desc:"Наш флагман. Сливочный, нежный, как первый снег в Алматы" },
  { id:"raf-honey", cat:"author-coffee", name:"Раф медовый", sizes:{M:1250,L:1350}, milk:true, tags:["hit"], emoji:"🍯", desc:"Раф с натуральным горным мёдом — сладость природы" },
  { id:"raf-banana-caramel", cat:"author-coffee", name:"Раф банан-карамель", sizes:{M:1350,L:1450}, milk:true, tags:["hit"], emoji:"🍌", desc:"Взрослый десерт в чашке — банан встречает карамель" },
  { id:"mocha", cat:"author-coffee", name:"Мокко", sizes:{M:1250,L:1350}, milk:true, tags:[], emoji:"🍫", desc:"Шоколад + кофе = классическое сочетание для сладкоежек" },
  { id:"mocha-white-chocolate", cat:"author-coffee", name:"Мокко белый шоколад", sizes:{M:1350,L:1450}, milk:true, tags:[], emoji:"🤍", desc:"Нежный белый шоколад с кофейной глубиной" },
  { id:"latte-halva", cat:"author-coffee", name:"Латте халва", sizes:{M:950,L:1050}, milk:true, tags:[], emoji:"🏺", desc:"Восточный колорит — латте с настоящей халвой" },
  { id:"pumpkin-spice-latte", cat:"author-coffee", name:"Тыквенно-пряный латте", sizes:{M:1350,L:1450}, milk:true, tags:["season"], emoji:"🎃", desc:"Сезонный хит — корица, мускатный орех, тёплая тыква" },
  // Айс кофе
  { id:"ice-americano", cat:"ice-coffee", name:"Айс американо", sizes:{M:950,L:1050}, milk:false, tags:[], emoji:"🧊", desc:"Холодный американо со льдом — бодрость без лишнего" },
  { id:"ice-cappuccino", cat:"ice-coffee", name:"Айс капучино", sizes:{M:1250,L:1350}, milk:true, tags:[], emoji:"🧊", desc:"Классический капучино в холодной версии" },
  { id:"ice-latte", cat:"ice-coffee", name:"Айс латте", sizes:{M:1150,L:1250}, milk:true, tags:[], emoji:"🧊", desc:"Нежный холодный латте для жаркого дня" },
  { id:"frappuccino", cat:"ice-coffee", name:"Фраппучино", sizes:{M:1350,L:1450}, milk:true, tags:["hit"], emoji:"🥤", desc:"Ледяной, сливочный, взбитый — летний бестселлер" },
  { id:"banana-coffee", cat:"ice-coffee", name:"Банановый кофе", sizes:{M:1350,L:1450}, milk:true, tags:["hit"], emoji:"🍌", desc:"Банан + кофе + лёд = неожиданно идеальное сочетание" },
  { id:"bumble-bee", cat:"ice-coffee", name:"Бамбл би", sizes:{M:1250,L:1350}, milk:false, tags:[], emoji:"🐝", desc:"Апельсиновый сок с эспрессо — яркий и энергичный" },
  { id:"espresso-tonic", cat:"ice-coffee", name:"Эспрессо тоник", sizes:{M:1150,L:1250}, milk:false, tags:[], emoji:"✨", desc:"Горький тоник встречает эспрессо — освежающая горечь" },
  // Какао
  { id:"cocoa", cat:"cocoa", name:"Какао", sizes:{M:1050,L:1150}, milk:true, tags:[], emoji:"🍫", desc:"Настоящее какао на молоке — как в детстве, но лучше" },
  { id:"hot-chocolate", cat:"cocoa", name:"Горячий шоколад", sizes:{M:1150,L:1250}, milk:true, tags:[], emoji:"🍫", desc:"Густой, бархатистый горячий шоколад" },
  // Домашний чай
  { id:"home-tea-naryadniy", cat:"home-tea", name:"Нарядный", ing:"апельсин, лимон, мята", sizes:{M:850,L:950}, milk:false, tags:["hit"], emoji:"🍊" },
  { id:"home-tea-ginger", cat:"home-tea", name:"Имбирный", ing:"имбирь, мёд, лимон, апельсин", sizes:{M:850,L:950}, milk:false, tags:[], emoji:"🫚" },
  { id:"home-tea-sea-buckthorn", cat:"home-tea", name:"Облепиховый", ing:"облепиха, сироп маракуйя, чай", sizes:{M:950,L:1050}, milk:false, tags:["hit"], emoji:"🟠" },
  { id:"home-tea-raspberry", cat:"home-tea", name:"Малиновый", ing:"малина, мята, апельсин, лимон", sizes:{M:1050,L:1150}, milk:false, tags:[], emoji:"🫐" },
  { id:"home-tea-berry", cat:"home-tea", name:"Ягодный", ing:"смородина, клюква, лимон", sizes:{M:950,L:1050}, milk:false, tags:[], emoji:"🍇" },
  // Авторский чай
  { id:"chai-latte", cat:"author-tea", name:"Чай латте", ing:"чай со взбитым молоком и корицей", sizes:{M:550,L:650}, milk:true, tags:[], emoji:"🫖" },
  { id:"grog", cat:"author-tea", name:"Грог", ing:"чай, имбирь, корица, кардамон, апельсин, лимон, мёд", sizes:{M:950,L:1050}, milk:false, tags:[], emoji:"🏴‍☠️" },
  { id:"mulled-wine", cat:"author-tea", name:"Глинтвейн", ing:"апельсин, лимон, мята, вишнёвый сок, гвоздика, корица", sizes:{M:1050,L:1150}, milk:false, tags:["hit","season"], emoji:"🍷" },
  { id:"moroccan-tea", cat:"author-tea", name:"Марокканский", ing:"апельсин, лимон, мята, чай, гвоздика, корица", sizes:{M:950,L:1050}, milk:false, tags:[], emoji:"🕌" },
  { id:"tara-tea", cat:"author-tea", name:"Чай тары", ing:"тары, молоко, мёд", sizes:{M:1250,L:1350}, milk:true, tags:[], emoji:"🏔️" },
  { id:"tangerine-tea", cat:"author-tea", name:"Мандариновый", ing:"мандарин, лимон, мята", sizes:{M:1150,L:1250}, milk:false, tags:[], emoji:"🍊" },
  { id:"spicy-currant-tea", cat:"author-tea", name:"Пряная смородина", ing:"смородина, гвоздика, корица", sizes:{M:1050,L:1150}, milk:false, tags:["hit"], emoji:"🫐" },
  { id:"raspberry-ginger-tea", cat:"author-tea", name:"Малина-имбирь", ing:"малина, имбирь, лимон, апельсин", sizes:{M:1350,L:1450}, milk:false, tags:["hit"], emoji:"🍓" },
  // Матча
  { id:"green-matcha", cat:"matcha", name:"Зелёная матча", sizes:{M:1150,L:1250}, milk:true, tags:[], emoji:"🍵", desc:"Классическая японская матча на молоке" },
  { id:"blue-matcha", cat:"matcha", name:"Голубая матча", sizes:{M:1150,L:1250}, milk:true, tags:[], emoji:"💙", desc:"Матча с цветком клитории — невероятный цвет и вкус" },
  // Айс ти
  { id:"ice-tea-berry", cat:"ice-tea", name:"Ягодный", sizes:{M:750,L:850}, milk:false, tags:[], emoji:"🧋" },
  { id:"ice-tea-mango", cat:"ice-tea", name:"Манго", sizes:{M:750,L:850}, milk:false, tags:[], emoji:"🥭" },
  { id:"ice-tea-passion-fruit", cat:"ice-tea", name:"Маракуйя", sizes:{M:750,L:850}, milk:false, tags:[], emoji:"💛" },
  { id:"ice-tea-pomegranate", cat:"ice-tea", name:"Гранатовый", sizes:{M:750,L:850}, milk:false, tags:[], emoji:"🔴" },
  { id:"ice-tea-raspberry", cat:"ice-tea", name:"Малиновый", sizes:{M:750,L:850}, milk:false, tags:[], emoji:"🍓" },
  { id:"ice-tea-cherry", cat:"ice-tea", name:"Вишнёвый", sizes:{M:750,L:850}, milk:false, tags:[], emoji:"🍒" },
  // Молочные коктейли
  { id:"milkshake-banana", cat:"milkshakes", name:"Банановый", sizes:{M:1350,L:1450}, milk:true, tags:["hit"], emoji:"🍌" },
  { id:"milkshake-strawberry", cat:"milkshakes", name:"Клубничный", sizes:{M:1250,L:1350}, milk:true, tags:[], emoji:"🍓" },
  { id:"milkshake-chocolate", cat:"milkshakes", name:"Шоколадный", sizes:{M:1250,L:1350}, milk:true, tags:[], emoji:"🍫" },
  { id:"milkshake-vanilla", cat:"milkshakes", name:"Ванильный", sizes:{M:1250,L:1350}, milk:true, tags:[], emoji:"🍦" },
  // Свежевыжатые соки
  { id:"juice-orange", cat:"fresh-juices", name:"Апельсин", sizes:{M:1750,L:1950}, milk:false, tags:[], emoji:"🍊" },
  { id:"juice-grapefruit", cat:"fresh-juices", name:"Грейпфрут", sizes:{M:1750,L:1950}, milk:false, tags:[], emoji:"🍊" },
  { id:"juice-apple", cat:"fresh-juices", name:"Яблоко", sizes:{M:1200,L:1400}, milk:false, tags:[], emoji:"🍏" },
  { id:"juice-orange-grapefruit", cat:"fresh-juices", name:"Апельсин-грейпфрут", sizes:{M:1750,L:2050}, milk:false, tags:[], emoji:"🍊" },
  { id:"juice-orange-apple", cat:"fresh-juices", name:"Апельсин-яблоко", sizes:{M:1550,L:1750}, milk:false, tags:[], emoji:"🍎" },
  { id:"juice-apple-grapefruit", cat:"fresh-juices", name:"Яблоко-грейпфрут", sizes:{M:1550,L:1850}, milk:false, tags:[], emoji:"🍏" },
  // Смузи на фреше
  { id:"smoothie-fruit-mix", cat:"fresh-smoothies", name:"Фруктовый микс", ing:"банан, киви, фреш апельсиновый, фреш яблочный", sizes:{M:1750,L:1950}, milk:false, tags:["hit"], emoji:"🥝" },
  { id:"smoothie-apple-raspberry", cat:"fresh-smoothies", name:"Яблоко-малина", ing:"малина, банан, фреш яблочный", sizes:{M:1550,L:1750}, milk:false, tags:["hit"], emoji:"🍎" },
  { id:"smoothie-currant-banana", cat:"fresh-smoothies", name:"Смородина-банан", ing:"смородина, банан, фреш апельсиновый", sizes:{M:1550,L:1750}, milk:false, tags:[], emoji:"🫐" },
  { id:"smoothie-sorrel-pineapple", cat:"fresh-smoothies", name:"Щавель-ананас", ing:"щавель, ананас", sizes:{M:950,L:1150}, milk:false, tags:[], emoji:"🍍" },
  // Смузи на молоке
  { id:"milk-smoothie-berry-mix", cat:"milk-smoothies", name:"Ягодный микс", ing:"смородина, клюква, молоко, сливки", sizes:{M:1450,L:1650}, milk:true, tags:[], emoji:"🫐" },
  { id:"milk-smoothie-strawberry-banana", cat:"milk-smoothies", name:"Клубника-банан", ing:"клубника, банан, молоко, сливки", sizes:{M:1450,L:1650}, milk:true, tags:["hit"], emoji:"🍓" },
  // Лимонады
  { id:"lemonade-homemade", cat:"lemonades", name:"Домашний", sizes:{M:850,L:950}, milk:false, tags:[], emoji:"🍋" },
  { id:"lemonade-mojito", cat:"lemonades", name:"Мохито", sizes:{M:950,L:1050}, milk:false, tags:[], emoji:"🌿" },
  { id:"lemonade-watermelon-kiwi", cat:"lemonades", name:"Арбуз-киви", sizes:{M:950,L:1050}, milk:false, tags:[], emoji:"🍉" },
  { id:"lemonade-apple-passion", cat:"lemonades", name:"Яблоко-маракуйя", sizes:{M:1050,L:1150}, milk:false, tags:["hit"], emoji:"💛" },
  { id:"lemonade-berry-boom", cat:"lemonades", name:"Ягодный бум", sizes:{M:1050,L:1150}, milk:false, tags:[], emoji:"💜" },
  { id:"lemonade-orange", cat:"lemonades", name:"Апельсин", sizes:{M:1050,L:1150}, milk:false, tags:["hit"], emoji:"🍊" },
  { id:"lemonade-lime-raspberry", cat:"lemonades", name:"Лайм-малина", sizes:{M:1150,L:1250}, milk:false, tags:["hit"], emoji:"💚" },
  { id:"lemonade-kiwi-aloe", cat:"lemonades", name:"Киви-алоэ", sizes:{M:1250,L:1350}, milk:false, tags:[], emoji:"🥝" },
  { id:"lemonade-strawberry-caramel", cat:"lemonades", name:"Клубника-карамель", sizes:{M:1250,L:1350}, milk:false, tags:[], emoji:"🍓" },
];

const SIZE_ORDER = { S: 0, M: 1, L: 2 };
const MILKS = [
  { id: "classic", name: "Обычное", price: 0, icon: "🥛" },
  { id: "oat", name: "Овсяное", price: 500, icon: "🌾" },
  { id: "coconut", name: "Кокосовое", price: 500, icon: "🥥" },
  { id: "almond", name: "Миндальное", price: 500, icon: "🌰" },
];
const SYRUPS = [
  { id: "vanilla", name: "Ваниль", price: 200, icon: "🍦" },
  { id: "caramel", name: "Карамель", price: 200, icon: "🍮" },
  { id: "hazelnut", name: "Лесной орех", price: 200, icon: "🌰" },
  { id: "coconut", name: "Кокос", price: 200, icon: "🥥" },
  { id: "lavender", name: "Лаванда", price: 200, icon: "💜" },
];

function fmt(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009") + "₸";
}

function getCat(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

function getSortedSizes(item) {
  return Object.keys(item.sizes).sort((a, b) => SIZE_ORDER[a] - SIZE_ORDER[b]);
}

// ── Radar Chart (SVG) ──
function RadarChart({ data, color = "#1a7a44", size = 160 }) {
  if (!data) return null;
  const axes = [
    { key: "acidity", label: "Кислотность" },
    { key: "sweetness", label: "Сладость" },
    { key: "bitterness", label: "Горечь" },
    { key: "body", label: "Тело" },
    { key: "aroma", label: "Аромат" },
  ];
  const cx = size / 2, cy = size / 2, R = size * 0.36;
  const angle = (i) => (Math.PI * 2 * i) / 5 - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

  const rings = [1, 2, 3, 4, 5];
  const dataPoints = axes.map((a, i) => pt(i, (data[a.key] / 5) * R));
  const poly = dataPoints.map((p) => p.join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((r) => (
        <polygon
          key={r}
          points={axes.map((_, i) => pt(i, (r / 5) * R).join(",")).join(" ")}
          fill="none"
          stroke={r === 5 ? "#d0f0e0" : "#e5e7eb"}
          strokeWidth={r === 5 ? 1.5 : 0.5}
          opacity={0.6}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />;
      })}
      <polygon points={poly} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={color} />
      ))}
      {axes.map((a, i) => {
        const [x, y] = pt(i, R + 18);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fill="#6b7280" fontSize={9} fontWeight={500}>
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Animated Counter ──
function AnimatedPrice({ value }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let start = display;
    const diff = value - start;
    if (diff === 0) return;
    const steps = 12;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(start + (diff * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{fmt(display)}</span>;
}

// ── Tag Badge ──
function TagBadge({ tag }) {
  if (tag === "hit") return (
    <span style={{
      background: C.pink, color: "#fff", fontSize: 9, fontWeight: 800,
      padding: "2px 8px", borderRadius: 6, textTransform: "uppercase",
      letterSpacing: 1, lineHeight: 1,
    }}>ХИТ</span>
  );
  if (tag === "season") return (
    <span style={{
      background: C.orange, color: "#fff", fontSize: 9, fontWeight: 800,
      padding: "2px 8px", borderRadius: 6, textTransform: "uppercase",
      letterSpacing: 1, lineHeight: 1,
    }}>СЕЗОН</span>
  );
  if (tag === "new") return (
    <span style={{
      background: C.mint, color: C.text, fontSize: 9, fontWeight: 800,
      padding: "2px 8px", borderRadius: 6, textTransform: "uppercase",
      letterSpacing: 1, lineHeight: 1,
    }}>NEW</span>
  );
  return null;
}

// ── Drink Card (Grid) ──
function DrinkCard({ item, onClick }) {
  const cat = getCat(item.cat);
  const [g1, g2] = cat.gradient;
  const sizes = getSortedSizes(item);
  const minPrice = Math.min(...Object.values(item.sizes));
  const isHit = item.tags.includes("hit");
  const isSeason = item.tags.includes("season");

  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${g1}, ${g2})`,
        borderRadius: 20,
        padding: "14px 14px 16px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 170,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* Decorative circle */}
      <div style={{
        position: "absolute", top: -30, right: -30, width: 100, height: 100,
        borderRadius: "50%", background: "rgba(255,255,255,0.08)",
      }} />
      <div style={{
        position: "absolute", bottom: -20, left: -20, width: 70, height: 70,
        borderRadius: "50%", background: "rgba(255,255,255,0.05)",
      }} />

      {/* Tags */}
      <div style={{ display: "flex", gap: 4, marginBottom: 6, position: "relative", zIndex: 1 }}>
        {item.tags.map((t) => <TagBadge key={t} tag={t} />)}
      </div>

      {/* Emoji */}
      <div style={{
        fontSize: 42, textAlign: "center", margin: "4px 0 8px",
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
        position: "relative", zIndex: 1,
      }}>
        {item.emoji}
      </div>

      {/* Name */}
      <div style={{
        color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2,
        marginTop: "auto", position: "relative", zIndex: 1,
        textShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}>
        {item.name}
      </div>

      {/* Sizes + Price */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 6, position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", gap: 3 }}>
          {sizes.map((s) => (
            <span key={s} style={{
              background: "rgba(255,255,255,0.28)", color: "#fff",
              fontSize: 10, fontWeight: 700, padding: "2px 6px",
              borderRadius: 5, lineHeight: 1,
            }}>{s}</span>
          ))}
        </div>
        <span style={{
          color: "#fff", fontWeight: 800, fontSize: 13,
          textShadow: "0 1px 3px rgba(0,0,0,0.2)", opacity: 0.95,
        }}>
          от {fmt(minPrice)}
        </span>
      </div>
    </div>
  );
}

// ── Full-Screen Detail Page ──
function DetailPage({ item, onClose, onAdd }) {
  const cat = getCat(item.cat);
  const [g1, g2] = cat.gradient;
  const sizes = getSortedSizes(item);
  const [selectedSize, setSelectedSize] = useState(sizes[Math.floor(sizes.length / 2)]);
  const [selectedMilk, setSelectedMilk] = useState("classic");
  const [selectedSyrups, setSelectedSyrups] = useState([]);
  const [qty, setQty] = useState(1);
  const [showAdded, setShowAdded] = useState(false);

  const basePrice = item.sizes[selectedSize] || 0;
  const milkExtra = MILKS.find((m) => m.id === selectedMilk)?.price || 0;
  const syrupExtra = selectedSyrups.length * 200;
  const totalPrice = (basePrice + milkExtra + syrupExtra) * qty;

  const toggleSyrup = (id) => {
    setSelectedSyrups((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    setShowAdded(true);
    setTimeout(() => {
      onAdd?.({ ...item, size: selectedSize, milk: selectedMilk, syrups: selectedSyrups, qty, total: totalPrice });
      setTimeout(() => setShowAdded(false), 300);
    }, 600);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: C.bg,
      display: "flex", flexDirection: "column", overflowY: "auto",
      animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes confettiBurst { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        .detail-section { animation: fadeIn 0.4s ease forwards; opacity: 0; }
        .detail-section:nth-child(1) { animation-delay: 0.1s; }
        .detail-section:nth-child(2) { animation-delay: 0.15s; }
        .detail-section:nth-child(3) { animation-delay: 0.2s; }
        .detail-section:nth-child(4) { animation-delay: 0.25s; }
        .detail-section:nth-child(5) { animation-delay: 0.3s; }
        .size-btn { transition: all 0.2s ease; }
        .size-btn:active { transform: scale(0.94); }
        .milk-btn { transition: all 0.2s ease; }
        .milk-btn:active { transform: scale(0.96); }
        .syrup-chip { transition: all 0.2s ease; }
        .syrup-chip:active { transform: scale(0.95); }
        .qty-btn { transition: all 0.15s ease; }
        .qty-btn:active { transform: scale(0.88); }
      `}</style>

      {/* ── Hero Section ── */}
      <div style={{
        background: `linear-gradient(165deg, ${g1} 0%, ${g2} 60%, ${g1}dd 100%)`,
        padding: "0 0 40px",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Decorative shapes */}
        <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
        <div style={{ position:"absolute", bottom:-40, left:-40, width:150, height:150, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", top:60, left:-30, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />

        {/* Top bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "52px 20px 0", position: "relative", zIndex: 2,
        }}>
          <button
            onClick={onClose}
            style={{
              width: 40, height: 40, borderRadius: 14,
              background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(10px)", transition: "all 0.2s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            ←
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {item.tags.map((t) => <TagBadge key={t} tag={t} />)}
          </div>
        </div>

        {/* Emoji hero */}
        <div style={{
          textAlign: "center", margin: "24px 0 16px",
          position: "relative", zIndex: 2,
        }}>
          <div style={{
            fontSize: 96,
            filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))",
            animation: "scaleIn 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {item.emoji}
          </div>
        </div>

        {/* Name + category */}
        <div style={{
          textAlign: "center", position: "relative", zIndex: 2,
          padding: "0 24px",
        }}>
          <div style={{
            color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: 2, marginBottom: 6,
          }}>
            {cat.icon} {cat.name}
          </div>
          <h1 style={{
            color: "#fff", fontSize: 28, fontWeight: 800,
            margin: 0, lineHeight: 1.15,
            textShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}>
            {item.name}
          </h1>
          {item.desc && (
            <p style={{
              color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.5,
              margin: "10px auto 0", maxWidth: 300,
            }}>
              {item.desc}
            </p>
          )}
          {item.ing && (
            <p style={{
              color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.4,
              margin: "8px auto 0", maxWidth: 300, fontStyle: "italic",
            }}>
              {item.ing}
            </p>
          )}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{
        flex: 1, padding: "0 20px 140px", marginTop: -20,
        position: "relative", zIndex: 1,
      }}>
        {/* Rounded card overlay */}
        <div style={{
          background: C.bg, borderRadius: "24px 24px 0 0",
          padding: "24px 0 0",
        }}>

          {/* Radar Chart */}
          {item.radar && (
            <div className="detail-section" style={{
              background: "#fff", borderRadius: 20, padding: "20px 16px",
              marginBottom: 16, boxShadow: C.shadow,
              border: `1px solid ${C.border}`,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: "0 0 8px 4px" }}>
                Профиль вкуса
              </h3>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <RadarChart data={item.radar} color={g1} size={170} />
              </div>
            </div>
          )}

          {/* Size selector */}
          <div className="detail-section" style={{
            background: "#fff", borderRadius: 20, padding: 20,
            marginBottom: 16, boxShadow: C.shadow,
            border: `1px solid ${C.border}`,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: "0 0 14px" }}>
              Размер
            </h3>
            <div style={{ display: "flex", gap: 10 }}>
              {sizes.map((s) => {
                const active = s === selectedSize;
                const cupScale = s === "S" ? 0.8 : s === "M" ? 1 : 1.2;
                return (
                  <button
                    key={s}
                    className="size-btn"
                    onClick={() => setSelectedSize(s)}
                    style={{
                      flex: 1, border: active ? `2px solid ${g1}` : `1.5px solid ${C.border}`,
                      borderRadius: 16, padding: "14px 8px",
                      background: active ? `${g1}10` : "#fff",
                      cursor: "pointer", textAlign: "center",
                      boxShadow: active ? `0 0 0 3px ${g1}20` : "none",
                    }}
                  >
                    <div style={{
                      fontSize: 28 * cupScale, marginBottom: 4,
                      filter: active ? "none" : "grayscale(0.3)",
                    }}>
                      ☕
                    </div>
                    <div style={{
                      fontSize: 16, fontWeight: 800,
                      color: active ? g1 : C.gray,
                    }}>
                      {s}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: active ? C.text : C.gray, marginTop: 2,
                    }}>
                      {fmt(item.sizes[s])}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milk selector */}
          {item.milk && (
            <div className="detail-section" style={{
              background: "#fff", borderRadius: 20, padding: 20,
              marginBottom: 16, boxShadow: C.shadow,
              border: `1px solid ${C.border}`,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: "0 0 14px" }}>
                Молоко
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MILKS.map((m) => {
                  const active = m.id === selectedMilk;
                  return (
                    <button
                      key={m.id}
                      className="milk-btn"
                      onClick={() => setSelectedMilk(m.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 14,
                        border: active ? `2px solid ${g1}` : `1.5px solid ${C.border}`,
                        background: active ? `${g1}08` : "#fff",
                        cursor: "pointer", textAlign: "left",
                        boxShadow: active ? `0 0 0 3px ${g1}15` : "none",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{m.icon}</span>
                      <span style={{
                        flex: 1, fontSize: 14, fontWeight: active ? 700 : 500,
                        color: active ? C.text : C.gray,
                      }}>
                        {m.name}
                      </span>
                      {m.price > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.gray }}>
                          +{fmt(m.price)}
                        </span>
                      )}
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        border: active ? `2px solid ${g1}` : `2px solid ${C.border}`,
                        background: active ? g1 : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                      }}>
                        {active && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Syrups */}
          <div className="detail-section" style={{
            background: "#fff", borderRadius: 20, padding: 20,
            marginBottom: 16, boxShadow: C.shadow,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>
                Сиропы
              </h3>
              <span style={{ fontSize: 11, color: C.gray }}>+200₸ каждый</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SYRUPS.map((s) => {
                const active = selectedSyrups.includes(s.id);
                return (
                  <button
                    key={s.id}
                    className="syrup-chip"
                    onClick={() => toggleSyrup(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 24,
                      border: active ? `2px solid ${g1}` : `1.5px solid ${C.border}`,
                      background: active ? `${g1}12` : "#fff",
                      cursor: "pointer", fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active ? C.text : C.gray,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="detail-section" style={{
            background: "#fff", borderRadius: 20, padding: 20,
            marginBottom: 24, boxShadow: C.shadow,
            border: `1px solid ${C.border}`,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: "0 0 14px" }}>
              Количество
            </h3>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
            }}>
              <button
                className="qty-btn"
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  border: `1.5px solid ${C.border}`,
                  background: qty <= 1 ? "#f9fafb" : "#fff",
                  cursor: qty <= 1 ? "not-allowed" : "pointer",
                  fontSize: 20, fontWeight: 700,
                  color: qty <= 1 ? "#d1d5db" : C.dark,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                −
              </button>
              <span style={{
                fontSize: 28, fontWeight: 800, color: C.text,
                minWidth: 40, textAlign: "center",
              }}>
                {qty}
              </span>
              <button
                className="qty-btn"
                onClick={() => setQty(Math.min(10, qty + 1))}
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  border: `1.5px solid ${C.border}`,
                  background: "#fff", cursor: "pointer",
                  fontSize: 20, fontWeight: 700, color: C.dark,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Bottom CTA ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 20px", paddingBottom: 28,
        background: "linear-gradient(0deg, #fff 70%, rgba(255,255,255,0) 100%)",
        zIndex: 110,
      }}>
        <button
          onClick={handleAdd}
          style={{
            width: "100%", padding: "16px 24px",
            borderRadius: 18,
            background: showAdded
              ? C.mint
              : `linear-gradient(135deg, ${g1}, ${g2})`,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, boxShadow: `0 6px 24px ${g1}40`,
            transition: "all 0.3s ease",
            transform: showAdded ? "scale(1.02)" : "scale(1)",
          }}
        >
          {showAdded ? (
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
              Добавлено в корзину ✓
            </span>
          ) : (
            <>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
                В корзину
              </span>
              <span style={{
                color: "#fff", fontSize: 16, fontWeight: 800,
                marginLeft: "auto",
                background: "rgba(255,255,255,0.2)",
                padding: "4px 14px", borderRadius: 12,
              }}>
                <AnimatedPrice value={totalPrice} />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Cart Preview Bar ──
function CartBar({ cart, onOpen }) {
  const total = cart.reduce((sum, i) => sum + i.total, 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  if (cart.length === 0) return null;

  return (
    <div
      onClick={onOpen}
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "14px 20px", paddingBottom: 28,
        background: "linear-gradient(0deg, rgba(255,255,255,1) 80%, rgba(255,255,255,0) 100%)",
        zIndex: 50, cursor: "pointer",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div style={{
        background: `linear-gradient(135deg, ${C.dark}, ${C.mid})`,
        borderRadius: 18, padding: "14px 20px",
        display: "flex", alignItems: "center",
        boxShadow: `0 6px 24px ${C.dark}40`,
      }}>
        <div style={{
          background: "rgba(255,255,255,0.2)", borderRadius: 10,
          width: 32, height: 32, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff",
        }}>
          {count}
        </div>
        <span style={{
          flex: 1, textAlign: "center", color: "#fff",
          fontSize: 15, fontWeight: 700,
        }}>
          Перейти к заказу
        </span>
        <span style={{
          color: "#fff", fontSize: 15, fontWeight: 800,
          background: "rgba(255,255,255,0.2)",
          padding: "4px 14px", borderRadius: 12,
        }}>
          {fmt(total)}
        </span>
      </div>
    </div>
  );
}

// ── Cart Full View ──
function CartView({ cart, setCart, onClose }) {
  const total = cart.reduce((sum, i) => sum + i.total, 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);

  const removeItem = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, background: C.bg,
      display: "flex", flexDirection: "column",
      animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* Header */}
      <div style={{
        padding: "52px 20px 16px",
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: 14,
          background: "#f0fdf4", border: `1px solid ${C.border}`,
          cursor: "pointer", fontSize: 18, display: "flex",
          alignItems: "center", justifyContent: "center", color: C.dark,
        }}>←</button>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.dark }}>
          Корзина
        </h2>
        <span style={{
          background: C.dark, color: "#fff", fontSize: 12,
          fontWeight: 700, padding: "2px 10px", borderRadius: 10,
        }}>{count}</span>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: C.gray }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Корзина пуста</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Выберите напиток из меню</div>
          </div>
        ) : (
          cart.map((item, idx) => {
            const cat = getCat(item.cat);
            const [g1] = cat.gradient;
            return (
              <div key={idx} style={{
                background: "#fff", borderRadius: 18, padding: 16,
                marginBottom: 10, boxShadow: C.shadow,
                border: `1px solid ${C.border}`,
                display: "flex", gap: 14, alignItems: "center",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `linear-gradient(135deg, ${cat.gradient[0]}, ${cat.gradient[1]})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, flexShrink: 0,
                }}>
                  {item.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                    {item.size} · {MILKS.find(m => m.id === item.milk)?.name || ""}
                    {item.syrups.length > 0 && ` · ${item.syrups.length} сироп`}
                    {item.qty > 1 && ` · x${item.qty}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>{fmt(item.total)}</div>
                  <button
                    onClick={() => removeItem(idx)}
                    style={{
                      background: "none", border: "none",
                      color: "#ef4444", fontSize: 11, fontWeight: 600,
                      cursor: "pointer", marginTop: 2, padding: 0,
                    }}
                  >Убрать</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom */}
      {cart.length > 0 && (
        <div style={{
          padding: "16px 20px 28px",
          borderTop: `1px solid ${C.border}`,
          background: "#fff",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 15, color: C.gray }}>Итого</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>{fmt(total)}</span>
          </div>
          <button style={{
            width: "100%", padding: 16, borderRadius: 18,
            background: `linear-gradient(135deg, ${C.dark}, ${C.mid})`,
            border: "none", color: "#fff", fontSize: 16,
            fontWeight: 700, cursor: "pointer",
            boxShadow: `0 6px 24px ${C.dark}40`,
          }}>
            Оформить заказ
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main App ──
export default function VariantBApp() {
  const [activeCat, setActiveCat] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const catScrollRef = useRef(null);

  const filteredMenu = useMemo(() => {
    let items = MENU;
    if (activeCat !== "all") items = items.filter((i) => i.cat === activeCat);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        (i.ing && i.ing.toLowerCase().includes(q)) ||
        (i.desc && i.desc.toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeCat, searchQuery]);

  const hitItems = useMemo(() => MENU.filter((i) => i.tags.includes("hit")), []);

  const addToCart = (item) => {
    setCart((prev) => [...prev, item]);
    setSelectedItem(null);
  };

  if (selectedItem) {
    return <DetailPage item={selectedItem} onClose={() => setSelectedItem(null)} onAdd={addToCart} />;
  }

  if (showCart) {
    return <CartView cart={cart} setCart={setCart} onClose={() => setShowCart(false)} />;
  }

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto",
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: "relative", paddingBottom: cart.length > 0 ? 90 : 20,
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "52px 20px 0",
        background: `linear-gradient(180deg, ${C.dark}08 0%, transparent 100%)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 26, fontWeight: 800, color: C.dark,
              fontFamily: "'Playfair Display', serif",
            }}>
              Love is Coffee
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.gray }}>
              Аксай · ул. Момышулы 14
            </p>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "#fff", border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: C.shadow, cursor: "pointer",
          }}>
            ☕
          </div>
        </div>

        {/* Search */}
        <div style={{
          position: "relative", marginBottom: 16,
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "#fff", borderRadius: 16,
            border: searchFocused ? `2px solid ${C.dark}` : `1.5px solid ${C.border}`,
            padding: "0 14px", transition: "border 0.2s",
            boxShadow: searchFocused ? `0 0 0 3px ${C.dark}15` : C.shadow,
          }}>
            <span style={{ fontSize: 16, color: C.gray, marginRight: 8 }}>🔍</span>
            <input
              type="text"
              placeholder="Найти напиток..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1, padding: "13px 0", border: "none", outline: "none",
                fontSize: 14, background: "transparent", color: C.text,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 16, color: C.gray, padding: 4,
                }}
              >✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div
        ref={catScrollRef}
        style={{
          display: "flex", gap: 8, overflowX: "auto",
          padding: "0 20px 16px", scrollBehavior: "smooth",
          msOverflowStyle: "none", scrollbarWidth: "none",
        }}
      >
        {CATEGORIES.map((cat) => {
          const active = cat.id === activeCat;
          const count = cat.id === "all" ? MENU.length : MENU.filter((i) => i.cat === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCat(cat.id); setSearchQuery(""); }}
              style={{
                flexShrink: 0, padding: "8px 16px", borderRadius: 24,
                border: active ? "none" : `1.5px solid ${C.border}`,
                background: active ? `linear-gradient(135deg, ${cat.gradient[0]}, ${cat.gradient[1]})` : "#fff",
                color: active ? "#fff" : C.gray,
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: "pointer", whiteSpace: "nowrap",
                boxShadow: active ? `0 3px 12px ${cat.gradient[0]}40` : "none",
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: 14 }}>{cat.icon}</span>
              {cat.name}
              <span style={{
                fontSize: 10, fontWeight: 700, opacity: 0.75,
                background: active ? "rgba(255,255,255,0.25)" : `${C.border}`,
                padding: "1px 6px", borderRadius: 8,
                color: active ? "#fff" : C.gray,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Hit Banner (only on "all" category) ── */}
      {activeCat === "all" && !searchQuery && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{
            background: `linear-gradient(135deg, ${C.pink}18, ${C.orange}10)`,
            borderRadius: 20, padding: "14px 18px",
            border: `1px solid ${C.pink}20`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.pink,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
            }}>
              🔥 Хиты Love is Coffee
            </div>
            <div style={{
              display: "flex", gap: 10, overflowX: "auto",
              scrollbarWidth: "none",
            }}>
              {hitItems.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    flexShrink: 0, textAlign: "center", cursor: "pointer",
                    width: 70, transition: "transform 0.2s",
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, margin: "0 auto 4px",
                    background: `linear-gradient(135deg, ${getCat(item.cat).gradient[0]}, ${getCat(item.cat).gradient[1]})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, boxShadow: `0 3px 10px ${getCat(item.cat).gradient[0]}30`,
                  }}>
                    {item.emoji}
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: C.text,
                    lineHeight: 1.2, overflow: "hidden",
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Category Header ── */}
      {activeCat !== "all" && (
        <div style={{ padding: "0 20px 12px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 24 }}>{getCat(activeCat).icon}</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.dark }}>
              {getCat(activeCat).name}
            </h2>
            <span style={{
              fontSize: 12, color: C.gray, fontWeight: 500,
              marginLeft: "auto",
            }}>
              {filteredMenu.length} напитков
            </span>
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 12, padding: "0 20px",
      }}>
        {filteredMenu.map((item) => (
          <DrinkCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
        ))}
      </div>

      {/* Empty state */}
      {filteredMenu.length === 0 && (
        <div style={{
          textAlign: "center", padding: 40, color: C.gray,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Ничего не найдено</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Попробуйте другой запрос</div>
        </div>
      )}

      {/* ── Cart Bar ── */}
      <CartBar cart={cart} onOpen={() => setShowCart(true)} />
    </div>
  );
}