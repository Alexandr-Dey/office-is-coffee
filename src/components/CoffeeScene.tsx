"use client";

import { BackgroundLayer } from "./scene/layers/BackgroundLayer";
import { FurnitureLayer } from "./scene/layers/FurnitureLayer";
import { ObjectsLayer } from "./scene/layers/ObjectsLayer";
import { SpritesLayer } from "./scene/layers/SpritesLayer";
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
      <BackgroundLayer />
      <FurnitureLayer />
      <ObjectsLayer orderStatus={status} />
      <SpritesLayer
        activeOrder={activeOrder}
        streakDays={streakDays ?? 0}
        lastOrderDate={lastOrderDate ?? null}
      />
      <EffectsLayer orderStatus={status} />
    </svg>
  );
}
