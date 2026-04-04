"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { rtdb } from "@/lib/firebase";
import { ref, set, onValue, off, onDisconnect } from "firebase/database";

/* ═══════════════════════════════════════════
   ТИПЫ
   ═══════════════════════════════════════════ */
type Gender = "male" | "female";
type Mood = "happy" | "cool" | "excited" | "sleepy" | "angry";
type Status = "working" | "break" | "away";
type Floor = 0 | 1;
type AvatarAction = "idle" | "coffee" | "monitor" | "phone" | "yawn";

interface AvatarConfig {
  gender: Gender;
  skinColor: number;
  hairstyle: number;
  clothingColor: number;
  mood: Mood;
  name: string;
}

interface OnlineUser {
  id: string;
  avatar: AvatarConfig;
  status: Status;
  floor: Floor;
  x: number;
  action: AvatarAction;
  lastSeen: number;
}

/* ═══════════════════════════════════════════
   ПАЛИТРЫ
   ═══════════════════════════════════════════ */
const SKIN_COLORS = ["#FDDCB5", "#F5C193", "#D4956B", "#A56B43", "#6B3E26"];
const CLOTHING_COLORS = ["#8B5E3C", "#D4573B", "#3B82D4", "#3BD49A", "#D4A33B"];

const STATUS_LABELS: Record<Status, string> = {
  working: "На работе",
  break: "Перерыв",
  away: "Ушёл",
};
const STATUS_COLORS: Record<Status, string> = {
  working: "#22c55e",
  break: "#f59e0b",
  away: "#ef4444",
};

const ACTIONS: AvatarAction[] = ["coffee", "monitor", "phone", "yawn"];

/* ═══════════════════════════════════════════
   МИНИ-РИСОВАЛКА АВАТАРА (КРУПНАЯ)
   ═══════════════════════════════════════════ */
