"use client";

import { useRef, useEffect, useCallback, useState } from "react";

const W = 800;
const H = 220;

export type BaristaState = "idle" | "pending" | "accepted" | "ready";

/* ====== DRAW SCENE ====== */
function drawScene(
  ctx: CanvasRenderingContext2D,
  t: number,
  state: BaristaState,
  vitaliyTaps: number,
  aslanTaps: number,
  isNight: boolean,
  orderCount: number,
) {
  ctx.clearRect(0, 0, W, H);

  /* ---- RED WALL (left third) ---- */
  ctx.fillStyle = "#d42b4f";
  ctx.fillRect(0, 0, W * 0.35, H);

  /* Logo: heart + LOVE IS COFFEE */
  const lx = W * 0.175;
  const ly = 50;
  ctx.save();
  ctx.translate(lx, ly);
  ctx.fillStyle = "#FFFFFF";
  /* heart shape */
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-20, -15, -38, 5, -20, 22);
  ctx.lineTo(0, 38);
  ctx.lineTo(20, 22);
  ctx.bezierCurveTo(38, 5, 20, -15, 0, 8);
  ctx.fill();
  /* coffee beans inside */
  ctx.fillStyle = "#5C2E0E";
  for (const [bx, by] of [[-6, 14], [6, 14], [0, 24]] as [number, number][]) {
    ctx.beginPath();
    ctx.ellipse(bx, by, 3, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LOVE IS", 0, 52);
  ctx.fillText("COFFEE", 0, 66);
  ctx.restore();

  /* ---- WHITE WALL (right two thirds) ---- */
  ctx.fillStyle = "#F5F0EB";
  ctx.fillRect(W * 0.35, 0, W * 0.65, H);

  /* Menu boards — 3 frames */
  for (let i = 0; i < 3; i++) {
    const bx = W * 0.35 + 40 + i * 150;
    const by = 15;
    const bw = 120;
    const bh = 70;
    ctx.strokeStyle = "#B0B0B0";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = "#FFFDF8";
    ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    ctx.fillStyle = "#666";
    ctx.font = "8px sans-serif";
    for (let l = 0; l < 5; l++) {
      const lw = 40 + Math.sin(i * 3 + l) * 20;
      ctx.fillRect(bx + 10, by + 12 + l * 11, lw, 4);
      ctx.fillStyle = "#999";
      ctx.fillRect(bx + 10 + lw + 5, by + 12 + l * 11, 25, 4);
      ctx.fillStyle = "#666";
    }
  }

  /* ---- GREEN COUNTER ---- */
  const cy = H - 65;
  const cH = 50;
  ctx.fillStyle = "#1a7a44";
  ctx.fillRect(0, cy, W, cH);
  ctx.fillStyle = "#2d9e5a";
  ctx.fillRect(0, cy, W, 8);
  /* "center coffee" text repeating */
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "italic 11px sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < 5; i++) {
    ctx.fillText("\u2615 center coffee", 80 + i * 170, cy + 30);
  }
  ctx.textAlign = "start";

  /* ---- COUNTER ITEMS ---- */
  /* Microwave (left) */
  const mwX = 60;
  ctx.fillStyle = "#E8E8E8";
  ctx.fillRect(mwX, cy - 28, 40, 28);
  ctx.fillStyle = "#333";
  ctx.fillRect(mwX + 4, cy - 24, 24, 18);
  ctx.fillStyle = "#1a7a44";
  ctx.beginPath(); ctx.arc(mwX + 34, cy - 14, 3, 0, Math.PI * 2); ctx.fill();

  /* Coffee machine (center) */
  const cmX = W / 2 - 25;
  ctx.fillStyle = "#333";
  ctx.fillRect(cmX, cy - 50, 50, 50);
  ctx.fillStyle = "#555";
  ctx.fillRect(cmX + 5, cy - 45, 40, 20);
  ctx.fillStyle = "#C0392B";
  ctx.beginPath(); ctx.arc(cmX + 25, cy - 32, 4, 0, Math.PI * 2); ctx.fill();
  /* steam */
  const steamIntensity = state === "accepted" ? 8 : (state === "ready" ? 5 : 2);
  for (let si = 0; si < steamIntensity; si++) {
    const st2 = ((t * 1.5 + si * 0.7) % 3);
    const a = Math.max(0, 0.6 - st2 / 3);
    const sx = cmX + 25 + Math.sin(t * 2 + si) * 6;
    const sy = cy - 50 - st2 * 18;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Red cups stack (right) */
  for (let ci = 0; ci < 4; ci++) {
    ctx.fillStyle = "#C0392B";
    const cupX = W - 120 + ci * 8;
    ctx.fillRect(cupX, cy - 18 - ci * 3, 12, 18 + ci * 3);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(cupX + 2, cy - 14 - ci * 3, 8, 2);
  }

  /* ---- FLOOR ---- */
  ctx.fillStyle = "#DDD5C8";
  ctx.fillRect(0, H - 15, W, 15);

  /* ---- BARISTAS ---- */
  const sleeping = isNight;
  const vAngry = vitaliyTaps >= 8 && vitaliyTaps < 99;
  const vGone = vitaliyTaps >= 99;
  const aFlip = aslanTaps >= 5 && aslanTaps < 99;
  const aFalling = aslanTaps >= 99;

  /* D1: Vitaliy gone — don't draw him */
  if (!vGone) {
    drawBarista(ctx, W / 2 - 80, cy, t, "left", state, sleeping, vAngry, false, orderCount);
  } else {
    /* Draw thrown apron on floor */
    ctx.fillStyle = "#C0392B";
    ctx.save();
    ctx.translate(W / 2 - 120, cy + 15);
    ctx.rotate(0.3);
    ctx.fillRect(0, 0, 20, 12);
    ctx.restore();
  }

  /* D2: Aslan falling */
  if (aFalling) {
    ctx.save();
    const fallPhase = (t * 2) % 5;
    ctx.translate(W / 2 + 80, cy - 5);
    if (fallPhase < 2) {
      ctx.rotate(fallPhase * 1.5); // spinning
    } else {
      ctx.rotate(1.2); // lying on side
      /* red cheeks = embarrassed */
    }
    const s2 = 0.7;
    ctx.fillStyle = "#F5C193";
    ctx.beginPath();
    ctx.ellipse(0, -30 * s2, 12 * s2, 13 * s2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F0F0F0";
    ctx.fillRect(-10 * s2, -18 * s2, 20 * s2, 24 * s2);
    ctx.fillStyle = "#C0392B";
    ctx.fillRect(-8 * s2, -16 * s2, 16 * s2, 20 * s2);
    /* embarrassed cheeks */
    if (fallPhase >= 2) {
      ctx.fillStyle = "rgba(255,100,100,0.4)";
      ctx.beginPath(); ctx.arc(-6 * s2, -26 * s2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6 * s2, -26 * s2, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else {
    drawBarista(ctx, W / 2 + 80, cy, t, "right", state, sleeping, false, aFlip, orderCount);
  }

  /* Names */
  ctx.fillStyle = "#FFF";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Виталий", W / 2 - 80, cy + 44);
  ctx.fillText("Аслан", W / 2 + 80, cy + 44);
  ctx.textAlign = "start";

  /* Ready bubble */
  if (state === "ready") {
    const bx2 = W / 2 + 80;
    const by2 = cy - 90;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    const txt = "Готово! Забирай \u2615";
    ctx.font = "bold 11px sans-serif";
    const tw = ctx.measureText(txt).width;
    ctx.beginPath();
    ctx.roundRect(bx2 - tw / 2 - 10, by2 - 8, tw + 20, 24, 12);
    ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.fillText(txt, bx2, by2 + 8);
    ctx.textAlign = "start";
  }

  /* Order label card above counter */
  if (state !== "idle" && orderCount !== undefined) {
    /* This is a simplified version - will be enhanced with actual order data */
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.roundRect(W / 2 - 60, 95, 120, 22, 6);
    ctx.fill();
    ctx.strokeStyle = "#d0f0e0";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#1a7a44";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state === "pending" ? "\u231B Новый заказ" : state === "accepted" ? "\u2615 Готовится..." : "\uD83C\uDF89 Готов!", W / 2, 109);
    ctx.textAlign = "start";
  }

  /* 10th order dance */
  if (orderCount > 0 && orderCount % 10 === 0) {
    const dancePhase = (t * 3) % (Math.PI * 2);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    const danceTxt = "Легенда кофейни! \uD83C\uDFC6";
    ctx.fillText(danceTxt, W / 2, 105 + Math.sin(dancePhase) * 3);
    ctx.textAlign = "start";
    ctx.restore();
  }

  /* Yawn every 10 sec in idle */
  if (state === "idle" && !sleeping) {
    const yawnCycle = Math.floor(t / 10) % 2;
    const yawnPhase = (t % 10);
    if (yawnPhase > 9 && yawnPhase < 10) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "12px sans-serif";
      const yawnX = yawnCycle === 0 ? W / 2 - 60 : W / 2 + 100;
      ctx.fillText("*зевает*", yawnX, cy - 80);
    }
  }
}

/* ====== DRAW BARISTA ====== */
function drawBarista(
  ctx: CanvasRenderingContext2D,
  x: number,
  counterY: number,
  t: number,
  side: "left" | "right",
  state: BaristaState,
  sleeping: boolean,
  angry?: boolean,
  flipping?: boolean,
  orderCount?: number,
) {
  ctx.save();
  const s = 0.85;
  const baseY = counterY - 5;
  ctx.translate(x, baseY);

  const bob = Math.sin(t * 1.5 + (side === "left" ? 0 : 1.5)) * 1.5;

  /* Dance animation for 10th order */
  const isDancing = orderCount && orderCount > 0 && orderCount % 10 === 0;
  if (isDancing) {
    const danceBob = Math.sin(t * 6) * 4;
    ctx.translate(Math.sin(t * 4) * 5, danceBob);
  }

  if (sleeping) {
    ctx.fillStyle = "#F5C193";
    ctx.beginPath();
    ctx.ellipse(0, -8 + bob, 14 * s, 14 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = side === "left" ? "#3B2410" : "#1A0E06";
    ctx.beginPath();
    ctx.ellipse(0, -18 + bob, 13 * s, 8 * s, 0.3, Math.PI, 0, true);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `bold ${10 * s}px sans-serif`;
    ctx.fillText("z", 12, -20 + Math.sin(t * 2) * 3);
    ctx.font = `bold ${13 * s}px sans-serif`;
    ctx.fillText("Z", 20, -30 + Math.sin(t * 2 + 0.5) * 3);
    ctx.restore();
    return;
  }

  if (flipping) {
    const rot = Math.sin(t * 4) * 0.4;
    ctx.rotate(rot);
  }

  /* BODY — white shirt */
  ctx.fillStyle = "#F0F0F0";
  ctx.beginPath();
  ctx.ellipse(0, -20 * s + bob, 16 * s, 22 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  /* RED APRON */
  ctx.fillStyle = "#C0392B";
  ctx.beginPath();
  ctx.moveTo(-12 * s, -32 * s + bob);
  ctx.lineTo(-14 * s, 8 * s + bob);
  ctx.lineTo(14 * s, 8 * s + bob);
  ctx.lineTo(12 * s, -32 * s + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#A02018";
  ctx.fillRect(-12 * s, -34 * s + bob, 4 * s, 6 * s);
  ctx.fillRect(8 * s, -34 * s + bob, 4 * s, 6 * s);
  ctx.fillStyle = "#FFD700";
  ctx.font = `bold ${9 * s}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("LiC", 0, -10 * s + bob);
  ctx.textAlign = "start";

  /* DARK PANTS */
  ctx.fillStyle = "#2C2C3A";
  ctx.fillRect(-8 * s, 6 * s + bob, 7 * s, 16 * s);
  ctx.fillRect(1 * s, 6 * s + bob, 7 * s, 16 * s);
  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(-9 * s, 20 * s + bob, 9 * s, 4 * s);
  ctx.fillRect(0, 20 * s + bob, 9 * s, 4 * s);

  /* ARMS */
  ctx.fillStyle = "#F5C193";
  if (state === "idle" && side === "left" && !angry) {
    const wipe = Math.sin(t * 2) * 8;
    ctx.save();
    ctx.translate(-16 * s, -10 * s + bob);
    ctx.rotate(-0.3);
    ctx.fillRect(-3 * s, 0, 6 * s, 20 * s);
    ctx.restore();
    ctx.fillStyle = "#AAA";
    ctx.fillRect(-20 * s + wipe, 8 * s + bob, 10 * s, 4 * s);
    ctx.fillStyle = "#F5C193";
    ctx.fillRect(14 * s, -12 * s + bob, 6 * s, 18 * s);
  } else if (state === "idle" && side === "right") {
    /* Aslan arranging cups */
    const cupMove = Math.sin(t * 1.5) * 5;
    ctx.fillRect(-18 * s, -12 * s + bob, 6 * s, 18 * s);
    ctx.save();
    ctx.translate(14 * s + cupMove, -6 * s + bob);
    ctx.fillRect(-3 * s, 0, 6 * s, 18 * s);
    ctx.restore();
  } else if (state === "pending") {
    /* Both look at screen */
    ctx.fillRect(-18 * s, -12 * s + bob, 6 * s, 18 * s);
    ctx.fillRect(12 * s, -12 * s + bob, 6 * s, 18 * s);
    if (side === "right") {
      /* Aslan nods */
      ctx.save();
      ctx.translate(0, Math.sin(t * 3) * 2);
      ctx.restore();
    }
  } else if (state === "accepted" && side === "left") {
    ctx.save();
    ctx.translate(-14 * s, -14 * s + bob);
    ctx.rotate(-0.5);
    ctx.fillRect(-3 * s, 0, 6 * s, 22 * s);
    ctx.restore();
    ctx.fillRect(12 * s, -14 * s + bob, 6 * s, 20 * s);
  } else if (state === "accepted" && side === "right") {
    /* Aslan writing on cup */
    ctx.fillRect(-18 * s, -12 * s + bob, 6 * s, 18 * s);
    ctx.save();
    ctx.translate(16 * s, -8 * s + bob);
    ctx.rotate(Math.sin(t * 4) * 0.15);
    ctx.fillRect(-3 * s, 0, 6 * s, 16 * s);
    /* pen */
    ctx.fillStyle = "#333";
    ctx.fillRect(-1 * s, 14 * s, 2 * s, 6 * s);
    ctx.restore();
  } else if (state === "ready" && side === "right") {
    ctx.fillRect(-18 * s, -14 * s + bob, 6 * s, 18 * s);
    const wave = Math.sin(t * 5) * 0.3;
    ctx.save();
    ctx.translate(16 * s, -20 * s + bob);
    ctx.rotate(-0.8 + wave);
    ctx.fillRect(-3 * s, -16 * s, 6 * s, 16 * s);
    ctx.restore();
    /* cup in left hand */
    ctx.fillStyle = "#C0392B";
    ctx.fillRect(-20 * s, -2 * s + bob, 8 * s, 12 * s);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(-19 * s, -1 * s + bob, 6 * s, 2 * s);
  } else {
    ctx.fillRect(-18 * s, -12 * s + bob, 6 * s, 18 * s);
    ctx.fillRect(12 * s, -12 * s + bob, 6 * s, 18 * s);
  }

  /* NECK */
  ctx.fillStyle = "#F5C193";
  ctx.fillRect(-4 * s, -38 * s + bob, 8 * s, 8 * s);

  /* HEAD */
  ctx.fillStyle = "#F5C193";
  ctx.beginPath();
  ctx.ellipse(0, -48 * s + bob, 14 * s, 15 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  /* HAIR */
  ctx.fillStyle = side === "left" ? "#3B2410" : "#1A0E06";
  ctx.beginPath();
  ctx.ellipse(0, -58 * s + bob, 13 * s, 8 * s, 0, Math.PI, 0, true);
  ctx.fill();
  /* Slightly different hair for Aslan */
  if (side === "right") {
    ctx.beginPath();
    ctx.ellipse(-8 * s, -56 * s + bob, 6 * s, 4 * s, -0.3, Math.PI, 0, true);
    ctx.fill();
  }

  /* FACE */
  const fy = -48 * s + bob;
  if (angry) {
    ctx.fillStyle = "#222";
    ctx.fillRect(-6 * s, fy - 3, 4 * s, 2);
    ctx.fillRect(2 * s, fy - 3, 4 * s, 2);
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7 * s, fy - 8);
    ctx.lineTo(-2 * s, fy - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7 * s, fy - 8);
    ctx.lineTo(2 * s, fy - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, fy + 8, 4 * s, Math.PI + 0.3, -0.3);
    ctx.stroke();
  } else {
    for (const sx of [-5, 5]) {
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.ellipse(sx * s, fy - 2, 3.5 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2A1810";
      ctx.beginPath();
      ctx.arc(sx * s, fy - 1, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(sx * s + 1, fy - 2.5, 0.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = side === "left" ? "#3B2410" : "#1A0E06";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7 * s, fy - 8);
    ctx.quadraticCurveTo(-4 * s, fy - 10, -2 * s, fy - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2 * s, fy - 8);
    ctx.quadraticCurveTo(4 * s, fy - 10, 7 * s, fy - 8);
    ctx.stroke();
    ctx.strokeStyle = "rgba(150,100,70,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, fy);
    ctx.quadraticCurveTo(2 * s, fy + 4, 0, fy + 5);
    ctx.stroke();
    ctx.strokeStyle = "#6B3E26";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, fy + 4, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  /* EARS */
  ctx.fillStyle = "#F0BA8A";
  ctx.beginPath();
  ctx.ellipse(-13 * s, fy + 2, 3 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(13 * s, fy + 2, 3 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ====== COMPONENT ====== */
export default function CoffeeScene({ orderStatus, orderCount, orderLabel }: { orderStatus?: BaristaState; orderCount?: number; orderLabel?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const frameRef = useRef(0);
  const [vTaps, setVTaps] = useState(0);
  const [aTaps, setATaps] = useState(0);
  const [vGone, setVGone] = useState(false); // Vitaliy left after 8 taps
  const [aFalling, setAFalling] = useState(false); // Aslan falling after flip
  const [isDancing, setIsDancing] = useState(false);
  const [wokeUp, setWokeUp] = useState(false);
  const [shaking, setShaking] = useState(false);
  const vTapTimer = useRef<ReturnType<typeof setTimeout>>();
  const aTapTimer = useRef<ReturnType<typeof setTimeout>>();

  const state = orderStatus ?? "idle";
  const isNight = typeof window !== "undefined" && new Date().getHours() >= 23;

  /* D1: Vitaliy — 8 taps: angry → gone 30s → returns */
  useEffect(() => {
    if (vTaps >= 8 && !vGone) {
      setVGone(true);
      setTimeout(() => { setVGone(false); setVTaps(0); }, 30000);
    }
  }, [vTaps, vGone]);

  /* D2: Aslan — 5 taps: flip → fall → embarrassed */
  useEffect(() => {
    if (aTaps >= 5 && !aFalling) {
      setAFalling(true);
      setTimeout(() => { setAFalling(false); setATaps(0); }, 5000);
    }
  }, [aTaps, aFalling]);

  /* D5: Dance timer — 3 seconds */
  useEffect(() => {
    if (orderCount && orderCount > 0 && orderCount % 10 === 0 && !isDancing) {
      setIsDancing(true);
      setTimeout(() => setIsDancing(false), 3000);
    }
  }, [orderCount, isDancing]);

  /* D3: Shake detection */
  useEffect(() => {
    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      if (total > 25 && Date.now() - lastShake > 3000) {
        lastShake = Date.now();
        setShaking(true);
        setTimeout(() => setShaking(false), 2000);
      }
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    tRef.current += 0.02;
    drawScene(ctx, tRef.current, state,
      vGone ? 99 : vTaps, // 99 signals "gone"
      aFalling ? 99 : aTaps, // 99 signals "falling"
      isNight && !wokeUp,
      isDancing ? 10 : 0); // 10 triggers dance in drawScene
    frameRef.current = requestAnimationFrame(draw);
  }, [state, vTaps, aTaps, isNight, isDancing, vGone, aFalling, wokeUp, shaking]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width * W;

    /* D4: Night tap → wake up */
    if (isNight && !wokeUp) {
      setWokeUp(true);
      setTimeout(() => setWokeUp(false), 5000);
      return;
    }

    if (cx > W / 2 - 120 && cx < W / 2 - 40) {
      setVTaps((p) => p + 1);
      clearTimeout(vTapTimer.current);
      if (vTaps < 7) vTapTimer.current = setTimeout(() => setVTaps(0), 30000);
    }
    if (cx > W / 2 + 40 && cx < W / 2 + 120) {
      setATaps((p) => p + 1);
      clearTimeout(aTapTimer.current);
      if (aTaps < 4) aTapTimer.current = setTimeout(() => setATaps(0), 10000);
    }

    /* Tap on menu boards → scroll to menu */
    if (cx > W * 0.35 && cx < W) {
      const el = document.querySelector("[data-menu-tabs]");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onClick={handleClick}
      className="w-full rounded-2xl cursor-pointer"
      style={{ height: 220 }}
    />
  );
}
