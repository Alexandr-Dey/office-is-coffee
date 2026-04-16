"use client";

import { useState, useEffect } from "react";
import { BackgroundLayer } from "./scene/layers/BackgroundLayer";
import { SpritesLayer } from "./scene/layers/SpritesLayer";
import { FurnitureLayer } from "./scene/layers/FurnitureLayer";
import { ObjectsLayer } from "./scene/layers/ObjectsLayer";
import { EffectsLayer } from "./scene/layers/EffectsLayer";
import { getTimeOfDay, type TimeOfDay } from "./scene/behaviors/sceneTime";

export type BaristaState = "idle" | "pending" | "accepted" | "ready";

interface CoffeeSceneProps {
  orderStatus?: BaristaState;
  streakDays?: number;
  lastOrderDate?: string | null;
  orderCount?: number;
  cafeOpen?: boolean;
}

export default function CoffeeScene({
  orderStatus,
  streakDays,
  lastOrderDate,
  cafeOpen = true,
}: CoffeeSceneProps) {
  const status = orderStatus ?? "idle";
  const activeOrder = status !== "idle" ? { status } : null;
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");

  useEffect(() => {
    setTimeOfDay(getTimeOfDay());
    const iv = setInterval(() => setTimeOfDay(getTimeOfDay()), 60000);
    return () => clearInterval(iv);
  }, []);

  // Baristas visible only when cafe is open
  const showBaristas = cafeOpen;

  // Dim overlay: strong when closed, subtle when night but open
  const isNight = timeOfDay === "night" || timeOfDay === "dusk";
  const dimOpacity = !cafeOpen ? 0.45 : isNight ? 0.15 : 0;

  return (
    <svg
      viewBox="0 0 800 600"
      className="w-full rounded-2xl cursor-pointer"
      style={{ shapeRendering: "crispEdges" }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="counterTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d9e5a" />
          <stop offset="100%" stopColor="#1a7a44" />
        </linearGradient>
        <linearGradient id="counterFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a7a44" />
          <stop offset="100%" stopColor="#145a32" />
        </linearGradient>
        <linearGradient id="machineBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8d8d8" />
          <stop offset="50%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#a8a8a8" />
        </linearGradient>
        <linearGradient id="warmLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8e7" stopOpacity={cafeOpen ? 0.12 : 0} />
          <stop offset="100%" stopColor="#fff8e7" stopOpacity="0" />
        </linearGradient>
      </defs>

      <BackgroundLayer timeOfDay={timeOfDay} />
      {showBaristas && (
        <SpritesLayer
          activeOrder={activeOrder}
          streakDays={streakDays ?? 0}
          lastOrderDate={lastOrderDate ?? null}
        />
      )}
      <FurnitureLayer />
      <ObjectsLayer orderStatus={status} />
      <EffectsLayer orderStatus={status} />

      {/* Warm ambient overlay */}
      <rect x="0" y="0" width="800" height="600" fill="url(#warmLight)" style={{ pointerEvents: "none" }} />

      {/* Dim overlay when closed or night */}
      {dimOpacity > 0 && (
        <rect
          x="0" y="0" width="800" height="600"
          fill="#0a0a1a"
          opacity={dimOpacity}
          style={{ pointerEvents: "none", transition: "opacity 2s ease" }}
        />
      )}

      {/* Closed sign */}
      {!cafeOpen && (
        <g style={{ pointerEvents: "none" }}>
          <rect x="300" y="260" width="200" height="60" rx="12" fill="rgba(0,0,0,0.7)" />
          <text x="400" y="297" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">ЗАКРЫТО</text>
        </g>
      )}
    </svg>
  );
}
