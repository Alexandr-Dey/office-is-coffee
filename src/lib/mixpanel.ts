import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export const initMixpanel = () => {
  if (MIXPANEL_TOKEN && typeof window !== "undefined") {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === "development",
      track_pageview: "url-with-path",
      persistence: "localStorage",
    });
  }
};

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && MIXPANEL_TOKEN) {
    mixpanel.track(event, properties);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && MIXPANEL_TOKEN) {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  }
};

export default mixpanel;