function drawMiniAvatar(
  ctx: CanvasRenderingContext2D,
  cfg: AvatarConfig,
  x: number,
  y: number,
  scale: number,
  action: AvatarAction,
  bobOffset: number
) {
  ctx.save();
  ctx.translate(x, y + bobOffset * scale);

  const s = scale;
  const skin = SKIN_COLORS[cfg.skinColor];
  const cloth = CLOTHING_COLORS[cfg.clothingColor];
  const hairColor =
    cfg.skinColor <= 1 ? "#3B2410" : cfg.skinColor <= 3 ? "#1A0E06" : "#0A0503";

  /* ноги */
  ctx.fillStyle = "#3A3A5C";
  ctx.fillRect(-8 * s, 36 * s, 7 * s, 16 * s);
  ctx.fillRect(2 * s, 36 * s, 7 * s, 16 * s);

  /* ботинки */
  ctx.fillStyle = "#2A2A2A";
  ctx.fillRect(-9 * s, 50 * s, 9 * s, 5 * s);
  ctx.fillRect(1 * s, 50 * s, 9 * s, 5 * s);

  /* тело */
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.ellipse(0, 28 * s, 20 * s, 16 * s, 0, Math.PI, 0, true);
  ctx.fill();
  /* воротник */
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.moveTo(-6 * s, 14 * s);
  ctx.lineTo(0, 18 * s);
  ctx.lineTo(6 * s, 14 * s);
  ctx.closePath();
  ctx.fill();

  /* руки */
  ctx.fillStyle = cloth;
  if (action === "coffee") {
    /* правая рука держит кружку */
    ctx.save();
    ctx.translate(20 * s, 18 * s);
    ctx.rotate(0.3);
    ctx.fillRect(-4 * s, -2 * s, 8 * s, 18 * s);
    ctx.restore();
    /* левая рука опущена */
    ctx.fillRect(-24 * s, 16 * s, 8 * s, 18 * s);
  } else if (action === "phone") {
    /* левая рука к уху */
    ctx.save();
    ctx.translate(-20 * s, 8 * s);
    ctx.rotate(-0.4);
    ctx.fillRect(-4 * s, -2 * s, 8 * s, 18 * s);
    ctx.restore();
    ctx.fillRect(16 * s, 16 * s, 8 * s, 18 * s);
  } else if (action === "monitor") {
    /* обе руки вперёд */
    ctx.fillRect(-24 * s, 14 * s, 8 * s, 16 * s);
    ctx.fillRect(16 * s, 14 * s, 8 * s, 16 * s);
  } else {
    /* idle / yawn */
    ctx.fillRect(-24 * s, 16 * s, 8 * s, 18 * s);
    ctx.fillRect(16 * s, 16 * s, 8 * s, 18 * s);
  }
  /* кисти рук */
  ctx.fillStyle = skin;
  if (action === "coffee") {
    ctx.beginPath();
    ctx.arc(26 * s, 34 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-20 * s, 34 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (action === "phone") {
    ctx.beginPath();
    ctx.arc(-24 * s, 4 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20 * s, 34 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(-20 * s, 34 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20 * s, 34 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  /* шея */
  ctx.fillStyle = skin;
  ctx.fillRect(-5 * s, 10 * s, 10 * s, 8 * s);

  /* голова */
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22 * s, 23 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  /* уши */
  ctx.beginPath();
  ctx.ellipse(-20 * s, 2 * s, 5 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(20 * s, 2 * s, 5 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  /* причёска */
  ctx.fillStyle = hairColor;
  const headTop = -23 * s;
  ctx.beginPath();
  ctx.ellipse(0, headTop + 13 * s, 21 * s, 15 * s, 0, Math.PI, 0, true);
  ctx.fill();

  if (cfg.gender === "female") {
    ctx.fillRect(-21 * s, -5 * s, 6 * s, 22 * s);
    ctx.fillRect(15 * s, -5 * s, 6 * s, 22 * s);
  }

  /* глаза */
  const eyeY = -3 * s;
  for (const side of [-1, 1]) {
    const ex = side * 9 * s;
    if (cfg.mood === "sleepy" || action === "yawn") {
      ctx.strokeStyle = "#2A1810";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(ex - 5 * s, eyeY);
      ctx.lineTo(ex + 5 * s, eyeY);
      ctx.stroke();
    } else if (cfg.mood === "cool") {
      ctx.fillStyle = "#1A1A1A";
      ctx.fillRect(ex - 6 * s, eyeY - 3 * s, 12 * s, 7 * s);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ex, eyeY, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2A1810";
      ctx.beginPath();
      ctx.arc(ex + 1 * s, eyeY, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      /* блик */
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(ex + 2.5 * s, eyeY - 1.5 * s, 1 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* щёки */
  ctx.fillStyle = "rgba(255,150,150,0.25)";
  ctx.beginPath();
  ctx.ellipse(-12 * s, 6 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12 * s, 6 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  /* рот */
  const my = 9 * s;
  ctx.strokeStyle = "#2A1810";
  ctx.lineWidth = 1.8 * s;
  if (action === "yawn") {
    ctx.fillStyle = "#2A1810";
    ctx.beginPath();
    ctx.ellipse(0, my, 6 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#C0392B";
    ctx.beginPath();
    ctx.ellipse(0, my + 2 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (action === "coffee") {
    ctx.beginPath();
    ctx.arc(0, my - 1 * s, 6 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, my - 2 * s, 7 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  /* предмет в руке */
  if (action === "coffee") {
    /* красный стаканчик кофе */
    ctx.fillStyle = "#C0392B";
    ctx.beginPath();
    ctx.moveTo(24 * s, 12 * s);
    ctx.lineTo(28 * s, -2 * s);
    ctx.lineTo(40 * s, -2 * s);
    ctx.lineTo(36 * s, 12 * s);
    ctx.closePath();
    ctx.fill();
    /* крышка */
    ctx.fillStyle = "#FFF";
    ctx.fillRect(27 * s, -4 * s, 14 * s, 3 * s);
    /* пар */
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    for (let pi = 0; pi < 3; pi++) {
      ctx.beginPath();
      const sx = (30 + pi * 4) * s;
      ctx.moveTo(sx, -5 * s);
      ctx.quadraticCurveTo(sx + 2 * s, -12 * s, sx - 1 * s, -18 * s);
      ctx.stroke();
    }
  } else if (action === "phone") {
    /* телефон у уха */
    ctx.fillStyle = "#333";
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    const px = -28 * s;
    const py = -10 * s;
    ctx.beginPath();
    ctx.roundRect(px, py, 8 * s, 16 * s, 2 * s);
    ctx.fill();
    ctx.stroke();
    /* экран телефона */
    ctx.fillStyle = "#4488CC";
    ctx.fillRect(px + 1 * s, py + 2 * s, 6 * s, 10 * s);
  } else if (action === "monitor") {
    /* рука вперёд к монитору */
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(22 * s, 20 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ═══════════════════════════════════════════
   РИСОВАЛКА ОФИСА (верхний этаж) — детализированная
   ═══════════════════════════════════════════ */
function drawBankOffice(ctx: CanvasRenderingContext2D, w: number, h: number) {
  /* стена */
  const grad = ctx.createLinearGradient(0, 0, 0, h - 70);
  grad.addColorStop(0, "#F5F0E8");
  grad.addColorStop(1, "#EDE5D8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h - 70);

  /* плинтус */
  ctx.fillStyle = "#8B7355";
  ctx.fillRect(0, h - 78, w, 8);

  /* пол паркет */
  ctx.fillStyle = "#D4B896";
  ctx.fillRect(0, h - 70, w, 70);
  /* линии паркета */
  ctx.strokeStyle = "#C4A882";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < w; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, h - 70);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
  for (let j = h - 70; j < h; j += 20) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(w, j);
    ctx.stroke();
  }

  /* потолочные лампы */
  for (let i = 0; i < 4; i++) {
    const lx = 120 + i * 200;
    /* провод */
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 18);
    ctx.stroke();
    /* плафон */
    ctx.fillStyle = "#F5E6C8";
    ctx.beginPath();
    ctx.moveTo(lx - 20, 18);
    ctx.lineTo(lx - 14, 34);
    ctx.lineTo(lx + 14, 34);
    ctx.lineTo(lx + 20, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#D4A33B";
    ctx.lineWidth = 1;
    ctx.stroke();
    /* свет */
    ctx.fillStyle = "rgba(255,240,200,0.15)";
    ctx.beginPath();
    ctx.moveTo(lx - 14, 34);
    ctx.lineTo(lx - 40, h - 78);
    ctx.lineTo(lx + 40, h - 78);
    ctx.lineTo(lx + 14, 34);
    ctx.closePath();
    ctx.fill();
  }

  /* окна */
  for (let i = 0; i < 3; i++) {
    const wx = 100 + i * 280;
    /* рама */
    ctx.fillStyle = "#C8E0F0";
    ctx.fillRect(wx, 30, 90, 110);
    /* небо в окне */
    const skyGrad = ctx.createLinearGradient(wx, 30, wx, 140);
    skyGrad.addColorStop(0, "#87CEEB");
    skyGrad.addColorStop(1, "#B8E0F8");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(wx + 3, 33, 84, 104);
    /* облачко */
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(wx + 30, 60, 12, 0, Math.PI * 2);
    ctx.arc(wx + 45, 55, 16, 0, Math.PI * 2);
    ctx.arc(wx + 60, 60, 12, 0, Math.PI * 2);
    ctx.fill();
    /* рама */
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 3;
    ctx.strokeRect(wx, 30, 90, 110);
    ctx.beginPath();
    ctx.moveTo(wx + 45, 30);
    ctx.lineTo(wx + 45, 140);
    ctx.moveTo(wx, 85);
    ctx.lineTo(wx + 90, 85);
    ctx.stroke();
    /* подоконник */
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(wx - 5, 138, 100, 6);
  }

  /* картины на стенах */
  const paintings = [
    { x: 48, y: 55, color: "#E74C3C" },
    { x: 740, y: 55, color: "#2ECC71" },
  ];
  for (const p of paintings) {
    /* рама */
    ctx.fillStyle = "#8B5E3C";
    ctx.fillRect(p.x - 2, p.y - 2, 44, 54);
    /* холст */
    ctx.fillStyle = "#FFF8E8";
    ctx.fillRect(p.x, p.y, 40, 50);
    /* абстрактное искусство */
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x + 20, p.y + 25, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.arc(p.x + 25, p.y + 20, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  /* кофемашина в углу */
  const cmx = w - 60;
  const cmy = h - 78;
  /* корпус */
  ctx.fillStyle = "#444";
  ctx.fillRect(cmx, cmy - 60, 45, 60);
  ctx.fillStyle = "#333";
  ctx.fillRect(cmx + 2, cmy - 55, 41, 30);
  /* экран */
  ctx.fillStyle = "#4488CC";
  ctx.fillRect(cmx + 8, cmy - 50, 20, 14);
  /* кнопки */
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(cmx + 35, cmy - 42, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.arc(cmx + 35, cmy - 34, 3, 0, Math.PI * 2);
  ctx.fill();
  /* носик */
  ctx.fillStyle = "#555";
  ctx.fillRect(cmx + 15, cmy - 24, 12, 8);
  /* поддон */
  ctx.fillStyle = "#666";
  ctx.fillRect(cmx + 5, cmy - 16, 35, 4);
  /* стаканчик */
  ctx.fillStyle = "#C0392B";
  ctx.fillRect(cmx + 17, cmy - 16, 12, 14);
  ctx.fillStyle = "#FFF";
  ctx.fillRect(cmx + 17, cmy - 16, 12, 2);
  /* надпись */
  ctx.fillStyle = "#999";
  ctx.font = "8px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("COFFEE", cmx + 22, cmy - 2);
  ctx.textAlign = "start";

  /* столы */
  for (let i = 0; i < 4; i++) {
    const dx = 60 + i * 190;
    const dy = h - 70;

    /* стол */
    ctx.fillStyle = "#C4A882";
    ctx.fillRect(dx, dy - 48, 130, 10);
    /* ножки */
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(dx + 5, dy - 38, 6, 38);
    ctx.fillRect(dx + 119, dy - 38, 6, 38);

    /* монитор */
    ctx.fillStyle = "#2A2A2A";
    ctx.fillRect(dx + 38, dy - 85, 54, 35);
    ctx.fillStyle = "#4488CC";
    ctx.fillRect(dx + 40, dy - 83, 50, 31);
    /* подставка */
    ctx.fillStyle = "#2A2A2A";
    ctx.fillRect(dx + 60, dy - 50, 10, 5);
    ctx.fillRect(dx + 52, dy - 46, 26, 3);

    /* клавиатура */
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.roundRect(dx + 32, dy - 44, 46, 8, 2);
    ctx.fill();
    /* мышка */
    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.ellipse(dx + 95, dy - 42, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    /* стул */
    ctx.fillStyle = "#5B3A1E";
    ctx.fillRect(dx + 52, dy - 20, 26, 6);
    ctx.fillRect(dx + 56, dy - 14, 4, 14);
    ctx.fillRect(dx + 70, dy - 14, 4, 14);
    ctx.fillStyle = "#7B5A3E";
    ctx.fillRect(dx + 50, dy - 40, 30, 20);
  }

  /* растения */
  for (const px of [25, w - 90]) {
    const py = h - 70;
    ctx.fillStyle = "#B8755D";
    ctx.beginPath();
    ctx.moveTo(px - 12, py);
    ctx.lineTo(px - 14, py - 32);
    ctx.lineTo(px + 14, py - 32);
    ctx.lineTo(px + 12, py);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5D3A1A";
    ctx.fillRect(px - 12, py - 32, 24, 6);
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath();
    ctx.ellipse(px, py - 55, 16, 22, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#66BB6A";
    ctx.beginPath();
    ctx.ellipse(px + 12, py - 48, 13, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#43A047";
    ctx.beginPath();
    ctx.ellipse(px - 10, py - 45, 11, 16, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /* вывеска */
  ctx.fillStyle = "rgba(139,115,85,0.2)";
  ctx.beginPath();
  ctx.roundRect(w / 2 - 70, 4, 140, 24, 4);
  ctx.fill();
  ctx.fillStyle = "#8B7355";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ОФИС БАНКА", w / 2, 22);
  ctx.textAlign = "start";
}

/* ═══════════════════════════════════════════
   РИСОВАЛКА КОФЕЙНИ (нижний этаж) — детализированная
   ═══════════════════════════════════════════ */
function drawCoffeeShop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  /* красная кирпичная стена */
  const grad = ctx.createLinearGradient(0, 0, 0, h - 70);
  grad.addColorStop(0, "#B83224");
  grad.addColorStop(1, "#9C2B1F");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h - 70);

  /* кирпичная текстура */
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  for (let row = 0; row < Math.ceil((h - 70) / 16); row++) {
    const yy = row * 16;
    const offset = row % 2 === 0 ? 0 : 25;
    for (let col = -1; col < Math.ceil(w / 50) + 1; col++) {
      ctx.strokeRect(col * 50 + offset, yy, 50, 16);
    }
  }

  /* пол */
  ctx.fillStyle = "#3D2B1A";
  ctx.fillRect(0, h - 70, w, 70);
  /* плитка шахматная */
  for (let i = 0; i < Math.ceil(w / 35); i++) {
    for (let j = 0; j < 2; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(i * 35, h - 70 + j * 35, 35, 35);
      }
    }
  }

  /* большой логотип Love is Coffee */
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.arc(w / 2, 70, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(w / 2, 70, 55, 0, Math.PI * 2);
  ctx.fill();
  /* сердце */
  ctx.fillStyle = "#FFF";
  ctx.font = "28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("❤", w / 2, 58);
  /* текст */
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("LOVE IS", w / 2, 80);
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("COFFEE", w / 2, 98);
  ctx.textAlign = "start";

  /* меню-борды на стене */
  for (const mbx of [40, w - 170]) {
    /* доска */
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(mbx, 20, 130, 90);
    /* рамка */
    ctx.strokeStyle = "#8B5E3C";
    ctx.lineWidth = 3;
    ctx.strokeRect(mbx, 20, 130, 90);
    /* заголовок */
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("МЕНЮ", mbx + 65, 40);
    /* позиции */
    ctx.fillStyle = "#FFF";
    ctx.font = "9px sans-serif";
    const items =
      mbx < 100
        ? ["Эспрессо ........ 150₽", "Капучино ........ 220₽", "Латте ............. 250₽", "Раф ................ 280₽"]
        : ["Круассан ........ 180₽", "Чизкейк ......... 320₽", "Маффин ......... 160₽", "Тирамису ....... 350₽"];
    items.forEach((item, idx) => {
      ctx.fillText(item, mbx + 65, 56 + idx * 14);
    });
    ctx.textAlign = "start";
  }

  /* полки на стене */
  for (const sy of [30, 65]) {
    const shelfX = 200;
    ctx.fillStyle = "#6B4226";
    ctx.fillRect(shelfX, sy, 160, 6);
    /* кронштейны */
    ctx.fillRect(shelfX + 10, sy, 4, 12);
    ctx.fillRect(shelfX + 146, sy, 4, 12);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = ["#E8D5B7", "#C4956B", "#A67B5B", "#DDD", "#B8755D"][i];
      ctx.fillRect(shelfX + 5 + i * 30, sy - 22, 18, 22);
      /* этикетка */
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(shelfX + 8 + i * 30, sy - 16, 12, 8);
    }
  }

  /* зелёная стойка с надписью Center Coffee */
  const barY = h - 120;
  const barW = 340;
  const barX = w / 2 - barW / 2;
  /* основание */
  ctx.fillStyle = "#1B5E20";
  ctx.fillRect(barX, barY, barW, 50);
  /* столешница */
  ctx.fillStyle = "#2E7D32";
  ctx.fillRect(barX - 5, barY - 6, barW + 10, 10);
  /* отблеск */
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(barX - 5, barY - 6, barW + 10, 4);
  /* надпись Center Coffee */
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CENTER COFFEE", w / 2, barY + 30);
  ctx.textAlign = "start";

  /* кофемашина на стойке */
  const cmx = barX + barW - 60;
  ctx.fillStyle = "#555";
  ctx.fillRect(cmx, barY - 50, 50, 45);
  ctx.fillStyle = "#333";
  ctx.fillRect(cmx + 3, barY - 46, 44, 22);
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(cmx + 12, barY - 18, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.arc(cmx + a5, barY - 18, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f39c12";
  ctx.beginPath();
  ctx.arc(cmx + 38, barY - 18, 4, 0, Math.PI * 2);
  ctx.fill();
  /* носик */
  ctx.fillStyle = "#666";
  ctx.fillRect(cmx + 18, barY - 10, 14, 6);

  /* стопки красных стаканчиков (3 стопки) */
  for (let si = 0; si < 3; si++) {
    const sx = barX + 25 + si * 55;
    for (let sj = 0; sj < 4; sj++) {
      const sy2 = barY - 8 - sj * 10;
      ctx.fillStyle = "#C0392B";
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy2);
      ctx.lineTo(sx - 5, sy2 - 10);
      ctx.lineTo(sx + 9, sy2 - 10);
      ctx.lineTo(sx + 10, sy2);
      ctx.closePath();
      ctx.fill();
      /* крышка */
      ctx.fillStyle = "#E8E8E8";
      ctx.fillRect(sx - 6, sy2 - 12, 16, 2);
    }
  }

  /* белые стаканы на стойке */
  for (let i = 0; i < 2; i++) {
    const cx2 = barX + 200 + i * 40;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cx2, barY - 22, 16, 20);
    ctx.fillStyle = "#8B5E3C";
    ctx.fillRect(cx2 + 1, barY - 21, 14, 8);
    /* пар */
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx2 + 5, barY - 24);
    ctx.quadraticCurveTo(cx2 + 7, barY - 32, cx2 + 4, barY - 38);
    ctx.stroke();
  }

  /* столики для гостей */
  for (const tx of [w - 190, w - 80]) {
    ctx.fillStyle = "#6B4226";
    ctx.beginPath();
    ctx.arc(tx, h - 90, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8B5E3C";
    ctx.beginPath();
    ctx.arc(tx, h - 90, 26, 0, Math.PI * 2);
    ctx.fill();
    /* ножка */
    ctx.fillStyle = "#5B3A1E";
    ctx.fillRect(tx - 4, h - 62, 8, 62);
    /* основание */
    ctx.fillRect(tx - 14, h - 4, 28, 4);
  }

  /* потолочные лампы */
  for (let i = 0; i < 3; i++) {
    const lx = 150 + i * 260;
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 12);
    ctx.stroke();
    /* лампочка */
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(lx, 18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,215,0,0.08)";
    ctx.beginPath();
    ctx.arc(lx, 18, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  /* вывеска сверху */
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.roundRect(w / 2 - 85, 2, 170, 22, 4);
  ctx.fill();
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("☕  LOVE IS COFFEE  ☕", w / 2, 18);
  ctx.textAlign = "start";
}

/* ═══════════════════════════════════════════
   РИСОВКА NPC (Виталий и Аслан)
   ═══════════════════════════════════════════ */
function drawNPC(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  skinIdx: number,
  clothIdx: number,
  bobOff: number
) {
  const cfg: AvatarConfig = {
    gender: "male",
    skinColor: skinIdx,
    hairstyle: skinIdx === 0 ? 1 : 3,
    clothingColor: clothIdx,
    mood: "happy",
    name,
  };

  /* фартук зелёный */
  drawMiniAvatar(ctx, cfg, x, y + bobOff, 0.9, "idle", 0);

  /* бейдж */
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("БАРИСТА", x, y + 46);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText(name, x, y + 58);
  ctx.textAlign = "start";
}

/* ═══════════════════════════════════════════
   ГЛАВНЫЙ КОМПОНЕНТ
   ═══════════════════════════════════════════ */
export default function OfficePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [floor, setFloor] = useState<Floor>(0);
  const [status, setStatus] = useState<Status>("working");
  const [myAvatar, setMyAvatar] = useState<AvatarConfig | null>(null);
  const [myAction, setMyAction] = useState<AvatarAction>("idle");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("oic_userId");
      if (!id) {
        id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem("oic_userId", id);
      }
      return id;
    }
    return "anon";
  });

  const bobRef = useRef(0);
  const frameRef = useRef(0);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const myXRef = useRef(200);
  const canvasW = 880;
  const canvasH = 420;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("oic_avatar");
    if (saved) {
      try {
        setMyAvatar(JSON.parse(saved));
      } catch {
        /* fallback */
      }
    }
    if (!saved) {
      setMyAvatar({
        gender: "male",
        skinColor: 0,
        hairstyle: 0,
        clothingColor: 2,
        mood: "happy",
        name: "Гость",
      });
    }
  }, []);

  useEffect(() => {
    if (!myAvatar) return;
    localStorage.setItem("oic_avatar", JSON.stringify(myAvatar));
  }, [myAvatar]);

  useEffect(() => {
    if (!myAvatar || userId === "anon") return;
    const userRef = ref(rtdb, `presence/${userId}`);
    const userData: OnlineUser = {
      id: userId,
      avatar: myAvatar,
      status,
      floor,
      x: myXRef.current,
      action: myAction,
      lastSeen: Date.now(),
    };
    set(userRef, userData);
    onDisconnect(userRef).remove();
  }, [myAvatar, userId, status, floor, myAction]);

  useEffect(() => {
    if (!myAvatar || userId === "anon") return;
    const userRef = ref(rtdb, `presence/${userId}`);
    set(userRef, {
      id: userId,
      avatar: myAvatar,
      status,
      floor,
      x: myXRef.current,
      action: myAction,
      lastSeen: Date.now(),
    });
  }, [status, floor, myAction, myAvatar, userId]);

  useEffect(() => {
    const presenceRef = ref(rtdb, "presence");
    const unsub = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setOnlineUsers([]);
        return;
      }
      const users: OnlineUser[] = Object.values(data);
      setOnlineUsers(users.filter((u) => u.id !== userId));
    });
    return () => off(presenceRef, "value", unsub as never);
  }, [userId]);

  /* Рандомные анимации каждые 5-10 сек */
  useEffect(() => {
    const scheduleAction = () => {
      const delay = 5000 + Math.random() * 5000;
      actionTimerRef.current = setTimeout(() => {
        const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        setMyAction(randomAction);
        setTimeout(() => setMyAction("idle"), 2500 + Math.random() * 1500);
        scheduleAction();
      }, delay);
    };
    scheduleAction();
    return () => {
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    };
  }, []);

  /* Основной цикл рисования */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    bobRef.current += 0.03;
    const bob = Math.sin(bobRef.current) * 2.5;

    ctx.clearRect(0, 0, canvasW, canvasH);

    if (floor === 0) {
      drawBankOffice(ctx, canvasW, canvasH);
    } else {
      drawCoffeeShop(ctx, canvasW, canvasH);
      drawNPC(ctx, "Виталий", canvasW / 2 - 60, canvasH - 170, 0, 3, bob * 0.5);
      drawNPC(ctx, "Аслан", canvasW / 2 + 60, canvasH - 170, 2, 3, bob * 0.7);
    }

    /* онлайн-пользователи */
    onlineUsers
      .filter((u) => u.floor === floor)
      .forEach((u, i) => {
        const ux = 120 + (i * 160 + (u.x % 100));
        const uy = canvasH - 120;
        drawMiniAvatar(ctx, u.avatar, ux, uy, 0.9, u.action, bob * 0.6);

        ctx.fillStyle = STATUS_COLORS[u.status];
        ctx.beginPath();
        ctx.arc(ux + 22, uy - 34, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#FFF";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(u.avatar.name, ux, uy + 60);
        ctx.textAlign = "start";
      });

    /* МОЙ АВАТАР — КРУПНЫЙ */
    if (myAvatar) {
      const myY = canvasH - 120;
      drawMiniAvatar(ctx, myAvatar, myXRef.current, myY, 1.15, myAction, bob);

      /* тень */
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.ellipse(myXRef.current, myY + 58, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      /* имя */
      ctx.fillStyle = "#FFF";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 3;
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText(myAvatar.name, myXRef.current, myY + 72);
      ctx.fillText(myAvatar.name, myXRef.current, myY + 72);
      ctx.textAlign = "start";

      /* индикатор статуса */
      ctx.fillStyle = STATUS_COLORS[status];
      ctx.beginPath();
      ctx.arc(myXRef.current + 28, myY - 38, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      /* подпись действия */
      if (myAction !== "idle") {
        const actionLabels: Record<AvatarAction, string> = {
          idle: "",
          coffee: "Пьёт кофе ☕",
          monitor: "Работает 💻",
          phone: "По телефону 📞",
          yawn: "Зевает 🥱",
        };
        /* облачко */
        const label = actionLabels[myAction];
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.beginPath();
        ctx.roundRect(myXRef.current - tw / 2 - 8, myY - 60, tw + 16, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, myXRef.current, myY - 44);
        ctx.textAlign = "start";
      }
    }

    frameRef.current = requestAnimationFrame(draw);
  }, [floor, myAvatar, myAction, status, onlineUsers]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) setFloor(1);
    if (diff < -50) setFloor(0);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = canvasW / rect.width;
    const clickX = (e.clientX - rect.left) * scaleX;
    myXRef.current = Math.max(50, Math.min(canvasW - 50, clickX));
  };

  if (!myAvatar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <p className="text-coffee-600">Загрузка...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      {/* навбар */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-2xl">☕</span>
            <span className="font-display text-xl font-bold text-coffee-900">OiC</span>
          </motion.a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-coffee-500">{myAvatar.name}</span>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[920px] mx-auto"
        >
          {/* Переключатель этажей */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setFloor(0)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                floor === 0
                  ? "bg-coffee-600 text-white shadow-md"
                  : "bg-white text-coffee-600 border border-coffee-200"
              }`}
            >
              🏦 Офис банка
            </button>
            <button
              onClick={() => setFloor(1)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                floor === 1
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-white text-red-600 border border-red-200"
              }`}
            >
              ☕ Кофейня
            </button>
          </div>

          {/* Canvas */}
          <AnimatePresence mode="wait">
            <motion.div
              key={floor}
              initial={{ opacity: 0, y: floor === 0 ? -30 : 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: floor === 0 ? 30 : -30 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-coffee-100 overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                width={canvasW}
                height={canvasH}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="w-full cursor-pointer"
                style={{ imageRendering: "auto" }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Кнопка "Заказать кофе" — только на этаже кофейни */}
          <AnimatePresence>
            {floor === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mt-3"
              >
                <motion.a
                  href="/menu"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-2xl shadow-lg flex items-center gap-2 text-base"
                >
                  <span className="text-xl">☕</span>
                  Заказать кофе
                </motion.a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Подсказка */}
          <p className="text-coffee-400 text-xs text-center mt-2">
            Нажми на офис чтобы переместить аватара • Свайпни для смены этажа
          </p>

          {/* Панель управления */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Статус */}
            <div className="bg-white rounded-2xl p-5 border border-coffee-100 shadow-sm">
              <h3 className="text-sm font-semibold text-coffee-800 mb-3">
                Статус присутствия
              </h3>
              <div className="flex gap-2">
                {(["working", "break", "away"] as Status[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      status === s
                        ? "text-white shadow-md"
                        : "bg-white text-coffee-700 border border-coffee-200"
                    }`}
                    style={
                      status === s ? { backgroundColor: STATUS_COLORS[s] } : undefined
                    }
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s] }}
                    />
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Онлайн */}
            <div className="bg-white rounded-2xl p-5 border border-coffee-100 shadow-sm">
              <h3 className="text-sm font-semibold text-coffee-800 mb-3">
                В офисе сейчас ({onlineUsers.length + 1})
              </h3>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-coffee-50 rounded-lg px-3 py-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  <span className="text-sm text-coffee-800 font-medium">
                    {myAvatar.name} (ты)
                  </span>
                </div>
                {onlineUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[u.status] }}
                    />
                    <span className="text-sm text-gray-700">{u.avatar.name}</span>
                  </div>
                ))}
                {onlineUsers.length === 0 && (
                  <p className="text-xs text-coffee-400">
                    Пока только ты. Поделись ссылкой!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
