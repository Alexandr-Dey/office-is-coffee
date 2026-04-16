"use client";

import { useEffect } from "react";

export default function PushTracker() {
  useEffect(() => {
    import("@/lib/push").then(({ trackPushOpened }) => {
      trackPushOpened().catch(() => {});
    });
  }, []);

  return null;
}
