"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

/* ====== TYPES ====== */
type Gender = "male" | "female";
type Mood = "happy" | "cool" | "excited" | "sleepy" | "angry";

interface AvatarConfig {
  gender: Gender;
  skinColor: number;
  hairstyle: number;
  hairColor: number;
  clothingColor: number;
  mood: Mood;
  name: string;
}

/* ====== PALETTES ====== */
const SKIN = ["#FDDCB5", "#F5C193", "#D4956B", "#A56B43", "#6B3E26"];
const HAIR = ["#2C1810", "#8B4513", "#DAA520", "#C04000", "#1A1A2E"];
const HAIR_LABELS = ["\u0422\u0451\u043C\u043D\u044B\u0439", "\u041A\u0430\u0448\u0442\u0430\u043D", "\u0411\u043B\u043E\u043D\u0434", "\u0420\u044B\u0436\u0438\u0439", "\u0427\u0451\u0440\u043D\u044B\u0439"];
const CLOTH = ["#8B5E3C", "#D4573B", "#3B82D4", "#3BD49A", "#D4A33B", "#7C3AED"];
const HAIRSTYLES = [
  "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0435", "\u0412\u043E\u043B\u043D\u0438\u0441\u0442\u044B\u0435",
  "\u041A\u0443\u0434\u0440\u044F\u0432\u044B\u0435", "\u0414\u043B\u0438\u043D\u043D\u044B\u0435",
  "\u0425\u0432\u043E\u0441\u0442", "\u041B\u044B\u0441\u044B\u0439",
];
const MOODS: { key: Mood; label: string; emoji: string }[] = [
  { key: "happy", label: "\u0421\u0447\u0430\u0441\u0442\u043B\u0438\u0432\u044B\u0439", emoji: "\u{1F60A}" },
  { key: "cool", label: "\u041A\u0440\u0443\u0442\u043E\u0439", emoji: "\u{1F60E}" },
  { key: "excited", label: "\u0412 \u0432\u043E\u0441\u0442\u043E\u0440\u0433\u0435", emoji: "\u{1F929}" },
  { key: "sleepy", label: "\u0421\u043E\u043D\u043D\u044B\u0439", emoji: "\u{1F634}" },
  { key: "angry", label: "\u0417\u043B\u043E\u0439", emoji: "\u{1F620}" },
];

