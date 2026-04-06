"use client";

import { getFirebaseDb } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

/**
 * Request push notification permission and save FCM token.
 * Requires firebase-messaging to be configured with VAPID key.
 * Falls back gracefully if FCM is not set up.
 */
export async function requestPushPermission(uid: string): Promise<boolean> {
  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    // Dynamic import to avoid SSR issues
    const { getMessaging, getToken } = await import("firebase/messaging");
    const { initializeApp, getApps } = await import("firebase/app");

    let app;
    if (getApps().length) {
      app = getApps()[0];
    } else {
      return false;
    }

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("FCM VAPID key not configured");
      return false;
    }

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      await setDoc(doc(getFirebaseDb(), "push_tokens", uid), {
        token,
        platform: /iPhone|iPad/.test(navigator.userAgent) ? "ios" : "android/web",
        createdAt: new Date().toISOString(),
      });
      return true;
    }
  } catch (err) {
    console.warn("FCM not available:", err);
  }

  return false;
}
