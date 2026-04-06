"use client";

import { getFirebaseDb } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

/**
 * Register service worker with Firebase config passed as query params,
 * request push permission, and save FCM token.
 */
export async function requestPushPermission(uid: string): Promise<boolean> {
  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
    const { getApps } = await import("firebase/app");

    if (!getApps().length) return false;
    const app = getApps()[0];

    // Register SW with firebase config as query params
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    };
    const params = new URLSearchParams(config).toString();
    const swReg = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${params}`
    );

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("FCM VAPID key not configured");
      return false;
    }

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
    if (token) {
      await setDoc(doc(getFirebaseDb(), "push_tokens", uid), {
        token,
        platform: /iPhone|iPad/.test(navigator.userAgent) ? "ios" : "android/web",
        createdAt: new Date().toISOString(),
      });

      // Handle foreground messages
      onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {};
        if (title && Notification.permission === "granted") {
          new Notification(title, {
            body: body || "",
            icon: "/icon-192.png",
          });
        }
      });

      return true;
    }
  } catch (err) {
    console.warn("FCM not available:", err);
  }

  return false;
}
