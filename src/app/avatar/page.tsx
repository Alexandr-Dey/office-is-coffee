"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

/* ─── типы ─── */
type Gender = "male" | "female";
type Mood = "happy" | "cool" | "excited" | "sleepy" | "angry";

interface AvatarConfig {
  gender: Gender;
  skinColor: number;
  hairstyle: number;
  clothingColor: number;
  mood: Mood;
  name: string;
}

/* ─── палитры ─── */
const SKIN_COLORS = ["#FDDCB5", "#F5C193", "#D4956B", "#A56B43", "#6B3E26"];
const CLOTHING_COLORS = ["#8B5E3C", "#D4573B", "#3B82D4", "#3BD49A", "#D4A33B"];

const MOODS: { key: Mood; label: string; emoji: string }[] = [
  { key: "happy", label: "Счастливый", emoji: "😊" },
  { key: "cool", label: "Крутой", emoji: "😎" },
  { key: "excited", label: "В восторге", emoji: "🤩" },
  { key: "sleepy", label: "Сонный", emoji: "😴" },
  { key: "angry", label: "Злой", emoji: "😠" },
];

const HAIRSTYLES_M = ["Ёжик", "Зачёс", "Кудри", "Бокс", "Длинные"];
const HAIRSTYLES_F = ["Каре", "Хвостик", "Локоны", "Пучок", "Косы"];

