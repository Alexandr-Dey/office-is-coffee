"use client";

import { useEffect, type ReactNode } from "react";
import { initMixpanel, trackEvent } from "@/lib/mixpanel";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initMixpanel();
    trackEvent("app_loaded");
  }, []);

  return <>{children}</>;
}
