"use client";

import { getFirebaseDb } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

/** Shared SW registration (reused across calls) */
let swRegPromise: Promise<ServiceWorkerRegistration> | null = null;

function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  if (swRegPromise) return swRegPromise;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };
  const params = new URLSearchParams(config).toString();

  swRegPromise = navigator.serviceWorker
    .register(`/firebase-messaging-sw.js?${params}`)
    .catch((err) => {
      swRegPromise = null; // allow retry on next call
      throw err;
    });

  return swRegPromise;
}

/**
 * Save FCM token to Firestore for a given user.
 * Used internally by both requestPushPermission and ensurePushToken.
 */
async function saveFcmToken(uid: string, attempt = 1): Promise<boolean> {
  try {
    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
    const { getApps } = await import("firebase/app");

    if (!getApps().length) return false;
    const app = getApps()[0];

    const swReg = await getOrRegisterSW();

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("[Push] VAPID key not configured");
      return false;
    }

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
    if (!token) {
      console.warn("[Push] getToken returned empty");
      return false;
    }

    await setDoc(doc(getFirebaseDb(), "push_tokens", uid), {
      token,
      platform: /iPhone|iPad/.test(navigator.userAgent) ? "ios" : "android/web",
      updatedAt: new Date().toISOString(),
    });

    console.log("[Push] Token saved for", uid.slice(0, 8));

    // Handle foreground messages
    onMessage(messaging, () => {});

    return true;
  } catch (err) {
    console.error(`[Push] saveFcmToken attempt ${attempt} failed:`, err);
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return saveFcmToken(uid, attempt + 1);
    }
    return false;
  }
}

/**
 * Request push permission from user (shows browser prompt if needed),
 * register SW, get FCM token, and save to Firestore.
 * Called from onboarding, profile, and order flows.
 */
export async function requestPushPermission(uid: string): Promise<boolean> {
  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    return await saveFcmToken(uid);
  } catch (err) {
    console.warn("FCM registration failed:", err);
    return false;
  }
}

/**
 * Silently ensure push token is fresh in Firestore.
 * Does NOT show permission prompt — only works if permission is already granted.
 * Safe to call on every page load for logged-in users.
 */
export async function ensurePushToken(uid: string): Promise<void> {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    await saveFcmToken(uid);
  } catch {
    // Silent fail — will retry on next page load
  }
}

/**
 * Track push notification open via URL parameter.
 * Called on app load — checks for ?pushId=XXX in URL.
 */
export async function trackPushOpened(): Promise<void> {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const pushId = params.get("pushId");
  if (!pushId) return;

  // Remove param from URL
  params.delete("pushId");
  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  window.history.replaceState({}, "", newUrl);

  // Call Cloud Function
  try {
    const { getFunctions, httpsCallable } = await import("firebase/functions");
    const { getApps } = await import("firebase/app");
    if (!getApps().length) return;
    const functions = getFunctions(getApps()[0]);
    const fn = httpsCallable(functions, "trackPushOpened");
    await fn({ pushLogId: pushId });
    console.log("trackPushOpened: sent for", pushId);
  } catch (e) {
    console.warn("trackPushOpened failed:", e);
  }
}
