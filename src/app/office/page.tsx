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
type Floor = 0 | 1; /* 0 = офис банка (верх), 1 = кофейня (низ) */
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
   ПАЛИТРЫ (дублируем из avatar)
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

const ACTIONS: AvatarAction[] = ["idle", "coffee", "monitor", "phone", "yawn"];

/* ═══════════════════════════════════════════
   МИНИ-РИСОВАЛКА АВАТАРА (упрощённая)
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
  const hairColor = cfg.skinColor <= 1 ? "#3B2410" : cfg.skinColor <= 3 ? "#1A0E06" : "#0A0503";

  /* тело */
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.ellipse(0, 28 * s, 18 * s, 14 * s, 0, Math.PI, 0, true);
  ctx.fill();

  /* шея */
  ctx.fillStyle = skin;
  ctx.fillRect(-4 * s, 12 * s, 8 * s, 8 * s);

  /* голова */
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20 * s, 21 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  /* уши */
  ctx.beginPath();
  ctx.ellipse(-18 * s, 2 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(18 * s, 2 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  /* причёска — упрощённая шапка */
  ctx.fillStyle = hairColor;
  const headTop = -21 * s;
  ctx.beginPath();
  ctx.ellipse(0, headTop + 12 * s, 19 * s, 14 * s, 0, Math.PI, 0, true);
  ctx.fill();

  if (cfg.gender === "female") {
    /* боковые пряди для женщин */
    ctx.fillRect(-19 * s, -5 * s, 5 * s, 18 * s);
    ctx.fillRect(14 * s, -5 * s, 5 * s, 18 * s);
  }

  /* глаза */
  const eyeY = -3 * s;
  for (const side of [-1, 1]) {
    const ex = side * 8 * s;
    if (cfg.mood === "sleepy" || action === "yawn") {
      ctx.strokeStyle = "#2A1810";
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(ex - 4 * s, eyeY);
      ctx.lineTo(ex + 4 * s, eyeY);
      ctx.stroke();
    } else if (cfg.mood === "cool") {
      ctx.fillStyle = "#1A1A1A";
      ctx.fillRect(ex - 5 * s, eyeY - 3 * s, 10 * s, 6 * s);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ex, eyeY, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2A1810";
      ctx.beginPath();
      ctx.arc(ex, eyeY, 2 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* рот */
  const my = 8 * s;
  ctx.strokeStyle = "#2A1810";
  ctx.lineWidth = 1.5 * s;
  if (action === "yawn") {
    ctx.fillStyle = "#2A1810";
    ctx.beginPath();
    ctx.ellipse(0, my, 5 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (action === "coffee") {
    ctx.beginPath();
    ctx.arc(0, my - 1 * s, 6 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, my - 2 * s, 6 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  /* предмет в руке */
  if (action === "coffee") {
    /* кружка кофе */
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(22 * s, 10 * s, 10 * s, 12 * s);
    ctx.fillStyle = "#8B5E3C";
    ctx.fillRect(23 * s, 11 * s, 8 * s, 5 * s);
    /* пар */
    ctx.strokeStyle = "rgba(200,200,200,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(25 * s, 8 * s);
    ctx.quadraticCurveTo(27 * s, 3 * s, 25 * s, -1 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(29 * s, 8 * s);
    ctx.quadraticCurveTo(31 * s, 4 * s, 29 * s, 0);
    ctx.stroke();
  } else if (action === "phone") {
    /* телефон у уха */
    ctx.fillStyle = "#333";
    ctx.fillRect(-25 * s, -12 * s, 6 * s, 14 * s);
  } else if (action === "monitor") {
    /* рука вперёд к монитору */
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(20 * s, 18 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ═══════════════════════════════════════════
   РИСОВАЛКА ОФИСА (верхний этаж)
   ═══════════════════════════════════════════ */
function drawBankOffice(ctx: CanvasRenderingContext2D, w: number, h: number) {
  /* пол */
  ctx.fillStyle = "#E8DCC8";
  ctx.fillRect(0, h - 60, w, 60);

  /* стена */
  const grad = ctx.createLinearGradient(0, 0, 0, h - 60);
  grad.addColorStop(0, "#F5F0E8");
  grad.addColorStop(1, "#EDE5D8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h - 60);

  /* окна */
  for (let i = 0; i < 3; i++) {
    const wx = 100 + i * 260;
    ctx.fillStyle = "#B8D8F0";
    ctx.fillRect(wx, 30, 80, 100);
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 3;
    ctx.strokeRect(wx, 30, 80, 100);
    /* перекрестие */
    ctx.beginPath();
    ctx.moveTo(wx + 40, 30);
    ctx.lineTo(wx + 40, 130);
    ctx.moveTo(wx, 80);
    ctx.lineTo(wx + 80, 80);
    ctx.stroke();
  }

  /* столы */
  for (let i = 0; i < 4; i++) {
    const dx = 60 + i * 200;
    const dy = h - 60;

    /* стол */
    ctx.fillStyle = "#C4A882";
    ctx.fillRect(dx, dy - 45, 120, 8);
    /* ножки */
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(dx + 5, dy - 37, 6, 37);
    ctx.fillRect(dx + 109, dy - 37, 6, 37);

    /* монитор */
    ctx.fillStyle = "#2A2A2A";
    ctx.fillRect(dx + 35, dy - 80, 50, 32);
    ctx.fillStyle = "#4488CC";
    ctx.fillRect(dx + 37, dy - 78, 46, 28);
    /* подставка */
    ctx.fillStyle = "#2A2A2A";
    ctx.fillRect(dx + 55, dy - 48, 10, 5);
    ctx.fillRect(dx + 48, dy - 44, 24, 3);

    /* клавиатура */
    ctx.fillStyle = "#555";
    ctx.fillRect(dx + 30, dy - 42, 40, 6);
  }

  /* растения */
  for (const px of [30, 770]) {
    const py = h - 60;
    /* горшок */
    ctx.fillStyle = "#B8755D";
    ctx.fillRect(px - 12, py - 30, 24, 30);
    /* земля */
    ctx.fillStyle = "#5D3A1A";
    ctx.fillRect(px - 10, py - 30, 20, 6);
    /* листья */
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath();
    ctx.ellipse(px, py - 50, 15, 20, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 10, py - 45, 12, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px - 8, py - 42, 10, 16, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /* вывеска */
  ctx.fillStyle = "#8B7355";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ОФИС БАНКА", w / 2, 22);
  ctx.textAlign = "start";
}

/* ═══════════════════════════════════════════
   РИСОВАЛКА КОФЕЙНИ (нижний этаж)
   ═══════════════════════════════════════════ */
function drawCoffeeShop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  /* красная стена */
  const grad = ctx.createLinearGradient(0, 0, 0, h - 60);
  grad.addColorStop(0, "#C0392B");
  grad.addColorStop(1, "#A93226");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h - 60);

  /* пол */
  ctx.fillStyle = "#4A3728";
  ctx.fillRect(0, h - 60, w, 60);

  /* плитка на полу */
  ctx.strokeStyle = "#5D4A3A";
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, h - 60);
    ctx.lineTo(i, h);
    ctx.stroke();
  }

  /* логотип Love is Coffee */
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(w / 2, 80, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LOVE IS", w / 2, 74);
  ctx.fillText("COFFEE ☕", w / 2, 92);

  /* зелёная стойка */
  ctx.fillStyle = "#2E7D32";
  ctx.fillRect(w / 2 - 150, h - 110, 300, 50);
  /* столешница */
  ctx.fillStyle = "#43A047";
  ctx.fillRect(w / 2 - 155, h - 115, 310, 10);

  /* кофемашина */
  ctx.fillStyle = "#555";
  ctx.fillRect(w / 2 + 80, h - 155, 40, 45);
  ctx.fillStyle = "#333";
  ctx.fillRect(w / 2 + 85, h - 150, 30, 20);
  /* кнопки */
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(w / 2 + 95, h - 125, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.arc(w / 2 + 108, h - 125, 4, 0, Math.PI * 2);
  ctx.fill();

  /* стаканы на стойке */
  for (let i = 0; i < 3; i++) {
    const cx2 = w / 2 - 100 + i * 50;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cx2, h - 130, 14, 18);
    ctx.fillStyle = "#8B5E3C";
    ctx.fillRect(cx2 + 1, h - 129, 12, 8);
  }

  /* полки на стене */
  for (const sy of [30, 60]) {
    ctx.fillStyle = "#8B5E3C";
    ctx.fillRect(50, sy, 180, 6);
    /* бутылки/банки */
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = ["#E8D5B7", "#C4956B", "#A67B5B", "#DDD", "#B8755D"][i];
      ctx.fillRect(55 + i * 34, sy - 22, 16, 22);
    }
  }

  /* столики для гостей */
  for (const tx of [w - 180, w - 80]) {
    ctx.fillStyle = "#8B5E3C";
    ctx.beginPath();
    ctx.arc(tx, h - 80, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6B4226";
    ctx.fillRect(tx - 4, h - 55, 8, 55);
  }

  /* вывеска */
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LOVE IS COFFEE", w / 2, 22);
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
  drawMiniAvatar(ctx, cfg, x, y + bobOff, 0.8, "idle", 0);

  /* имя */
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, x, y + 50);
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
  const canvasW = 840;
  const canvasH = 350;

  /* Загружаем аватар из localStorage */
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
    /* Если аватар не найден — дефолтный */
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

  /* Сохраняем аватар при создании на странице /avatar */
  useEffect(() => {
    if (!myAvatar) return;
    localStorage.setItem("oic_avatar", JSON.stringify(myAvatar));
  }, [myAvatar]);

  /* Регистрация в Realtime DB */
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

    return () => {
      // cleanup при unmount не удаляем — onDisconnect позаботится
    };
  }, [myAvatar, userId, status, floor, myAction]);

  /* Обновляем статус/этаж в RTDB */
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

  /* Слушаем онлайн-пользователей */
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
        /* Вернуть idle через 2-3 сек */
        setTimeout(() => setMyAction("idle"), 2000 + Math.random() * 1000);
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
    const bob = Math.sin(bobRef.current) * 2;

    ctx.clearRect(0, 0, canvasW, canvasH);

    /* Рисуем текущий этаж */
    if (floor === 0) {
      drawBankOffice(ctx, canvasW, canvasH);
    } else {
      drawCoffeeShop(ctx, canvasW, canvasH);

      /* NPC бариста: Виталий и Аслан */
      drawNPC(ctx, "Виталий", canvasW / 2 - 50, canvasH - 145, 0, 3, bob * 0.5);
      drawNPC(ctx, "Аслан", canvasW / 2 + 50, canvasH - 145, 2, 3, bob * 0.7);
    }

    /* Рисуем онлайн-пользователей на текущем этаже */
    onlineUsers
      .filter((u) => u.floor === floor)
      .forEach((u, i) => {
        const ux = 100 + (i * 150 + (u.x % 100));
        const uy = canvasH - 100;
        drawMiniAvatar(ctx, u.avatar, ux, uy, 0.7, u.action, bob * 0.6);

        /* имя и статус */
        ctx.fillStyle = STATUS_COLORS[u.status];
        ctx.beginPath();
        ctx.arc(ux + 18, uy - 30, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#333";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(u.avatar.name, ux, uy + 48);
        ctx.textAlign = "start";
      });

    /* Рисуем моего аватара */
    if (myAvatar) {
      const myY = canvasH - 100;
      drawMiniAvatar(ctx, myAvatar, myXRef.current, myY, 0.85, myAction, bob);

      /* имя */
      ctx.fillStyle = "#333";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(myAvatar.name, myXRef.current, myY + 50);
      ctx.textAlign = "start";

      /* индикатор статуса */
      ctx.fillStyle = STATUS_COLORS[status];
      ctx.beginPath();
      ctx.arc(myXRef.current + 22, myY - 32, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFF";
      ctx.lineWidth = 1.5;
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
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(actionLabels[myAction], myXRef.current, myY + 62);
        ctx.textAlign = "start";
      }
    }

    frameRef.current = requestAnimationFrame(draw);
  }, [floor, myAvatar, myAction, status, onlineUsers]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  /* Свайп для переключения этажей */
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) setFloor(1); /* свайп вверх — вниз этаж (кофейня) */
    if (diff < -50) setFloor(0); /* свайп вниз — верхний этаж (офис) */
  };

  /* Клик на canvas — перемещение аватара */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    myXRef.current = Math.max(40, Math.min(canvasW - 40, clickX));
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
            <span className="text-sm text-coffee-500">
              {myAvatar.name}
            </span>
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
          className="max-w-[480px] mx-auto"
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
                      status === s
                        ? { backgroundColor: STATUS_COLORS[s] }
                        : undefined
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
                {/* Я */}
                <div className="flex items-center gap-2 bg-coffee-50 rounded-lg px-3 py-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  <span className="text-sm text-coffee-800 font-medium">
                    {myAvatar.name} (ты)
                  </span>
                </div>
                {/* Другие */}
                {onlineUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[u.status] }}
                    />
                    <span className="text-sm text-gray-700">
                      {u.avatar.name}
                    </span>
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
