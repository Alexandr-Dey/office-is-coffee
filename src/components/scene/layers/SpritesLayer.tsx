"use client";

import { BaristaVitaliy } from "../characters/BaristaVitaliy";
import { BaristaAslan } from "../characters/BaristaAslan";

interface Props {
  activeOrder: { status: string } | null;
  streakDays: number;
  lastOrderDate: string | null;
}

export function SpritesLayer({ activeOrder, streakDays, lastOrderDate }: Props) {
  const orderStatus = activeOrder?.status ?? "idle";

  return (
    <g id="sprites">
      <BaristaVitaliy
        orderStatus={orderStatus}
        streakDays={streakDays}
        lastOrderDate={lastOrderDate}
      />
      <BaristaAslan orderStatus={orderStatus} />
    </g>
  );
}
