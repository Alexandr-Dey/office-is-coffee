import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════
//  ONBOARDING — Love is Coffee
//  4 шага: Приветствие → Миссия+Баристы → Фишки → Старт
//  Адрес: Назарбаева 226, холл БанкЦентрКредит, Алматы
//  Фото: логотип на красной стене, баристы в красных
//         фартуках, девушка с напитком
// ═══════════════════════════════════════════════════════

// Brand colors (updated with red from real photos)
const C = {
  bg: "#faf7f2",        // тёплый кремовый
  dark: "#1a7a44",      // бренд зелёный
  mid: "#2d9e5a",
  mint: "#3ecf82",
  red: "#d42b4f",       // фартуки, логотип, стена
  redLight: "#e85d7a",
  text: "#0f3a20",
  gray: "#6b7280",
  warmBorder: "#ede5d8",
  cream: "#f5f0e8",
};

// ── Floating particles ──
function Particles({ icons = ["☕", "✨"], count = 10 }) {
  const items = Array.from({ length: count }, (_, i) => ({
    icon: icons[i % icons.length],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 10 + Math.random() * 14,
    delay: Math.random() * 10,
    dur: 7 + Math.random() * 8,
    opacity: 0.06 + Math.random() * 0.08,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {items.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          fontSize: p.size, opacity: p.opacity,
          animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }}>{p.icon}</div>
      ))}
    </div>
  );
}

// ── Photo component (real image with fallback) ──
// В продакшне: <img src="/photos/xxx.jpg" />
// В прототипе: красивый gradient placeholder с описанием
function Photo({ src, fallbackEmoji, fallbackLabel, width, height, style }) {
  // For prototype: show branded placeholder
  // Replace with <img> when photos are in /public/
  return (
    <div style={{
      width, height, borderRadius: 22, overflow: "hidden",
      position: "relative",
      background: "linear-gradient(145deg, #c0392b 0%, #e74c3c 40%, #d42b4f 100%)",
      boxShadow: "0 8px 32px rgba(196,49,49,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      ...style,
    }}>
      {/* Decorative overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.12), transparent 60%)",
      }} />
      <div style={{
        fontSize: 44, marginBottom: 6, position: "relative", zIndex: 1,
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
      }}>{fallbackEmoji}</div>
      <span style={{
        fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 600,
        textAlign: "center", padding: "0 16px", lineHeight: 1.3,
        position: "relative", zIndex: 1,
      }}>{fallbackLabel}</span>
      {/* Heart logo watermark */}
      <div style={{
        position: "absolute", bottom: 8, right: 10,
        fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 800,
        letterSpacing: 1,
      }}>LOVE IS COFFEE</div>
    </div>
  );
}

// ── Progress Dots ──
function Dots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i === current ? 28 : 8, height: 8, borderRadius: 4,
          background: i === current ? C.red : "rgba(212,43,79,0.15)",
          transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