/* ─── рисовалка аватара ─── */
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  cfg: AvatarConfig,
  bobOffset: number,
  wiggleAngle: number,
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  const cx = w / 2;
  const cy = h / 2 + bobOffset;

  /* rotate for wiggle */
  ctx.translate(cx, cy);
  ctx.rotate(wiggleAngle);
  ctx.translate(-cx, -cy);

  const skin = SKIN_COLORS[cfg.skinColor];
  const cloth = CLOTHING_COLORS[cfg.clothingColor];
  const headR = 70;
  const headCY = cy - 20;

  /* ─── тело (рубашка) ─── */
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.ellipse(cx, headCY + 110, 65, 50, 0, Math.PI, 0, true);
  ctx.fill();

  /* воротник */
  ctx.fillStyle = darken(cloth, 20);
  ctx.beginPath();
  ctx.ellipse(cx, headCY + 62, 28, 10, 0, 0, Math.PI);
  ctx.fill();

  /* ─── шея ─── */
  ctx.fillStyle = skin;
  ctx.fillRect(cx - 15, headCY + 45, 30, 25);

  /* ─── голова ─── */
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headR, headR * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();

  /* ─── уши ─── */
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx - headR + 5, headCY + 5, 12, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + headR - 5, headCY + 5, 12, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  /* inner ears */
  ctx.fillStyle = darken(skin, 15);
  ctx.beginPath();
  ctx.ellipse(cx - headR + 5, headCY + 5, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + headR - 5, headCY + 5, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  /* ─── причёска ─── */
  drawHairstyle(ctx, cx, headCY, headR, cfg.gender, cfg.hairstyle, cfg.skinColor);

  /* ─── глаза ─── */
  drawEyes(ctx, cx, headCY, cfg.mood);

  /* ─── рот ─── */
  drawMouth(ctx, cx, headCY, cfg.mood);

  /* ─── щёчки ─── */
  if (cfg.mood === "happy" || cfg.mood === "excited") {
    ctx.fillStyle = "rgba(255,120,120,0.25)";
    ctx.beginPath();
    ctx.ellipse(cx - 40, headCY + 18, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 40, headCY + 18, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ─── причёски ─── */
function drawHairstyle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  gender: Gender,
  idx: number,
  skinIdx: number
) {
  const hairColor = skinIdx <= 1 ? "#3B2410" : skinIdx <= 3 ? "#1A0E06" : "#0A0503";
  ctx.fillStyle = hairColor;

  /* Верхняя точка головы: cy - r * 1.05 (вертикальный радиус эллипса головы) */
  const headTop = cy - r * 1.05;

  if (gender === "male") {
    switch (idx) {
      case 0: /* ёжик — плоская шапка + шипы сверху */
        ctx.beginPath();
        ctx.ellipse(cx, headTop + r * 0.35, r * 0.88, r * 0.42, 0, Math.PI, 0, true);
        ctx.fill();
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * 14 - 6, headTop + 2);
          ctx.lineTo(cx + i * 14, headTop - 18);
          ctx.lineTo(cx + i * 14 + 6, headTop + 2);
          ctx.fill();
        }
        break;
      case 1: /* зачёс — объёмный набок */
        ctx.beginPath();
        ctx.ellipse(cx + 5, headTop + r * 0.32, r * 0.92, r * 0.48, 0.12, Math.PI, 0, true);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.55, headTop + r * 0.45, 22, 28, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 2: /* кудри — кружки вдоль верхнего контура головы */
        for (let a = -2.8; a <= 0.2; a += 0.35) {
          const x2 = cx + Math.cos(a) * r * 0.78;
          const y2 = cy + Math.sin(a) * r * 0.95;
          ctx.beginPath();
          ctx.arc(x2, y2, 16, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 3: /* бокс — короткая плоская */
        ctx.beginPath();
        ctx.ellipse(cx, headTop + r * 0.38, r * 0.84, r * 0.42, 0, Math.PI, 0, true);
        ctx.fill();
        break;
      case 4: /* длинные — покрывает верх + пряди по бокам */
        ctx.beginPath();
        ctx.ellipse(cx, headTop + r * 0.48, r * 0.96, r * 0.58, 0, Math.PI, 0, true);
        ctx.fill();
        ctx.fillRect(cx - r * 0.88, cy - 5, 16, 50);
        ctx.fillRect(cx + r * 0.88 - 16, cy - 5, 16, 50);
        break;
    }
  } else {
    switch (idx) {
      case 0: /* каре — объёмная шапка + боковые пряди */
        ctx.beginPath();
        ctx.ellipse(cx, headTop + r * 0.52, r * 0.98, r * 0.62, 0, Math.PI, 0, true);
        ctx.fill();
        roundRect(ctx, cx - r * 0.92, cy - 18, r * 1.84, 55, 10);
        ctx.fill();
        break;
      case 1: /* хвостик — шапка + хвостик сверху */
        ctx.beginPath();
        ctx.ellipse(cx, headTop + r * 0.38, r * 0.9, r * 0.5, 0, Math.PI, 0, true);
        ctx.fill();
        /* резинка и хвост */
        ctx.beginPath();
        ctx.arc(cx, headTop - 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, headTop - 28, 12, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 2: /* локоны — волнистая шапка + длинные пряди */
        ctx.beginPath();
        ctx.ellipse(cx, headTop + r * 0.5, r * 1.02, r * 0.62, 0, Math.PI, 0, true);
        ctx.fill();
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.ellipse(cx + i * 18, cy + 30, 13, 20, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 3: /* пучок — шапка + шар сверху */
        ctx.beginPath();
        ctx.ellipse(cx, headTop + r * 0.38, r * 0.88, r * 0.48, 0, Math.PI, 0, true);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, headTop - 16, 22, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 4: /* косы — шапка + две косы по бокам */
        ctx.beginPath();
        ctx.ellipse(cx, headTop + r * 0.45, r * 0.92, r * 0.55, 0, Math.PI, 0, true);
        ctx.fill();
        for (const side of [-1, 1]) {
          const bx = cx + side * (r * 0.65);
          for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.ellipse(bx + side * (j % 2 === 0 ? 4 : -4), cy + 5 + j * 14, 9, 9, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
    }
  }
}

/* ─── глаза ─── */
function drawEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, mood: Mood) {
  const eyeY = cy - 5;
  const eyeSpacing = 28;

  for (const side of [-1, 1]) {
    const ex = cx + side * eyeSpacing;

    if (mood === "sleepy") {
      /* closed eyes — line */
      ctx.strokeStyle = "#2A1810";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ex - 10, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + 5, ex + 10, eyeY);
      ctx.stroke();
    } else if (mood === "cool") {
      /* sunglasses */
      ctx.fillStyle = "#1A1A1A";
      roundRect(ctx, ex - 16, eyeY - 10, 32, 20, 6);
      ctx.fill();
      if (side === -1) {
        ctx.fillRect(ex + 16, eyeY - 2, eyeSpacing * 2 - 32, 4);
      }
    } else {
      /* white */
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, 13, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      /* iris */
      ctx.fillStyle = "#3B2410";
      ctx.beginPath();
      const irisOff = mood === "angry" ? -2 : mood === "excited" ? 0 : 0;
      ctx.ellipse(ex, eyeY + irisOff, 7, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      /* pupil */
      ctx.fillStyle = "#0A0503";
      ctx.beginPath();
      ctx.arc(ex, eyeY + irisOff, 4, 0, Math.PI * 2);
      ctx.fill();

      /* highlight */
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(ex + 3, eyeY + irisOff - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      /* angry eyebrows */
      if (mood === "angry") {
        ctx.strokeStyle = "#2A1810";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(ex - 12, eyeY - 20 + side * 6);
        ctx.lineTo(ex + 12, eyeY - 20 - side * 6);
        ctx.stroke();
      }

      /* excited sparkle */
      if (mood === "excited") {
        ctx.fillStyle = "#FFD700";
        drawStar(ctx, ex, eyeY, 5, 9, 5);
      }
    }
  }
}

/* ─── рот ─── */
function drawMouth(ctx: CanvasRenderingContext2D, cx: number, cy: number, mood: Mood) {
  const my = cy + 30;

  ctx.strokeStyle = "#2A1810";
  ctx.lineWidth = 3;

  switch (mood) {
    case "happy":
      ctx.beginPath();
      ctx.arc(cx, my - 5, 20, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    case "cool":
      ctx.beginPath();
      ctx.moveTo(cx - 15, my);
      ctx.lineTo(cx + 15, my);
      ctx.stroke();
      /* slight smirk */
      ctx.beginPath();
      ctx.arc(cx + 12, my - 2, 6, 0, 0.5 * Math.PI);
      ctx.stroke();
      break;
    case "excited":
      /* open smile */
      ctx.fillStyle = "#2A1810";
      ctx.beginPath();
      ctx.ellipse(cx, my, 22, 15, 0, 0, Math.PI);
      ctx.fill();
      /* tongue */
      ctx.fillStyle = "#E8777D";
      ctx.beginPath();
      ctx.ellipse(cx, my + 8, 10, 8, 0, 0, Math.PI);
      ctx.fill();
      break;
    case "sleepy":
      /* small O */
      ctx.fillStyle = "#2A1810";
      ctx.beginPath();
      ctx.ellipse(cx, my, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      /* zzz */
      ctx.fillStyle = "#8B7355";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("z", cx + 50, cy - 40);
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("z", cx + 62, cy - 58);
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("Z", cx + 72, cy - 78);
      break;
    case "angry":
      /* frown */
      ctx.beginPath();
      ctx.arc(cx, my + 18, 18, 1.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
      break;
  }
}

/* ─── утилиты ─── */
function darken(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

/* ─── компонент Canvas ─── */
function AvatarCanvas({ config, size = 280 }: { config: AvatarConfig; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wiggle, setWiggle] = useState(false);
  const bobRef = useRef(0);
  const frameRef = useRef(0);
  const wiggleRef = useRef(0);
  const wiggleDir = useRef(1);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* bob animation */
    bobRef.current += 0.04;
    const bobOffset = Math.sin(bobRef.current) * 4;

    /* wiggle decay */
    if (wiggle) {
      wiggleRef.current += wiggleDir.current * 0.12;
      if (Math.abs(wiggleRef.current) > 0.15) {
        wiggleDir.current *= -1;
      }
      if (Math.abs(wiggleRef.current) < 0.005 && wiggleDir.current === 1) {
        setWiggle(false);
        wiggleRef.current = 0;
      }
    } else {
      wiggleRef.current *= 0.9;
    }

    drawAvatar(ctx, config, bobOffset, wiggleRef.current, size, size);
    frameRef.current = requestAnimationFrame(draw);
  }, [config, size, wiggle]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  const handleTap = () => {
    wiggleRef.current = 0;
    wiggleDir.current = 1;
    setWiggle(true);
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={handleTap}
      className="cursor-pointer rounded-3xl"
      style={{ imageRendering: "auto" }}
    />
  );
}

/* ─── компонент выбора цвета ─── */
function ColorPicker({
  colors,
  selected,
  onChange,
}: {
  colors: string[];
  selected: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {colors.map((c, i) => (
        <button
          key={c}
          onClick={() => onChange(i)}
          className={`w-10 h-10 rounded-full border-[3px] transition-all ${
            selected === i
              ? "border-coffee-600 scale-110 shadow-md"
              : "border-transparent hover:border-coffee-300"
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

/* ─── основная страница ─── */
export default function AvatarPage() {
  const [config, setConfig] = useState<AvatarConfig>({
    gender: "male",
    skinColor: 0,
    hairstyle: 0,
    clothingColor: 0,
    mood: "happy",
    name: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (partial: Partial<AvatarConfig>) =>
    setConfig((prev) => ({ ...prev, ...partial }));

  const hairstyles = config.gender === "male" ? HAIRSTYLES_M : HAIRSTYLES_F;

  const handleSave = async () => {
    if (!config.name.trim()) return;
    setSaving(true);
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await setDoc(doc(db, "avatars", userId), {
        ...config,
        createdAt: new Date().toISOString(),
        userId,
      });
      /* Сохраняем в localStorage для экрана офиса */
      if (typeof window !== "undefined") {
        localStorage.setItem("oic_avatar", JSON.stringify(config));
        localStorage.setItem("oic_userId", userId);
      }
      setSaved(true);
    } catch (err) {
      console.error("Ошибка сохранения:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      {/* навигация */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-3xl">☕</span>
            <span className="font-display text-2xl font-bold text-coffee-900">OiC</span>
          </motion.a>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-coffee-500 text-sm"
          >
            Создание аватара
          </motion.span>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold text-coffee-950 text-center mb-2">
            Создай своего <span className="text-coffee-600">кофе-аватара</span>
          </h1>
          <p className="text-coffee-600 text-center mb-10">
            Настрой внешний вид и нажми на аватар, чтобы увидеть анимацию!
          </p>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Canvas с аватаром */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-coffee-100">
                <AvatarCanvas config={config} size={280} />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-coffee-400 text-xs mt-3"
              >
                Тапни на аватара! 👆
              </motion.p>
              {config.name && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-xl font-bold text-coffee-800 mt-2"
                >
                  {config.name}
                </motion.p>
              )}
            </motion.div>

            {/* Панель настроек */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-6"
            >
              {/* Имя */}
              <Section title="Имя">
                <input
                  type="text"
                  placeholder="Введи своё имя"
                  value={config.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-white focus:border-coffee-500 focus:ring-2 focus:ring-coffee-200 outline-none text-coffee-900 font-medium"
                  maxLength={20}
                />
              </Section>

              {/* Пол */}
              <Section title="Пол">
                <div className="flex gap-3">
                  {(
                    [
                      { value: "male" as Gender, label: "👨 Мужчина" },
                      { value: "female" as Gender, label: "👩 Женщина" },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => update({ gender: value, hairstyle: 0 })}
                      className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                        config.gender === value
                          ? "bg-coffee-600 text-white shadow-md"
                          : "bg-white text-coffee-700 border border-coffee-200 hover:bg-coffee-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Цвет кожи */}
              <Section title="Цвет кожи">
                <ColorPicker
                  colors={SKIN_COLORS}
                  selected={config.skinColor}
                  onChange={(i) => update({ skinColor: i })}
                />
              </Section>

              {/* Причёска */}
              <Section title="Причёска">
                <div className="flex flex-wrap gap-2">
                  {hairstyles.map((h, i) => (
                    <button
                      key={h}
                      onClick={() => update({ hairstyle: i })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        config.hairstyle === i
                          ? "bg-coffee-600 text-white shadow-md"
                          : "bg-white text-coffee-700 border border-coffee-200 hover:bg-coffee-50"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Цвет одежды */}
              <Section title="Цвет одежды">
                <ColorPicker
                  colors={CLOTHING_COLORS}
                  selected={config.clothingColor}
                  onChange={(i) => update({ clothingColor: i })}
                />
              </Section>

              {/* Настроение */}
              <Section title="Настроение">
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      onClick={() => update({ mood: key })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        config.mood === key
                          ? "bg-coffee-600 text-white shadow-md"
                          : "bg-white text-coffee-700 border border-coffee-200 hover:bg-coffee-50"
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Кнопка сохранения */}
              <AnimatePresence mode="wait">
                {!saved ? (
                  <motion.button
                    key="save"
                    onClick={handleSave}
                    disabled={saving || !config.name.trim()}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-2xl font-bold text-lg bg-coffee-600 text-white hover:bg-coffee-700 transition-colors shadow-lg shadow-coffee-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Сохраняю..." : "Войти в офис ☕"}
                  </motion.button>
                ) : (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                  >
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                      <p className="text-green-700 font-bold text-lg">
                        ✅ Аватар сохранён!
                      </p>
                      <p className="text-green-600 text-sm">
                        Добро пожаловать в офис, {config.name}!
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => (window.location.href = "/office")}
                      className="w-full py-4 rounded-2xl font-bold text-lg bg-coffee-800 text-white hover:bg-coffee-900 transition-colors"
                    >
                      Перейти в офис →
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

/* ─── секция ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-coffee-800 mb-2">{title}</h3>
      {children}
    </div>
  );
}
