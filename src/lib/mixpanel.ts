// Mixpanel отключён — стабы. Удалить когда подключим аналитику.
// Все вызовы trackEvent/identifyUser безопасно ничего не делают.

export const initMixpanel = (): void => {};

export const trackEvent = (_event: string, _properties?: Record<string, unknown>): void => {};

export const identifyUser = (_userId: string, _traits?: Record<string, unknown>): void => {};
