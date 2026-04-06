"use client";

import { useRef, useEffect, useCallback, useState } from "react";

const BASE_W = 400;
const BASE_H = 220;

export type BaristaState = "idle" | "pending" | "accepted" | "ready";

/* ====== DRAW SCENE ====== */
function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  t: number,
  state: BaristaState,
  vitaliyTaps: number,
  aslanTaps: number,
  isNight: boolean,
  orderCount: number,
  isWokeUp?: boolean,
) {
  const sx = w / BASE_W;
  const sy = h / BASE_H;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.scale(sx, sy);
  const W = BASE_W, H = BASE_H;

  /* ---- RED WALL (left third) ---- */
  ctx.fillStyle = "#d42b4f";
  ctx.fillRect(0, 0, W * 0.33, H);

  /* Logo */
  const lx = W * 0.165, ly = 45;
  ctx.save();
  ctx.translate(lx, ly);
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-16, -12, -30, 4, -16, 18);
  ctx.lineTo(0, 30);
  ctx.lineTo(16, 18);
  ctx.bezierCurveTo(30, 4, 16, -12, 0, 6);
  ctx.fill();
  ctx.fillStyle = "#5C2E0E";
  for (const [bx, by] of [[-4, 12], [4, 12], [0, 20]] as [number, number][]) {
    ctx.beginPath(); ctx.ellipse(bx, by, 2.5, 4, 0.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#FFF";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LOVE IS", 0, 44);
  ctx.fillText("COFFEE", 0, 56);
  ctx.restore();

  /* ---- WHITE WALL ---- */
  ctx.fillStyle = "#F5F0EB";
  ctx.fillRect(W * 0.33, 0, W * 0.67, H);

  /* Menu boards */
  for (let i = 0; i < 3; i++) {
    const bx = W * 0.33 + 15 + i * (W * 0.67 - 30) / 3;
    const bw = (W * 0.67 - 50) / 3;
    ctx.strokeStyle = "#B0B0B0"; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, 12, bw, 55);
    ctx.fillStyle = "#FFFDF8";
    ctx.fillRect(bx + 1.5, 13.5, bw - 3, 52);
    ctx.fillStyle = "#888"; ctx.font = "6px sans-serif";
    for (let l = 0; l < 4; l++) {
      ctx.fillRect(bx + 8, 22 + l * 11, 25 + Math.sin(i + l) * 10, 3);
      ctx.fillStyle = "#aaa"; ctx.fillRect(bx + 8 + 30 + Math.sin(i + l) * 10, 22 + l * 11, 15, 3); ctx.fillStyle = "#888";
    }
  }

  /* ---- GREEN COUNTER (foreground — hides barista legs) ---- */
  const counterY = H - 55;
  const counterH = 55;
  /* Counter body */
  ctx.fillStyle = "#1a7a44";
  ctx.fillRect(0, counterY, W, counterH);
  /* Counter top edge */
  ctx.fillStyle = "#2d9e5a";
  ctx.fillRect(0, counterY, W, 6);
  /* "center coffee" text */
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "italic 9px sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < 4; i++) ctx.fillText("\u2615 center coffee", 55 + i * 105, counterY + 30);
  ctx.textAlign = "start";

  /* ---- COUNTER ITEMS (on top of counter) ---- */
  /* Microwave */
  const mwX = 30;
  ctx.fillStyle = "#E0E0E0";
  ctx.fillRect(mwX, counterY - 22, 32, 22);
  ctx.fillStyle = "#444";
  ctx.fillRect(mwX + 3, counterY - 18, 18, 14);
  ctx.fillStyle = "#3ecf82";
  ctx.beginPath(); ctx.arc(mwX + 26, counterY - 11, 2.5, 0, Math.PI * 2); ctx.fill();

  /* Coffee machine */
  const cmX = W / 2 - 18;
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath(); ctx.roundRect(cmX, counterY - 42, 36, 42, 3); ctx.fill();
  ctx.fillStyle = "#444";
  ctx.fillRect(cmX + 4, counterY - 37, 28, 16);
  /* Buttons */
  ctx.fillStyle = "#C0392B"; ctx.beginPath(); ctx.arc(cmX + 10, counterY - 14, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3ecf82"; ctx.beginPath(); ctx.arc(cmX + 20, counterY - 14, 3, 0, Math.PI * 2); ctx.fill();
  /* Drip nozzle */
  ctx.fillStyle = "#555";
  ctx.fillRect(cmX + 14, counterY - 6, 8, 6);
  /* Steam */
  const steamN = state === "accepted" ? 6 : (state === "ready" ? 4 : 2);
  for (let si = 0; si < steamN; si++) {
    const sp = ((t * 1.5 + si * 0.7) % 3);
    const a = Math.max(0, 0.5 - sp / 3);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.ellipse(cmX + 18 + Math.sin(t * 2 + si) * 4, counterY - 42 - sp * 14, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Red cups stack */
  for (let ci = 0; ci < 3; ci++) {
    ctx.fillStyle = "#C0392B";
    const cx2 = W - 65 + ci * 7;
    ctx.fillRect(cx2, counterY - 14 - ci * 2, 10, 14 + ci * 2);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(cx2 + 2, counterY - 11 - ci * 2, 6, 1.5);
  }

  /* ---- BARISTAS (behind counter — draw BEFORE counter for z-order) ---- */
  /* Actually we draw counter first, then baristas upper body ABOVE counter line */
  const sleeping = isNight && !isWokeUp;
  const scared = isNight && !!isWokeUp;
  const vAngry = vitaliyTaps >= 8 && vitaliyTaps < 99;
  const vGone = vitaliyTaps >= 99;
  const aFlip = aslanTaps >= 5 && aslanTaps < 99;
  const aFalling = aslanTaps >= 99;

  if (!vGone) {
    drawBarista(ctx, W / 2 - 55, counterY, t, "left", state, sleeping, vAngry, false, scared);
  } else {
    /* Thrown apron */
    ctx.fillStyle = "#C0392B";
    ctx.save(); ctx.translate(W / 2 - 90, counterY - 5); ctx.rotate(0.3);
    ctx.fillRect(0, 0, 16, 10); ctx.restore();
  }

  if (aFalling) {
    ctx.save();
    const fp = (t * 2) % 5;
    ctx.translate(W / 2 + 55, counterY - 20);
    ctx.rotate(fp < 2 ? fp * 1.2 : 1.0);
    drawBaristaHead(ctx, t, "right", false, false, fp >= 2);
    ctx.restore();
  } else {
    drawBarista(ctx, W / 2 + 55, counterY, t, "right", state, sleeping, false, aFlip, scared);
  }

  /* Names below counter */
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  if (!vGone) ctx.fillText("Виталий", W / 2 - 55, counterY + 14);
  ctx.fillText("Аслан", W / 2 + 55, counterY + 14);
  ctx.textAlign = "start";

  /* Ready bubble */
  if (state === "ready") {
    const bx2 = W / 2 + 55, by2 = counterY - 75;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    const txt = "Готово! Забирай \u2615";
    ctx.font = "bold 10px sans-serif";
    const tw = ctx.measureText(txt).width;
    ctx.beginPath(); ctx.roundRect(bx2 - tw / 2 - 8, by2 - 6, tw + 16, 20, 10); ctx.fill();
    ctx.fillStyle = "#FFF"; ctx.textAlign = "center";
    ctx.fillText(txt, bx2, by2 + 7); ctx.textAlign = "start";
  }

  /* Order card above counter */
  if (state !== "idle" && orderCount !== undefined) {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath(); ctx.roundRect(W / 2 - 45, 78, 90, 18, 5); ctx.fill();
    ctx.strokeStyle = "#d0f0e0"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#1a7a44"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(state === "pending" ? "\u231B Новый заказ" : state === "accepted" ? "\u2615 Готовится..." : "\uD83C\uDF89 Готов!", W / 2, 90);
    ctx.textAlign = "start";
  }

  /* 10th order dance text */
  if (orderCount > 0 && orderCount % 10 === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Легенда кофейни! \uD83C\uDFC6", W / 2, 75 + Math.sin(t * 3) * 2);
    ctx.textAlign = "start";
  }

  /* Yawn in idle */
  if (state === "idle" && !sleeping && !scared) {
    const yp = (t % 12);
    if (yp > 11) {
      const yx = Math.floor(t / 12) % 2 === 0 ? W / 2 - 40 : W / 2 + 70;
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.font = "9px sans-serif";
      ctx.fillText("*зевает*", yx, counterY - 60);
    }
  }

  /* Floor */
  ctx.fillStyle = "#DDD5C8";
  ctx.fillRect(0, H - 10, W, 10);

  ctx.restore(); // undo scale
}

/* ====== DRAW BARISTA HEAD (for falling Aslan) ====== */
function drawBaristaHead(ctx: CanvasRenderingContext2D, t: number, side: "left" | "right", angry: boolean, scared: boolean, embarrassed: boolean) {
  const s = 0.75;
  /* Head */
  ctx.fillStyle = "#F5C193";
  ctx.beginPath(); ctx.ellipse(0, 0, 12 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();
  /* Hair */
  ctx.fillStyle = side === "left" ? "#3B2410" : "#1A0E06";
  ctx.beginPath(); ctx.ellipse(0, -8 * s, 11 * s, 7 * s, 0, Math.PI, 0, true); ctx.fill();
  /* Embarrassed cheeks */
  if (embarrassed) {
    ctx.fillStyle = "rgba(255,80,80,0.4)";
    ctx.beginPath(); ctx.arc(-7 * s, 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7 * s, 3, 4, 0, Math.PI * 2); ctx.fill();
  }
  /* Simple face */
  ctx.fillStyle = "#2A1810";
  ctx.beginPath(); ctx.arc(-4 * s, -1, 1.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 * s, -1, 1.5 * s, 0, Math.PI * 2); ctx.fill();
  if (embarrassed) {
    ctx.strokeStyle = "#6B3E26"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 5, 3 * s, Math.PI + 0.3, -0.3); ctx.stroke();
  }
}

/* ====== DRAW BARISTA (upper body only — behind counter) ====== */
function drawBarista(
  ctx: CanvasRenderingContext2D,
  x: number, counterY: number, t: number,
  side: "left" | "right", state: BaristaState,
  sleeping: boolean, angry?: boolean, flipping?: boolean, scared?: boolean,
) {
  ctx.save();
  ctx.translate(x, counterY);
  const s = 0.8;
  const bob = Math.sin(t * 1.5 + (side === "left" ? 0 : 1.5)) * 1;

  if (sleeping) {
    /* Head resting on arms */
    ctx.fillStyle = "#F5C193";
    ctx.beginPath(); ctx.ellipse(0, -8 + bob, 11 * s, 11 * s, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = side === "left" ? "#3B2410" : "#1A0E06";
    ctx.beginPath(); ctx.ellipse(0, -16 + bob, 10 * s, 6 * s, 0.2, Math.PI, 0, true); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 8px sans-serif";
    ctx.fillText("z", 10, -18 + Math.sin(t * 2) * 2);
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("Z", 17, -26 + Math.sin(t * 2 + 0.5) * 2);
    ctx.restore(); return;
  }

  if (flipping) ctx.rotate(Math.sin(t * 4) * 0.25);

  /* ---- TORSO (white shirt) ---- */
  ctx.fillStyle = "#F0F0F0";
  ctx.beginPath();
  ctx.ellipse(0, -18 * s + bob, 14 * s, 16 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  /* ---- APRON ---- */
  ctx.fillStyle = "#C0392B";
  ctx.beginPath();
  ctx.moveTo(-10 * s, -28 * s + bob);
  ctx.lineTo(-11 * s, 2 * s + bob);
  ctx.lineTo(11 * s, 2 * s + bob);
  ctx.lineTo(10 * s, -28 * s + bob);
  ctx.closePath(); ctx.fill();
  /* Straps */
  ctx.fillStyle = "#A02018";
  ctx.fillRect(-10 * s, -30 * s + bob, 3 * s, 5 * s);
  ctx.fillRect(7 * s, -30 * s + bob, 3 * s, 5 * s);
  /* LiC logo */
  ctx.fillStyle = "#FFD700"; ctx.font = `bold ${8 * s}px sans-serif`; ctx.textAlign = "center";
  ctx.fillText("LiC", 0, -10 * s + bob); ctx.textAlign = "start";

  /* ---- ARMS ---- */
  ctx.fillStyle = "#F5C193";
  if (state === "idle" && side === "left" && !angry) {
    /* Wiping counter */
    const wipe = Math.sin(t * 2) * 6;
    ctx.save(); ctx.translate(-13 * s, -8 * s + bob); ctx.rotate(-0.3);
    ctx.fillRect(-3 * s, 0, 5 * s, 14 * s); ctx.restore();
    ctx.fillStyle = "#bbb"; ctx.fillRect(-16 * s + wipe, 0 + bob, 8 * s, 3 * s);
    ctx.fillStyle = "#F5C193"; ctx.fillRect(11 * s, -10 * s + bob, 5 * s, 14 * s);
  } else if (state === "idle" && side === "right") {
    /* Arranging cups */
    const cm = Math.sin(t * 1.5) * 4;
    ctx.fillRect(-14 * s, -10 * s + bob, 5 * s, 14 * s);
    ctx.fillRect(10 * s + cm, -6 * s + bob, 5 * s, 14 * s);
  } else if (state === "accepted" && side === "left") {
    /* Working machine */
    ctx.save(); ctx.translate(-12 * s, -12 * s + bob); ctx.rotate(-0.4);
    ctx.fillRect(-3 * s, 0, 5 * s, 16 * s); ctx.restore();
    ctx.fillRect(10 * s, -12 * s + bob, 5 * s, 16 * s);
  } else if (state === "accepted" && side === "right") {
    /* Writing on cup */
    ctx.fillRect(-14 * s, -10 * s + bob, 5 * s, 14 * s);
    ctx.save(); ctx.translate(12 * s, -6 * s + bob); ctx.rotate(Math.sin(t * 4) * 0.12);
    ctx.fillRect(-2 * s, 0, 5 * s, 12 * s);
    ctx.fillStyle = "#333"; ctx.fillRect(0, 10 * s, 2 * s, 5 * s);
    ctx.restore();
  } else if (state === "ready" && side === "right") {
    /* Holding cup, waving */
    ctx.fillRect(-16 * s, -10 * s + bob, 5 * s, 14 * s);
    ctx.save(); ctx.translate(13 * s, -16 * s + bob); ctx.rotate(-0.7 + Math.sin(t * 5) * 0.25);
    ctx.fillRect(-2 * s, -12 * s, 5 * s, 12 * s); ctx.restore();
    ctx.fillStyle = "#C0392B"; ctx.fillRect(-18 * s, -4 * s + bob, 7 * s, 10 * s);
    ctx.fillStyle = "#FFF"; ctx.fillRect(-17 * s, -3 * s + bob, 5 * s, 1.5 * s);
  } else if (scared) {
    /* Raised arms — scared */
    ctx.save(); ctx.translate(-13 * s, -20 * s + bob); ctx.rotate(-0.5);
    ctx.fillRect(-2 * s, -10 * s, 5 * s, 10 * s); ctx.restore();
    ctx.save(); ctx.translate(13 * s, -20 * s + bob); ctx.rotate(0.5);
    ctx.fillRect(-2 * s, -10 * s, 5 * s, 10 * s); ctx.restore();
  } else {
    ctx.fillRect(-14 * s, -10 * s + bob, 5 * s, 14 * s);
    ctx.fillRect(10 * s, -10 * s + bob, 5 * s, 14 * s);
  }

  /* ---- NECK ---- */
  ctx.fillStyle = "#F5C193";
  ctx.fillRect(-3 * s, -33 * s + bob, 6 * s, 6 * s);

  /* ---- HEAD ---- */
  ctx.fillStyle = "#F5C193";
  ctx.beginPath(); ctx.ellipse(0, -42 * s + bob, 12 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();

  /* ---- HAIR ---- */
  ctx.fillStyle = side === "left" ? "#3B2410" : "#1A0E06";
  ctx.beginPath(); ctx.ellipse(0, -50 * s + bob, 11 * s, 7 * s, 0, Math.PI, 0, true); ctx.fill();
  if (side === "right") {
    ctx.beginPath(); ctx.ellipse(-6 * s, -49 * s + bob, 5 * s, 3 * s, -0.3, Math.PI, 0, true); ctx.fill();
  }
  if (side === "left") {
    /* Side-part for Vitaliy */
    ctx.beginPath(); ctx.ellipse(7 * s, -48 * s + bob, 4 * s, 3 * s, 0.2, Math.PI, 0, true); ctx.fill();
  }

  /* ---- EARS ---- */
  ctx.fillStyle = "#F0BA8A";
  ctx.beginPath(); ctx.ellipse(-11 * s, -40 * s + bob, 2.5 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(11 * s, -40 * s + bob, 2.5 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();

  /* ---- FACE ---- */
  const fy = -42 * s + bob;

  if (scared) {
    /* Wide eyes + open mouth */
    for (const ex of [-4, 4]) {
      ctx.fillStyle = "#FFF";
      ctx.beginPath(); ctx.ellipse(ex * s, fy - 1, 4 * s, 4.5 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2A1810";
      ctx.beginPath(); ctx.arc(ex * s, fy, 2.5 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#6B3E26";
    ctx.beginPath(); ctx.ellipse(0, fy + 7, 2.5 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,50,50,0.7)"; ctx.font = `bold ${14 * s}px sans-serif`; ctx.textAlign = "center";
    ctx.fillText("!", 0, fy - 18 * s); ctx.textAlign = "start";
  } else if (angry) {
    ctx.fillStyle = "#222";
    ctx.fillRect(-5 * s, fy - 2, 3.5 * s, 2); ctx.fillRect(1.5 * s, fy - 2, 3.5 * s, 2);
    ctx.strokeStyle = "#222"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-6 * s, fy - 7); ctx.lineTo(-1.5 * s, fy - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6 * s, fy - 7); ctx.lineTo(1.5 * s, fy - 4); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, fy + 6, 3 * s, Math.PI + 0.3, -0.3); ctx.stroke();
  } else {
    /* Normal face */
    for (const ex of [-4, 4]) {
      ctx.fillStyle = "#FFF";
      ctx.beginPath(); ctx.ellipse(ex * s, fy - 1, 3 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2A1810";
      ctx.beginPath(); ctx.arc(ex * s, fy, 1.8 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FFF";
      ctx.beginPath(); ctx.arc(ex * s + 0.8, fy - 1.5, 0.7 * s, 0, Math.PI * 2); ctx.fill();
    }
    /* Eyebrows */
    ctx.strokeStyle = side === "left" ? "#3B2410" : "#1A0E06"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-6 * s, fy - 6); ctx.quadraticCurveTo(-3 * s, fy - 8, -1.5 * s, fy - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1.5 * s, fy - 6); ctx.quadraticCurveTo(3 * s, fy - 8, 6 * s, fy - 6); ctx.stroke();
    /* Nose */
    ctx.strokeStyle = "rgba(150,100,70,0.4)"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, fy + 1); ctx.quadraticCurveTo(1.5 * s, fy + 4, 0, fy + 4.5); ctx.stroke();
    /* Smile */
    ctx.strokeStyle = "#6B3E26"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, fy + 3.5, 3 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }

  ctx.restore();
}

/* ====== COMPONENT ====== */
export default function CoffeeScene({ orderStatus, orderCount }: { orderStatus?: BaristaState; orderCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const frameRef = useRef(0);
  const [vTaps, setVTaps] = useState(0);
  const [aTaps, setATaps] = useState(0);
  const [vGone, setVGone] = useState(false);
  const [vAngryPhase, setVAngryPhase] = useState(false);
  const [aFalling, setAFalling] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [wokeUp, setWokeUp] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: BASE_W, h: BASE_H });
  const vTapTimer = useRef<ReturnType<typeof setTimeout>>();
  const aTapTimer = useRef<ReturnType<typeof setTimeout>>();

  const state = orderStatus ?? "idle";
  const isNight = typeof window !== "undefined" && new Date().getHours() >= 23;

  /* Responsive canvas size */
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      const parentW = c.parentElement?.clientWidth ?? BASE_W;
      const dpr = window.devicePixelRatio || 1;
      const w = parentW;
      const h = Math.round(w * BASE_H / BASE_W);
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      setCanvasSize({ w: w * dpr, h: h * dpr });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* Easter egg states */
  useEffect(() => {
    if (vTaps >= 8 && !vGone && !vAngryPhase) {
      setVAngryPhase(true);
      setTimeout(() => { setVAngryPhase(false); setVGone(true); setTimeout(() => { setVGone(false); setVTaps(0); }, 30000); }, 2000);
    }
  }, [vTaps, vGone, vAngryPhase]);

  useEffect(() => {
    if (aTaps >= 5 && !aFalling) {
      setAFalling(true);
      setTimeout(() => { setAFalling(false); setATaps(0); }, 5000);
    }
  }, [aTaps, aFalling]);

  useEffect(() => {
    if (orderCount && orderCount > 0 && orderCount % 10 === 0 && !isDancing) {
      setIsDancing(true);
      setTimeout(() => setIsDancing(false), 3000);
    }
  }, [orderCount, isDancing]);

  /* Shake detection */
  useEffect(() => {
    let lastShake = 0;
    const handle = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const tot = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      if (tot > 25 && Date.now() - lastShake > 3000) { lastShake = Date.now(); }
    };
    window.addEventListener("devicemotion", handle);
    return () => window.removeEventListener("devicemotion", handle);
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    tRef.current += 0.02;
    drawScene(ctx, canvasSize.w, canvasSize.h, tRef.current, state,
      vGone ? 99 : (vAngryPhase ? 8 : vTaps),
      aFalling ? 99 : aTaps,
      isNight, isDancing ? 10 : 0, wokeUp);
    frameRef.current = requestAnimationFrame(draw);
  }, [state, vTaps, aTaps, isNight, isDancing, vGone, aFalling, wokeUp, vAngryPhase, canvasSize]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width * BASE_W;

    if (isNight && !wokeUp) {
      setWokeUp(true);
      setTimeout(() => setWokeUp(false), 5000);
      return;
    }
    if (cx > BASE_W / 2 - 90 && cx < BASE_W / 2 - 20) {
      setVTaps((p) => p + 1);
      clearTimeout(vTapTimer.current);
      if (vTaps < 7) vTapTimer.current = setTimeout(() => setVTaps(0), 30000);
    }
    if (cx > BASE_W / 2 + 20 && cx < BASE_W / 2 + 90) {
      setATaps((p) => p + 1);
      clearTimeout(aTapTimer.current);
      if (aTaps < 4) aTapTimer.current = setTimeout(() => setATaps(0), 10000);
    }
    if (cx > BASE_W * 0.33) {
      const el = document.querySelector("[data-menu-tabs]");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full rounded-2xl cursor-pointer"
    />
  );
}