//  STEP 1 — Добро пожаловать
// ═══════════════════════════════════════
function Step1() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", textAlign: "center",
      padding: "0 24px", height: "100%", position: "relative",
    }}>
      <Particles icons={["☕", "❤️", "✨"]} count={12} />

      {/* Photo: красная стена с логотипом */}
      <div style={{
        animation: "scaleIn 0.7s cubic-bezier(0.16,1,0.3,1)",
        position: "relative", zIndex: 1,
        marginBottom: 24,
      }}>
        <Photo
          fallbackEmoji="❤️☕"
          fallbackLabel="Фото: логотип на красной стене"
          width={280} height={180}
          style={{ borderRadius: 24 }}
        />
        {/* Glow behind */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,43,79,0.12), transparent 70%)",
          zIndex: -1, filter: "blur(20px)",
        }} />
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 30, fontWeight: 800, color: C.red,
        fontFamily: "'Playfair Display', Georgia, serif",
        margin: 0, lineHeight: 1.15,
        animation: "fadeUp 0.5s ease 0.25s both",
        position: "relative", zIndex: 1,
      }}>
        Love is Coffee
      </h1>

      <p style={{
        fontSize: 15, color: "#5a5048", lineHeight: 1.6,
        margin: "12px 0 0", maxWidth: 300,
        animation: "fadeUp 0.5s ease 0.4s both",
        position: "relative", zIndex: 1,
      }}>
        Кофейня с душой в самом центре Алматы
      </p>

      {/* Divider */}
      <div style={{
        width: 40, height: 3, borderRadius: 2,
        background: `linear-gradient(90deg, ${C.red}, ${C.redLight})`,
        margin: "20px 0",
        animation: "fadeUp 0.5s ease 0.5s both",
        position: "relative", zIndex: 1,
      }} />

      {/* Location card */}
      <div style={{
        background: "#fff", borderRadius: 18, padding: "14px 20px",
        boxShadow: "0 2px 16px rgba(212,43,79,0.06)",
        border: "1px solid #f0e8e0",
        animation: "fadeUp 0.5s ease 0.6s both",
        position: "relative", zIndex: 1,
        maxWidth: 300, width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${C.red}10`, display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>📍</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              ул. Назарбаева 226
            </div>
            <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.3 }}>
              Холл БанкЦентрКредит · Алматы
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  STEP 2 — Миссия + Баристы
// ═══════════════════════════════════════
function Step2() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      padding: "0 22px", height: "100%",
      overflowY: "auto", position: "relative",
    }}>
      <Particles icons={["💚", "☕", "🤎"]} count={8} />

      {/* Mission */}
      <div style={{
        textAlign: "center", paddingTop: 12, marginBottom: 24,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ fontSize: 32, marginBottom: 10, animation: "scaleIn 0.5s ease" }}>
          ❤️
        </div>
        <h2 style={{
          fontSize: 22, fontWeight: 800, color: C.red,
          fontFamily: "'Playfair Display', Georgia, serif",
          margin: "0 0 12px",
        }}>
          Кофе с любовью
        </h2>
        <p style={{
          fontSize: 14, color: "#4a5048", lineHeight: 1.7,
          margin: 0, maxWidth: 310, marginLeft: "auto", marginRight: "auto",
        }}>
          Мы верим, что лучший кофе — тот, который сделан с заботой.
          Не просто напиток, а маленький ритуал, который делает день теплее.
        </p>
      </div>

      {/* Quote */}
      <div style={{
        background: `linear-gradient(135deg, ${C.red}06, ${C.red}03)`,
        borderRadius: 18, padding: "16px 20px",
        borderLeft: `3px solid ${C.red}`,
        marginBottom: 24,
        position: "relative", zIndex: 1,
      }}>
        <p style={{
          fontSize: 13, fontStyle: "italic", color: "#5a4a42",
          lineHeight: 1.6, margin: 0,
        }}>
          «Мы знаем имена наших гостей, помним любимые напитки
          и всегда рады видеть вас снова»
        </p>
      </div>

      {/* Baristas header */}
      <div style={{
        fontSize: 10, fontWeight: 800, color: C.red,
        textTransform: "uppercase", letterSpacing: 2.5,
        marginBottom: 14, textAlign: "center",
        position: "relative", zIndex: 1,
      }}>
        Наша команда
      </div>

      {/* Photo: два бариста за кофемашиной */}
      <div style={{
        animation: "fadeUp 0.5s ease 0.15s both",
        position: "relative", zIndex: 1,
        marginBottom: 14,
      }}>
        <Photo
          fallbackEmoji="👨‍🍳👨‍🍳"
          fallbackLabel="Фото: баристы за кофемашиной в красных фартуках"
          width="100%" height={200}
          style={{ borderRadius: 20 }}
        />
      </div>

      {/* Barista names */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 14,
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          flex: 1, background: "#fff", borderRadius: 16, padding: "14px 16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          border: "1px solid #f0e8e0", textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>👨‍🍳</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Виталий</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.red, textTransform: "uppercase", letterSpacing: 1 }}>Бариста</div>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 4, lineHeight: 1.3 }}>
            Мастер латте-арта
          </div>
        </div>
        <div style={{
          flex: 1, background: "#fff", borderRadius: 16, padding: "14px 16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          border: "1px solid #f0e8e0", textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>👨‍🍳</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Аслан</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.red, textTransform: "uppercase", letterSpacing: 1 }}>Бариста</div>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 4, lineHeight: 1.3 }}>
            Гуру авторских напитков
          </div>
        </div>
      </div>

      {/* Photo: девушка с напитком */}
      <div style={{
        animation: "fadeUp 0.5s ease 0.3s both",
        position: "relative", zIndex: 1,
        marginBottom: 20,
      }}>
        <Photo
          fallbackEmoji="🧋✨"
          fallbackLabel="Фото: бариста протягивает готовый напиток"
          width="100%" height={180}
          style={{ borderRadius: 20 }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  STEP 3 — Фишки приложения
// ═══════════════════════════════════════
function Step3() {
  const features = [
    { icon: "☕", title: "Заказ в пару тапов", desc: "Выбрал, настроил, отправил — жди push", g: [C.red, C.redLight] },
    { icon: "🔥", title: "Стрик и лояльность", desc: "Каждый 8-й напиток — бесплатно!", g: ["#f59e0b", "#fbbf24"] },
    { icon: "💳", title: "Депозит", desc: "Пополни баланс и плати мгновенно", g: ["#3b82f6", "#60a5fa"] },
    { icon: "📡", title: "Real-time статус", desc: "Видишь когда заказ готов", g: [C.dark, C.mid] },
    { icon: "🎨", title: "Живая сцена", desc: "Pixel-art кофейня оживает", g: ["#a855f7", "#c084fc"] },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      padding: "0 22px", height: "100%",
      overflowY: "auto", position: "relative",
    }}>
      <Particles icons={["✨", "⭐", "🎉"]} count={8} />

      <div style={{
        textAlign: "center", paddingTop: 12, marginBottom: 22,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ fontSize: 32, marginBottom: 10, animation: "scaleIn 0.5s ease" }}>✨</div>
        <h2 style={{
          fontSize: 22, fontWeight: 800, color: C.red,
          fontFamily: "'Playfair Display', Georgia, serif",
          margin: "0 0 6px",
        }}>
          Что умеет приложение
        </h2>
        <p style={{ fontSize: 12, color: C.gray, margin: 0 }}>
          Всё для идеального кофейного ритуала
        </p>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        paddingBottom: 24, position: "relative", zIndex: 1,
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: 18, padding: "14px 16px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            border: "1px solid #f0e8e0",
            display: "flex", gap: 14, alignItems: "center",
            animation: `fadeUp 0.4s ease ${0.1 + i * 0.07}s both`,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${f.g[0]}, ${f.g[1]})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: `0 3px 12px ${f.g[0]}25`,
            }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{f.title}</div>
              <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.3, marginTop: 2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Loyalty preview */}
      <div style={{
        background: `linear-gradient(135deg, ${C.red}08, ${C.redLight}05)`,
        borderRadius: 20, padding: 18, marginBottom: 20,
        border: `1px solid ${C.red}12`,
        position: "relative", zIndex: 1,
        animation: "fadeUp 0.4s ease 0.5s both",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: C.red,
          textTransform: "uppercase", letterSpacing: 2, marginBottom: 10,
        }}>Программа лояльности</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <div key={n} style={{
              width: 34, height: 34, borderRadius: 10,
              background: n === 8 ? `linear-gradient(135deg, ${C.red}, ${C.redLight})` : "#f0e8e0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: n === 8 ? 14 : 12,
              color: n === 8 ? "#fff" : "#bbb",
              fontWeight: 700,
              boxShadow: n === 8 ? `0 2px 8px ${C.red}30` : "none",
            }}>
              {n === 8 ? "🎁" : "☕"}
            </div>
          ))}
        </div>
        <div style={{
          textAlign: "center", fontSize: 11, color: C.gray, marginTop: 8,
        }}>
          Каждый 8-й напиток — наш подарок
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  STEP 4 — Поехали!
// ═══════════════════════════════════════
function Step4({ onFinish }) {
  const [go, setGo] = useState(false);

  const handleStart = () => {
    setGo(true);
    setTimeout(() => onFinish?.(), 700);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", textAlign: "center",
      padding: "0 28px", height: "100%", position: "relative",
    }}>
      <Particles icons={["🎉", "❤️", "☕", "✨"]} count={16} />

      {/* Big heart + cup */}
      <div style={{
        position: "relative", zIndex: 1,
        marginBottom: 24,
        animation: "scaleIn 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: 36,
          background: `linear-gradient(145deg, ${C.red}, ${C.redLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 56,
          boxShadow: `0 16px 48px ${C.red}30`,
        }}>
          ☕
        </div>
        {/* Pulse ring */}
        <div style={{
          position: "absolute", inset: -8, borderRadius: 44,
          border: `2px solid ${C.red}20`,
          animation: "pulse 2s ease-in-out infinite",
        }} />
      </div>

      <h2 style={{
        fontSize: 28, fontWeight: 800, color: C.red,
        fontFamily: "'Playfair Display', Georgia, serif",
        margin: "0 0 10px", lineHeight: 1.2,
        animation: "fadeUp 0.5s ease 0.2s both",
        position: "relative", zIndex: 1,
      }}>
        Всё готово!
      </h2>

      <p style={{
        fontSize: 15, color: "#5a5048", lineHeight: 1.6,
        margin: "0 0 28px", maxWidth: 280,
        animation: "fadeUp 0.5s ease 0.3s both",
        position: "relative", zIndex: 1,
      }}>
        Добро пожаловать в Love is Coffee.
        Выбери свой первый напиток — мы уже ждём.
      </p>

      {/* CTA */}
      <button
        onClick={handleStart}
        style={{
          width: "100%", maxWidth: 300, padding: "18px 32px",
          borderRadius: 22,
          background: go
            ? `linear-gradient(135deg, ${C.mint}, ${C.dark})`
            : `linear-gradient(135deg, ${C.red}, ${C.redLight})`,
          border: "none", cursor: "pointer",
          boxShadow: go ? `0 8px 32px ${C.dark}35` : `0 8px 32px ${C.red}35`,
          transition: "all 0.4s ease",
          transform: go ? "scale(1.04)" : "scale(1)",
          position: "relative", zIndex: 1,
          animation: "fadeUp 0.5s ease 0.4s both",
        }}
      >
        <span style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>
          {go ? "Поехали! ☕" : "Перейти к меню"}
        </span>
      </button>

      <p style={{
        fontSize: 11, color: `${C.gray}80`, marginTop: 14,
        position: "relative", zIndex: 1,
        animation: "fadeUp 0.5s ease 0.5s both",
      }}>
        ул. Назарбаева 226 · холл БанкЦентрКредит
      </p>
    </div>
  );
}

