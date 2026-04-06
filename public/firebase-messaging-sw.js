/* Firebase Messaging Service Worker */
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase config is injected at runtime via query params from push.ts registration
// Fallback: read from self location search params
const urlParams = new URL(self.location.href).searchParams;

firebase.initializeApp({
  apiKey: urlParams.get("apiKey") || "",
  authDomain: urlParams.get("authDomain") || "",
  projectId: urlParams.get("projectId") || "",
  storageBucket: urlParams.get("storageBucket") || "",
  messagingSenderId: urlParams.get("messagingSenderId") || "",
  appId: urlParams.get("appId") || "",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, {
      body: body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: payload.data || {},
    });
  }
});

// Handle notification click — open correct page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let url = "/menu";
  if (data.type === "order_ready" && data.orderId) {
    url = `/order/${data.orderId}`;
  } else if (data.type === "deposit") {
    url = "/profile";
  } else if (data.type === "cafe_open") {
    url = "/menu";
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