/* ====== UTILS ====== */
function darken(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lighten(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number) {
  const r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ====== MAIN DRAW ====== */
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  cfg: AvatarConfig,
  bob: number,
  wiggle: number,
  W: number,
  H: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();

  const cx = W / 2;
  const cy = H * 0.42 + bob;
  ctx.translate(cx, cy);
  ctx.rotate(wiggle);
  ctx.translate(-cx, -cy);

  const skin = SKIN[cfg.skinColor];
  const hair = HAIR[cfg.hairColor];
  const cloth = CLOTH[cfg.clothingColor];

  const headR = 56;
  const headY = cy - 48;

  /* ---- LEGS ---- */
  ctx.fillStyle = "#3A3A5C";
  rrect(ctx, cx - 22, cy + 52, 16, 38, 6); ctx.fill();
  rrect(ctx, cx + 6, cy + 52, 16, 38, 6); ctx.fill();
  /* shoes */
  ctx.fillStyle = "#2A2A2A";
  ctx.beginPath(); ctx.ellipse(cx - 14, cy + 91, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 14, cy + 91, 13, 6, 0, 0, Math.PI * 2); ctx.fill();

  /* ---- ARMS ---- */
  for (const s of [-1, 1]) {
    /* upper arm (cloth) */
    ctx.fillStyle = cloth;
    ctx.save();
    ctx.translate(cx + s * 44, cy - 4);
    ctx.rotate(s * 0.12);
    rrect(ctx, -8, 0, 16, 30, 8); ctx.fill();
    ctx.restore();
    /* forearm (skin) */
    ctx.fillStyle = skin;
    ctx.save();
    ctx.translate(cx + s * 44, cy + 24);
    ctx.rotate(s * 0.08);
    rrect(ctx, -7, 0, 14, 24, 7); ctx.fill();
    ctx.restore();
    /* hand */
    ctx.beginPath();
    ctx.ellipse(cx + s * 45, cy + 50, 8, 9, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- TORSO ---- */
  ctx.fillStyle = cloth;
  rrect(ctx, cx - 36, cy - 12, 72, 66, 14); ctx.fill();
  /* shoulders */
  ctx.beginPath(); ctx.ellipse(cx - 32, cy - 2, 16, 18, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 32, cy - 2, 16, 18, -0.15, 0, Math.PI * 2); ctx.fill();
  /* collar V */
  ctx.fillStyle = darken(cloth, 30);
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 14);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(cx + 12, cy - 14);
  ctx.lineTo(cx + 8, cy - 14);
  ctx.lineTo(cx, cy - 2);
  ctx.lineTo(cx - 8, cy - 14);
  ctx.closePath(); ctx.fill();
  /* buttons */
  ctx.fillStyle = darken(cloth, 40);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(cx, cy + 8 + i * 13, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  /* ---- NECK ---- */
  ctx.fillStyle = skin;
  rrect(ctx, cx - 12, headY + headR - 6, 24, 18, 6); ctx.fill();

  /* ---- LONG HAIR BEHIND (before head) ---- */
  if (cfg.hairstyle === 3) {
    ctx.fillStyle = hair;
    /* left behind */
    rrect(ctx, cx - headR - 2, headY - 6, 20, 80, 10); ctx.fill();
    /* right behind */
    rrect(ctx, cx + headR - 18, headY - 6, 20, 80, 10); ctx.fill();
  }

  /* ---- HEAD ---- */
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, headY, headR, headR * 1.06, 0, 0, Math.PI * 2);
  ctx.fill();

  /* ---- EARS ---- */
  for (const s of [-1, 1]) {
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(cx + s * (headR - 2), headY + 6, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darken(skin, 18);
    ctx.beginPath(); ctx.ellipse(cx + s * (headR - 2), headY + 6, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
  }

  /* ---- HAIR ---- */
  drawHair(ctx, cx, headY, headR, cfg.hairstyle, hair);

  /* ---- EYES ---- */
  drawEyes(ctx, cx, headY, cfg.mood);

  /* ---- NOSE ---- */
  ctx.strokeStyle = darken(skin, 40);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, headY + 6);
  ctx.quadraticCurveTo(cx + 4, headY + 14, cx, headY + 16);
  ctx.stroke();

  /* ---- BLUSH ---- */
  if (cfg.mood === "happy" || cfg.mood === "excited") {
    ctx.fillStyle = "rgba(255,110,110,0.22)";
    ctx.beginPath(); ctx.ellipse(cx - 30, headY + 16, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 30, headY + 16, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
  }

  /* ---- MOUTH ---- */
  drawMouth(ctx, cx, headY, cfg.mood);

  ctx.restore();
}

/* ====== HAIR ====== */
function drawHair(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  style: number, color: string,
) {
  const ht = cy - r * 1.06;
  ctx.fillStyle = color;
  const hi = lighten(color, 30);

  switch (style) {
    case 0: { /* Short — hair clipped to head shape */
      ctx.save();
      /* clip to head ellipse so hair follows the skull */
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 1.06, 0, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = color;
      ctx.beginPath();
      /* left sideburn area */
      ctx.moveTo(cx - r - 2, cy + 8);
      /* up the left side */
      ctx.lineTo(cx - r - 2, cy - r * 1.2);
      /* across the top */
      ctx.lineTo(cx + r + 2, cy - r * 1.2);
      /* down the right side */
      ctx.lineTo(cx + r + 2, cy + 8);
      /* curved natural hairline across forehead */
      ctx.quadraticCurveTo(cx + r * 0.65, cy - 4, cx + r * 0.25, cy - 10);
      ctx.quadraticCurveTo(cx, cy - 14, cx - r * 0.25, cy - 10);
      ctx.quadraticCurveTo(cx - r * 0.65, cy - 4, cx - r - 2, cy + 8);
      ctx.closePath();
      ctx.fill();

      /* highlight streak */
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.ellipse(cx - 8, cy - r * 0.6, r * 0.22, r * 0.09, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      break;
    }
    case 1: { /* Wavy */
      ctx.beginPath();
      ctx.ellipse(cx, ht + r * 0.44, r * 0.98, r * 0.58, 0, Math.PI, 0, true);
      ctx.fill();
      /* side waves */
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + s * (r * 0.7), cy + 4, 14, 22, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.ellipse(cx + 6, ht + r * 0.18, r * 0.28, r * 0.14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 2: { /* Curly */
      /* base cap */
      ctx.beginPath();
      ctx.ellipse(cx, ht + r * 0.42, r * 0.96, r * 0.54, 0, Math.PI, 0, true);
      ctx.fill();
      /* curls along top and sides */
      for (let a = -2.9; a <= 0.15; a += 0.36) {
        const x2 = cx + Math.cos(a) * r * 0.84;
        const y2 = cy + Math.sin(a) * r * 0.96;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x2, y2, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = hi;
        ctx.beginPath(); ctx.arc(x2 + 2, y2 - 3, 5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 3: { /* Long - symmetric both sides */
      /* top cap */
      ctx.beginPath();
      ctx.ellipse(cx, ht + r * 0.48, r * 1.04, r * 0.64, 0, Math.PI, 0, true);
      ctx.fill();
      /* left strand */
      rrect(ctx, cx - r - 4, cy - 10, 18, 62, 9); ctx.fill();
      /* right strand */
      rrect(ctx, cx + r - 14, cy - 10, 18, 62, 9); ctx.fill();
      /* highlight */
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.ellipse(cx - 10, ht + r * 0.2, r * 0.28, r * 0.13, -0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 4: { /* Ponytail */
      ctx.beginPath();
      ctx.ellipse(cx, ht + r * 0.42, r * 0.94, r * 0.54, 0, Math.PI, 0, true);
      ctx.fill();
      /* band */
      ctx.fillStyle = "#D4573B";
      ctx.beginPath(); ctx.ellipse(cx, ht - 1, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
      /* tail */
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(cx, ht - 22, 11, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hi;
      ctx.beginPath(); ctx.ellipse(cx - 2, ht - 28, 4, 8, -0.1, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 5: { /* Bald - nothing */
      break;
    }
  }
}

/* ====== EYES ====== */
function drawEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, mood: Mood) {
  const ey = cy - 4;
  const sp = 22;

  for (const s of [-1, 1]) {
    const ex = cx + s * sp;

    if (mood === "sleepy") {
      ctx.strokeStyle = "#2A1810";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ex - 9, ey);
      ctx.quadraticCurveTo(ex, ey + 5, ex + 9, ey);
      ctx.stroke();
      continue;
    }

    if (mood === "cool") {
      /* sunglasses */
      ctx.fillStyle = "#111";
      rrect(ctx, ex - 14, ey - 9, 28, 18, 5); ctx.fill();
      /* lens glare */
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath(); ctx.ellipse(ex - 3, ey - 3, 8, 5, -0.3, 0, Math.PI * 2); ctx.fill();
      /* bridge */
      if (s === -1) {
        ctx.fillStyle = "#111";
        ctx.fillRect(ex + 14, ey - 2, sp * 2 - 28, 4);
      }
      /* frame */
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      rrect(ctx, ex - 14, ey - 9, 28, 18, 5); ctx.stroke();
      continue;
    }

    /* white */
    ctx.fillStyle = "#FFF";
    ctx.beginPath(); ctx.ellipse(ex, ey, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
    /* outline */
    ctx.strokeStyle = "#3B2410";
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(ex, ey, 11, 12, 0, 0, Math.PI * 2); ctx.stroke();

    /* iris */
    const iOff = mood === "angry" ? -1.5 : 0;
    ctx.fillStyle = "#5C3A1E";
    ctx.beginPath(); ctx.ellipse(ex, ey + iOff, 6, 7, 0, 0, Math.PI * 2); ctx.fill();

    /* pupil */
    ctx.fillStyle = "#0A0503";
    ctx.beginPath(); ctx.arc(ex, ey + iOff, 3.5, 0, Math.PI * 2); ctx.fill();

    /* highlight */
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath(); ctx.arc(ex + 3, ey + iOff - 3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex - 2, ey + iOff + 2, 1.2, 0, Math.PI * 2); ctx.fill();

    /* eyelid top */
    ctx.strokeStyle = "#2A1810";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex, ey, 11, Math.PI + 0.4, -0.4);
    ctx.stroke();

    /* angry brows */
    if (mood === "angry") {
      ctx.strokeStyle = "#2A1810";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ex - 10, ey - 16 + s * 5);
      ctx.lineTo(ex + 10, ey - 16 - s * 5);
      ctx.stroke();
    }

    /* excited sparkle */
    if (mood === "excited") {
      ctx.fillStyle = "#FFD700";
      const sr = 8; const ir = 4; const spikes = 5;
      let rot = -Math.PI / 2;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(rot) * sr, ey + Math.sin(rot) * sr);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(ex + Math.cos(rot) * sr, ey + Math.sin(rot) * sr);
        rot += step;
        ctx.lineTo(ex + Math.cos(rot) * ir, ey + Math.sin(rot) * ir);
        rot += step;
      }
      ctx.closePath(); ctx.fill();
    }
  }
}

/* ====== MOUTH ====== */
function drawMouth(ctx: CanvasRenderingContext2D, cx: number, cy: number, mood: Mood) {
  const my = cy + 26;
  ctx.strokeStyle = "#2A1810";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  switch (mood) {
    case "happy":
      ctx.beginPath();
      ctx.arc(cx, my - 4, 14, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    case "cool":
      ctx.beginPath();
      ctx.moveTo(cx - 10, my);
      ctx.lineTo(cx + 10, my);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 8, my - 1, 4, 0, 0.5 * Math.PI);
      ctx.stroke();
      break;
    case "excited":
      ctx.fillStyle = "#2A1810";
      ctx.beginPath(); ctx.ellipse(cx, my, 16, 11, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = "#E8777D";
      ctx.beginPath(); ctx.ellipse(cx, my + 5, 8, 5, 0, 0, Math.PI); ctx.fill();
      break;
    case "sleepy":
      ctx.fillStyle = "#2A1810";
      ctx.beginPath(); ctx.ellipse(cx, my, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8B7355";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("z", cx + 38, cy - 30);
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("z", cx + 48, cy - 44);
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("Z", cx + 56, cy - 60);
      break;
    case "angry":
      ctx.beginPath();
      ctx.arc(cx, my + 12, 12, 1.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
      break;
  }
}

/* ====== CANVAS COMPONENT ====== */
const CANVAS_W = 280;
const CANVAS_H = 340;

function AvatarCanvas({ config }: { config: AvatarConfig }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [wig, setWig] = useState(false);
  const bobR = useRef(0);
  const frame = useRef(0);
  const wigR = useRef(0);
  const wigD = useRef(1);

  const draw = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    bobR.current += 0.04;
    const bob = Math.sin(bobR.current) * 4;

    if (wig) {
      wigR.current += wigD.current * 0.12;
      if (Math.abs(wigR.current) > 0.15) wigD.current *= -1;
      if (Math.abs(wigR.current) < 0.005 && wigD.current === 1) {
        setWig(false);
        wigR.current = 0;
      }
    } else {
      wigR.current *= 0.9;
    }

    drawAvatar(ctx, config, bob, wigR.current, CANVAS_W, CANVAS_H);
    frame.current = requestAnimationFrame(draw);
  }, [config, wig]);

  useEffect(() => {
    frame.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame.current);
  }, [draw]);

  return (
    <canvas
      ref={ref}
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={() => { wigR.current = 0; wigD.current = 1; setWig(true); }}
      className="cursor-pointer rounded-3xl"
    />
  );
}

/* ====== COLOR PICKER ====== */
function Swatch({
  colors,
  selected,
  onChange,
  labels,
}: {
  colors: string[];
  selected: number;
  onChange: (i: number) => void;
  labels?: string[];
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((c, i) => (
        <button
          key={c + i}
          onClick={() => onChange(i)}
          title={labels?.[i]}
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

function Pills({
  items,
  selected,
  onChange,
}: {
  items: string[];
  selected: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange(i)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selected === i
              ? "bg-coffee-600 text-white shadow-md"
              : "bg-white text-coffee-700 border border-coffee-200 hover:bg-coffee-50"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-coffee-800 mb-2">{title}</h3>
      {children}
    </div>
  );
}

/* ====== PAGE ====== */
export default function AvatarPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  const [config, setConfig] = useState<AvatarConfig>({
    gender: "male",
    skinColor: 0,
    hairstyle: 0,
    hairColor: 0,
    clothingColor: 2,
    mood: "happy",
    name: "",
  });
  const [saving, setSaving] = useState(false);
  const nameSet = useRef(false);

  /* autofill name from user */
  useEffect(() => {
    if (user && !nameSet.current) {
      const gname = user.displayName || "";
      if (gname) {
        setConfig((p) => ({ ...p, name: gname }));
        nameSet.current = true;
      }
    }
  }, [user]);

  const up = (p: Partial<AvatarConfig>) => setConfig((prev) => ({ ...prev, ...p }));

  const handleSave = () => {
    if (!config.name.trim() || !user) return;
    setSaving(true);
    setError("");
    try {
      localStorage.setItem("oic_avatar", JSON.stringify(config));
      localStorage.setItem("oic_userId", user.uid);
      router.push("/office");
    } catch (err) {
      console.error("Save error:", err);
      setError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.");
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream-50 to-cream-100">
        <p className="text-coffee-600 text-lg">{"\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..."}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-3xl">{"\u2615"}</span>
            <span className="font-display text-2xl font-bold text-coffee-900">OiC</span>
          </motion.a>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-coffee-500 text-sm">
            {"\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0430\u0432\u0430\u0442\u0430\u0440\u0430"}
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
            {"\u0421\u043E\u0437\u0434\u0430\u0439 \u0441\u0432\u043E\u0435\u0433\u043E "}
            <span className="text-coffee-600">{"\u043A\u043E\u0444\u0435-\u0430\u0432\u0430\u0442\u0430\u0440\u0430"}</span>
          </h1>
          <p className="text-coffee-600 text-center mb-10">
            {"\u041D\u0430\u0441\u0442\u0440\u043E\u0439 \u0432\u043D\u0435\u0448\u043D\u0438\u0439 \u0432\u0438\u0434 \u0438 \u043D\u0430\u0436\u043C\u0438 \u043D\u0430 \u0430\u0432\u0430\u0442\u0430\u0440, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u044E!"}
          </p>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Avatar preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-coffee-100">
                <AvatarCanvas config={config} />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-coffee-400 text-xs mt-3"
              >
                {"\u0422\u0430\u043F\u043D\u0438 \u043D\u0430 \u0430\u0432\u0430\u0442\u0430\u0440\u0430! \u{1F446}"}
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

            {/* Settings panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-6"
            >
              <Section title={"\u0418\u043C\u044F"}>
                <input
                  type="text"
                  placeholder={"\u0412\u0432\u0435\u0434\u0438 \u0441\u0432\u043E\u0451 \u0438\u043C\u044F"}
                  value={config.name}
                  onChange={(e) => up({ name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-white focus:border-coffee-500 focus:ring-2 focus:ring-coffee-200 outline-none text-coffee-900 font-medium"
                  maxLength={20}
                />
              </Section>

              <Section title={"\u041F\u043E\u043B"}>
                <div className="flex gap-3">
                  {([
                    { v: "male" as Gender, l: "\u{1F468} \u041C\u0443\u0436\u0447\u0438\u043D\u0430" },
                    { v: "female" as Gender, l: "\u{1F469} \u0416\u0435\u043D\u0449\u0438\u043D\u0430" },
                  ]).map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => up({ gender: v })}
                      className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                        config.gender === v
                          ? "bg-coffee-600 text-white shadow-md"
                          : "bg-white text-coffee-700 border border-coffee-200 hover:bg-coffee-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title={"\u0426\u0432\u0435\u0442 \u043A\u043E\u0436\u0438"}>
                <Swatch colors={SKIN} selected={config.skinColor} onChange={(i) => up({ skinColor: i })} />
              </Section>

              <Section title={"\u041F\u0440\u0438\u0447\u0451\u0441\u043A\u0430"}>
                <Pills items={HAIRSTYLES} selected={config.hairstyle} onChange={(i) => up({ hairstyle: i })} />
              </Section>

              <Section title={"\u0426\u0432\u0435\u0442 \u0432\u043E\u043B\u043E\u0441"}>
                <Swatch colors={HAIR} selected={config.hairColor} onChange={(i) => up({ hairColor: i })} labels={HAIR_LABELS} />
              </Section>

              <Section title={"\u0426\u0432\u0435\u0442 \u043E\u0434\u0435\u0436\u0434\u044B"}>
                <Swatch colors={CLOTH} selected={config.clothingColor} onChange={(i) => up({ clothingColor: i })} />
              </Section>

              <Section title={"\u041D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435"}>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      onClick={() => up({ mood: key })}
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

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              <motion.button
                onClick={handleSave}
                disabled={saving || !config.name.trim()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-bold text-lg bg-coffee-600 text-white hover:bg-coffee-700 transition-colors shadow-lg shadow-coffee-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u044E..." : "\u0412\u043E\u0439\u0442\u0438 \u0432 \u043E\u0444\u0438\u0441 \u2615"}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