// ═══════════════════════════════════════
//  MAIN ONBOARDING
// ═══════════════════════════════════════
export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [touchX, setTouchX] = useState(null);

  const STEPS = [Step1, Step2, Step3, Step4];
  const total = STEPS.length;

  const next = () => { if (step < total - 1) { setDir(1); setStep(s => s + 1); } };
  const back = () => { if (step > 0) { setDir(-1); setStep(s => s - 1); } };

  const onTS = (e) => setTouchX(e.touches[0].clientX);
  const onTE = (e) => {
    if (touchX === null) return;
    const d = touchX - e.changedTouches[0].clientX;
    if (Math.abs(d) > 50) { d > 0 ? next() : back(); }
    setTouchX(null);
  };

  if (done) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: C.bg, fontFamily: "'Inter', sans-serif",
      }}>
        <style>{`@keyframes scaleIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        <div style={{ fontSize: 64, animation: "scaleIn 0.5s ease", marginBottom: 16 }}>☕</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.red, fontFamily: "'Playfair Display', serif" }}>
          Добро пожаловать!
        </h2>
        <p style={{ fontSize: 13, color: C.gray, marginTop: 6 }}>Открываем меню...</p>
      </div>
    );
  }

  const StepComp = STEPS[step];

  return (
    <div
      onTouchStart={onTS}
      onTouchEnd={onTE}
      style={{
        height: "100vh", maxWidth: 430, margin: "0 auto",
        background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif",
        display: "flex", flexDirection: "column", overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes scaleIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideR { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideL { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-10px) rotate(4deg)} 66%{transform:translateY(-5px) rotate(-3deg)} }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.08);opacity:0.15} }
      `}</style>

      {/* Top bar */}
      <div style={{
        padding: "50px 22px 10px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0, position: "relative", zIndex: 10,
      }}>
        {step > 0 ? (
          <button onClick={back} style={{
            width: 36, height: 36, borderRadius: 12,
            background: `${C.red}08`, border: "none",
            cursor: "pointer", fontSize: 16, color: C.red,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>←</button>
        ) : <div style={{ width: 36 }} />}

        <Dots total={total} current={step} />

        {step < total - 1 ? (
          <button onClick={() => { setStep(total - 1); setDir(1); }} style={{
            background: "none", border: "none",
            color: C.gray, fontSize: 12, fontWeight: 600,
            cursor: "pointer",
          }}>Пропустить</button>
        ) : <div style={{ width: 36 }} />}
      </div>

      {/* Content */}
      <div key={step} style={{
        flex: 1, overflow: "hidden",
        animation: dir === 1 ? "slideR 0.35s ease" : "slideL 0.35s ease",
      }}>
        <StepComp onFinish={() => setDone(true)} />
      </div>

      {/* Bottom CTA */}
      {step < total - 1 && (
        <div style={{
          padding: "14px 22px 34px", flexShrink: 0,
          position: "relative", zIndex: 10,
        }}>
          <button onClick={next} style={{
            width: "100%", padding: "16px 24px",
            borderRadius: 20,
            background: `linear-gradient(135deg, ${C.red}, ${C.redLight})`,
            border: "none", cursor: "pointer",
            boxShadow: `0 6px 24px ${C.red}28`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>
              {step === 0 ? "Познакомимся ❤️" : step === 1 ? "Что внутри ✨" : "Дальше"}
            </span>
          </button>
          {step === 0 && (
            <p style={{
              textAlign: "center", fontSize: 10, color: `${C.gray}70`,
              marginTop: 10, animation: "fadeUp 0.5s ease 0.8s both",
            }}>
              ← свайп или тап →
            </p>
          )}
        </div>
      )}
    </div>
  );
}