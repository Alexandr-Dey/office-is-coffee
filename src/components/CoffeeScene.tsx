"use client";

import { BackgroundLayer } from "./scene/layers/BackgroundLayer";
import { SpritesLayer } from "./scene/layers/SpritesLayer";
import { FurnitureLayer } from "./scene/layers/FurnitureLayer";
import { ObjectsLayer } from "./scene/layers/ObjectsLayer";
import { EffectsLayer } from "./scene/layers/EffectsLayer";

export type BaristaState = "idle" | "pending" | "accepted" | "ready";

interface CoffeeSceneProps {
  orderStatus?: BaristaState;
  streakDays?: number;
  lastOrderDate?: string | null;
  orderCount?: number;
}

export default function CoffeeScene({
  orderStatus,
  streakDays,
  lastOrderDate,
}: CoffeeSceneProps) {
  const status = orderStatus ?? "idle";
  const activeOrder = status !== "idle" ? { status } : null;

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
          <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#fff8e7" stopOpacity="0" />
        </linearGradient>
      </defs>

      <BackgroundLayer />
      {/* Baristas render BEFORE counter so counter hides their lower body */}
      <SpritesLayer
        activeOrder={activeOrder}
        streakDays={streakDays ?? 0}
        lastOrderDate={lastOrderDate ?? null}
      />
      <FurnitureLayer />
      <ObjectsLayer orderStatus={status} />
      <EffectsLayer orderStatus={status} />

      {/* Warm ambient overlay */}
      <rect x="0" y="0" width="800" height="600" fill="url(#warmLight)" />
    </svg>
  );
}
