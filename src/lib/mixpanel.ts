import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
let initialized = false;

export const initMixpanel = () => {
  if (MIXPANEL_TOKEN && typeof window !== "undefined" && !initialized) {
    try {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV === "development",
        track_pageview: "url-with-path",
        persistence: "localStorage",
      });
      initialized = true;
    } catch {
      // Mixpanel init failed silently
    }
  }
};

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  try {
    if (typeof window === "undefined") return;
    if (!initialized) initMixpanel();
    if (initialized) {
      mixpanel.track(event, properties);
    }
  } catch {
    // Mixpanel tracking failed silently — never crash the app
  }
};

export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  try {
    if (typeof window === "undefined") return;
    if (!initialized) initMixpanel();
    if (initialized) {
      mixpanel.identify(userId);
      if (traits) {
        mixpanel.people.set(traits);
      }
    }
  } catch {
    // Silent fail
  }
};

export default mixpanel;
