import { useState, useRef, useEffect } from "react";

/* ═══ SHARED DATA ═══ */
const DRINKS = [
  { id: 1, name: "Капучино", cat: "Кофе", icon: "☕", price: { S: 750, M: 900, L: 1050 }, desc: "Классика с бархатной пенкой", ingredients: "Эспрессо, молоко", tags: ["hit"], radar: { acidity: 2, sweetness: 3, bitterness: 3, body: 4, aroma: 4 } },
  { id: 2, name: "Латте", cat: "Кофе", icon: "☕", price: { M: 900, L: 1050 }, desc: "Мягкий и нежный", ingredients: "Двойной эспрессо, молоко", tags: [], radar: { acidity: 1, sweetness: 4, bitterness: 2, body: 3, aroma: 3 } },
  { id: 3, name: "Раф классика", cat: "Авторский", icon: "✨", price: { S: 1050, M: 1250, L: 1400 }, desc: "Нежный сливочный кофе с ванилью", ingredients: "Эспрессо, сливки, ваниль", tags: ["hit", "season"], radar: { acidity: 1, sweetness: 5, bitterness: 1, body: 5, aroma: 4 } },
  { id: 4, name: "Флэт уайт", cat: "Кофе", icon: "☕", price: { S: 800, M: 950, L: 1100 }, desc: "Крепкий с тонкой пенкой", ingredients: "Двойной ристретто, молоко", tags: ["new"], radar: { acidity: 3, sweetness: 2, bitterness: 4, body: 5, aroma: 5 } },
  { id: 5, name: "Айс латте", cat: "Айс кофе", icon: "❄️", price: { M: 1000, L: 1200 }, desc: "Холодный с молоком и льдом", ingredients: "Эспрессо, молоко, лёд", tags: [], radar: { acidity: 2, sweetness: 3, bitterness: 2, body: 3, aroma: 3 } },
  { id: 6, name: "Матча латте", cat: "Матча", icon: "🍵", price: { M: 1200, L: 1400 }, desc: "Японский чай с молоком", ingredients: "Матча, молоко, сахар", tags: ["new"], radar: { acidity: 1, sweetness: 4, bitterness: 2, body: 4, aroma: 5 } },
];

const MILKS = ["Стандарт", "Овсяное +500₸", "Кокосовое +500₸", "Миндальное +500₸"];
const SYRUPS = ["Без сиропа", "Ваниль +200₸", "Карамель +200₸", "Лесной орех +200₸"];
const SIZES_ORDER = ["S", "M", "L"];

const fmt = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₸";

