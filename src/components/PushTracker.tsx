"use client";

import { useEffect } from "react";
import { initMixpanel } from "@/lib/mixpanel";

export default function PushTracker() {
  useEffect(() => {
    initMixpanel(); // прогрев SDK для последующих trackEvent
    import("@/lib/push").then(({ trackPushOpened }) => {
      trackPushOpened().catch(() => {});
    });
  }, []);

  return null;
}
