"use client";

import { AnimatePresence } from "framer-motion";
import { OrderBubble } from "../effects/OrderBubble";
import { Steam } from "../effects/Steam";

interface Props {
  orderStatus: string;
}

export function EffectsLayer({ orderStatus }: Props) {
  return (
    <g id="effects">
      <Steam active={orderStatus === "accepted"} />
      <AnimatePresence>
        {orderStatus !== "idle" && <OrderBubble status={orderStatus} />}
      </AnimatePresence>
    </g>
  );
}