const Tag = ({ text, color }) => (
  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${color}`}>{text}</span>
);

const Tags = ({ tags }) => (
  <>
    {tags.includes("hit") && <Tag text="Хит" color="bg-rose-100 text-rose-600" />}
    {tags.includes("new") && <Tag text="New" color="bg-emerald-100 text-emerald-700" />}
    {tags.includes("season") && <Tag text="Сезон" color="bg-amber-100 text-amber-600" />}
  </>
);

/* Mini radar chart */
const Radar = ({ data, size = 80 }) => {
  const labels = ["Кисл.", "Слад.", "Гор.", "Тело", "Аром."];
  const vals = [data.acidity, data.sweetness, data.bitterness, data.body, data.aroma];
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const angles = vals.map((_, i) => (Math.PI * 2 * i) / 5 - Math.PI / 2);
  const pts = vals.map((v, i) => `${cx + (r * v / 5) * Math.cos(angles[i])},${cy + (r * v / 5) * Math.sin(angles[i])}`).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1, 3, 5].map(l => <polygon key={l} points={angles.map(a => `${cx + (r * l / 5) * Math.cos(a)},${cy + (r * l / 5) * Math.sin(a)}`).join(" ")} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />)}
      <polygon points={pts} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5" />
      {angles.map((a, i) => <text key={i} x={cx + (r + 10) * Math.cos(a)} y={cy + (r + 10) * Math.sin(a)} textAnchor="middle" dominantBaseline="central" fontSize="6" fill="#6b7280">{labels[i]}</text>)}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════
   VARIANT A — Current: Grid Cards + Bottom Sheet
   ═══════════════════════════════════════════════════ */
function VariantA() {
  const [selected, setSelected] = useState(null);
  const [sz, setSz] = useState(null);
  const [added, setAdded] = useState(null);

  const openDetail = (d) => { setSelected(d); const sizes = Object.keys(d.price).sort((a,b) => SIZES_ORDER.indexOf(a) - SIZES_ORDER.indexOf(b)); setSz(sizes.includes("M") ? "M" : sizes[0]); };

  return (
    <div className="relative h-full flex flex-col bg-gray-50">
      <div className="px-3 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">A — Сетка + Bottom Sheet (текущий)</div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {DRINKS.map(d => (
            <div key={d.id} onClick={() => openDetail(d)} className="rounded-2xl p-3 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white cursor-pointer active:scale-[0.97] transition-transform" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <div className="text-2xl mb-1">{d.icon}</div>
              <div className="flex items-center gap-1 flex-wrap mb-0.5">
                <span className="font-semibold text-sm">{d.name}</span>
                {d.tags.includes("hit") && <span className="px-1 py-0.5 rounded-full text-[9px] font-bold bg-white/25">Хит</span>}
              </div>
              <p className="text-[11px] text-white/60 line-clamp-1 mb-1">{d.ingredients}</p>
              <div className="flex gap-1 mb-2">
                {Object.keys(d.price).sort((a,b) => SIZES_ORDER.indexOf(a) - SIZES_ORDER.indexOf(b)).map(s => (
                  <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/25">{s}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">от {fmt(Math.min(...Object.values(d.price)))}</span>
                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm font-bold">+</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sheet Overlay */}
      {selected && (
        <div className="absolute inset-0 z-50 bg-black/40 flex items-end" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-t-3xl w-full p-5 pb-6 max-h-[80%] overflow-y-auto animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-2xl">{selected.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-900">{selected.name}</h3><Tags tags={selected.tags} /></div>
                <p className="text-xs text-gray-500 mt-0.5">{selected.desc}</p>
              </div>
              <Radar data={selected.radar} size={80} />
            </div>
            <p className="text-xs text-gray-400 mb-1.5">Размер</p>
            <div className="flex gap-2 mb-3">
              {Object.keys(selected.price).sort((a,b) => SIZES_ORDER.indexOf(a) - SIZES_ORDER.indexOf(b)).map(s => (
                <button key={s} onClick={() => setSz(s)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${sz === s ? "bg-emerald-700 text-white shadow" : "bg-gray-100 text-gray-400"}`}>{s} — {selected.price[s]}₸</button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-1.5">Молоко</p>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {MILKS.map((m, i) => <button key={m} className={`px-3 py-2 rounded-xl text-xs font-medium ${i === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500"}`}>{m}</button>)}
            </div>
            <button className="w-full py-3.5 bg-emerald-700 text-white font-bold rounded-2xl text-base">Добавить — {fmt(selected.price[sz] || 0)}</button>
          </div>
        </div>
      )}
      {added && <div className="absolute bottom-4 left-4 right-4 bg-emerald-700 text-white py-3 px-4 rounded-2xl text-center font-medium text-sm z-40 animate-[fadeIn_0.2s]">Добавлено в корзину</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   VARIANT B — Full-screen Detail (Starbucks style)
   ═══════════════════════════════════════════════════ */
function VariantB() {
  const [selected, setSelected] = useState(null);
  const [sz, setSz] = useState(null);

  const openDetail = (d) => { setSelected(d); const sizes = Object.keys(d.price).sort((a,b) => SIZES_ORDER.indexOf(a) - SIZES_ORDER.indexOf(b)); setSz(sizes.includes("M") ? "M" : sizes[0]); };

  if (selected) {
    const sizes = Object.keys(selected.price).sort((a,b) => SIZES_ORDER.indexOf(a) - SIZES_ORDER.indexOf(b));
    return (
      <div className="h-full flex flex-col bg-white animate-[slideIn_0.25s_ease-out]">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 pt-4 pb-8">
          <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg mb-3">←</button>
          <div className="flex items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><Tags tags={selected.tags} /></div>
              <h2 className="text-2xl font-bold text-white mb-1">{selected.name}</h2>
              <p className="text-sm text-white/70">{selected.desc}</p>
              <p className="text-xs text-white/50 mt-1">{selected.ingredients}</p>
            </div>
            <div className="text-5xl opacity-80">{selected.icon}</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto -mt-4 rounded-t-3xl bg-white px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <Radar data={selected.radar} size={100} />
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{fmt(selected.price[sz])}</p>
              <p className="text-xs text-gray-400">размер {sz}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Размер</p>
          <div className="flex gap-2 mb-5">
            {sizes.map(s => (
              <button key={s} onClick={() => setSz(s)} className={`flex-1 py-3 rounded-2xl text-center transition-all ${sz === s ? "bg-emerald-700 text-white shadow-lg" : "bg-gray-100 text-gray-400"}`}>
                <span className="text-lg font-bold block">{s}</span>
                <span className="text-xs opacity-70">{fmt(selected.price[s])}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Молоко</p>
          <div className="space-y-2 mb-5">
            {MILKS.map((m, i) => (
              <button key={m} className={`w-full py-3 px-4 rounded-2xl text-left text-sm font-medium flex items-center justify-between ${i === 0 ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-gray-50 text-gray-500"}`}>
                {m}<span className="text-lg">{i === 0 ? "●" : "○"}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Сироп</p>
          <div className="flex gap-2 flex-wrap mb-6">
            {SYRUPS.map((s, i) => <button key={s} className={`px-3 py-2 rounded-full text-xs font-medium ${i === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500"}`}>{s}</button>)}
          </div>
        </div>

        {/* Sticky bottom */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <button className="w-full py-4 bg-emerald-700 text-white font-bold rounded-2xl text-lg shadow-lg active:scale-[0.98] transition-transform">Добавить — {fmt(selected.price[sz])}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-3 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">B — Полноэкранная деталка (Starbucks)</div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {DRINKS.map(d => (
            <div key={d.id} onClick={() => openDetail(d)} className="rounded-2xl p-3 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white cursor-pointer active:scale-[0.97] transition-transform" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <div className="text-2xl mb-1">{d.icon}</div>
              <span className="font-semibold text-sm">{d.name}</span>
              <div className="flex items-center gap-1 mt-0.5"><Tags tags={d.tags} /></div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold">от {fmt(Math.min(...Object.values(d.price)))}</span>
                <span className="text-white/60 text-xs">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   VARIANT C — List + Inline Accordion
   ═══════════════════════════════════════════════════ */
function VariantC() {
  const [expanded, setExpanded] = useState(null);
  const [sz, setSz] = useState({});

  const toggle = (d) => {
    if (expanded === d.id) { setExpanded(null); return; }
    setExpanded(d.id);
    if (!sz[d.id]) {
      const sizes = Object.keys(d.price).sort((a,b) => SIZES_ORDER.indexOf(a) - SIZES_ORDER.indexOf(b));
      setSz(prev => ({ ...prev, [d.id]: sizes.includes("M") ? "M" : sizes[0] }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-3 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">C — Список + Аккордеон</div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {DRINKS.map(d => {
          const isOpen = expanded === d.id;
          const sizes = Object.keys(d.price).sort((a,b) => SIZES_ORDER.indexOf(a) - SIZES_ORDER.indexOf(b));
          const curSz = sz[d.id] || sizes[0];
          return (
            <div key={d.id} className={`rounded-2xl bg-white overflow-hidden transition-all ${isOpen ? "shadow-lg ring-1 ring-emerald-200" : "shadow-sm"}`}>
              {/* Row header */}
              <div onClick={() => toggle(d)} className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-gray-50">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-xl text-white shrink-0">{d.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 text-sm">{d.name}</span>
                    <Tags tags={d.tags} />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{d.ingredients}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-gray-900 text-sm">{fmt(Math.min(...Object.values(d.price)))}</span>
                  <div className={`text-xs text-gray-300 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</div>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 animate-[fadeIn_0.2s]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">{d.desc}</p>
                      <div className="flex gap-1.5">
                        {sizes.map(s => (
                          <button key={s} onClick={() => setSz(prev => ({...prev, [d.id]: s}))} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${curSz === s ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-400"}`}>{s} — {d.price[s]}₸</button>
                        ))}
                      </div>
                    </div>
                    <Radar data={d.radar} size={70} />
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {MILKS.slice(0, 3).map((m, i) => <span key={m} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${i === 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{m}</span>)}
                  </div>
                  <button className="w-full py-3 bg-emerald-700 text-white font-bold rounded-xl text-sm">Добавить — {fmt(d.price[curSz])}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   VARIANT D — Horizontal Cards (Tinder/Coffee Talk)
   ═══════════════════════════════════════════════════ */
function VariantD() {
  const [idx, setIdx] = useState(0);
  const [sz, setSz] = useState("M");
  const d = DRINKS[idx];
  const sizes = Object.keys(d.price).sort((a,b) => SIZES_ORDER.indexOf(a) - SIZES_ORDER.indexOf(b));

  useEffect(() => {
    const curSz = sizes.includes("M") ? "M" : sizes[0];
    setSz(curSz);
  }, [idx]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-3 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">D — Горизонтальные карточки (Coffee Talk)</div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 py-2">
        {DRINKS.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-emerald-600 w-5" : "bg-gray-300"}`} />)}
      </div>

      {/* Card */}
      <div className="flex-1 px-4 flex flex-col">
        <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
          {/* Hero */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 py-6 text-white relative">
            <div className="absolute right-4 top-4 text-5xl opacity-30">{d.icon}</div>
            <div className="flex items-center gap-2 mb-1"><Tags tags={d.tags} /></div>
            <h2 className="text-2xl font-bold mb-1">{d.name}</h2>
            <p className="text-sm text-white/70">{d.desc}</p>
            <p className="text-xs text-white/50 mt-1">{d.ingredients}</p>
          </div>

          {/* Body */}
          <div className="flex-1 px-5 py-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Radar data={d.radar} size={90} />
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{fmt(d.price[sz])}</p>
                <p className="text-xs text-gray-400">размер {sz}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {sizes.map(s => (
                <button key={s} onClick={() => setSz(s)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${sz === s ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-400"}`}>{s}</button>
              ))}
            </div>

            <div className="flex gap-1.5 flex-wrap mb-3">
              {MILKS.map((m, i) => <span key={m} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${i === 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* Navigation + Add */}
        <div className="flex items-center justify-between py-4 gap-3">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${idx === 0 ? "bg-gray-200 text-gray-400" : "bg-white text-gray-700 shadow"}`}>←</button>
          <button className="flex-1 py-3.5 bg-emerald-700 text-white font-bold rounded-2xl text-base shadow-lg active:scale-[0.98] transition-transform">Добавить — {fmt(d.price[sz])}</button>
          <button onClick={() => setIdx(Math.min(DRINKS.length - 1, idx + 1))} className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${idx === DRINKS.length - 1 ? "bg-gray-200 text-gray-400" : "bg-white text-gray-700 shadow"}`}>→</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN — Tab Switcher
   ═══════════════════════════════════════════════════ */
export default function MenuPrototypes() {
  const [variant, setVariant] = useState("A");
  const variants = [
    { key: "A", label: "Сетка + Sheet", desc: "Текущий подход" },
    { key: "B", label: "Full Detail", desc: "Starbucks" },
    { key: "C", label: "Аккордеон", desc: "Inline expand" },
    { key: "D", label: "Swipe Cards", desc: "Coffee Talk" },
  ];

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col bg-white font-sans">
      {/* Variant tabs */}
      <div className="flex gap-1 p-2 bg-gray-100 shrink-0">
        {variants.map(v => (
          <button key={v.key} onClick={() => setVariant(v.key)}
            className={`flex-1 py-2 px-1 rounded-xl text-center transition-all ${
              variant === v.key ? "bg-white shadow text-emerald-700" : "text-gray-500"
            }`}>
            <span className="text-xs font-bold block">{v.label}</span>
            <span className="text-[10px] text-gray-400">{v.desc}</span>
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="flex-1 overflow-hidden relative">
        {variant === "A" && <VariantA />}
        {variant === "B" && <VariantB />}
        {variant === "C" && <VariantC />}
        {variant === "D" && <VariantD />}
      </div>

      {/* Comparison table */}
      <div className="shrink-0 bg-gray-50 border-t border-gray-200 p-3">
        <table className="w-full text-[11px]">
          <thead><tr className="text-gray-400"><th className="text-left py-1">Критерий</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead>
          <tbody className="text-center text-gray-600">
            <tr><td className="text-left text-gray-500">Скорость заказа</td><td>⭐⭐</td><td>⭐</td><td>⭐⭐⭐</td><td>⭐⭐</td></tr>
            <tr><td className="text-left text-gray-500">Обзор меню</td><td>⭐⭐⭐</td><td>⭐⭐⭐</td><td>⭐⭐</td><td>⭐</td></tr>
            <tr><td className="text-left text-gray-500">Детализация</td><td>⭐⭐</td><td>⭐⭐⭐</td><td>⭐⭐</td><td>⭐⭐⭐</td></tr>
            <tr><td className="text-left text-gray-500">Mobile UX</td><td>⭐⭐</td><td>⭐⭐⭐</td><td>⭐⭐⭐</td><td>⭐⭐</td></tr>
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
