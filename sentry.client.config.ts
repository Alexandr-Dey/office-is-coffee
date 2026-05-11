import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: isProd ? "production" : "development",
  // 100% перформанс трейсов в проде быстро упирался бы в free-tier quota.
  // 10% для прода (~достаточно для перцентилей), полный сэмпл для dev.
  tracesSampleRate: isProd ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
  beforeSend(event) {
    // Не отправлять если DSN не задан
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
    return event;
  },
});
