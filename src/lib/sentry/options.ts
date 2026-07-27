const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

export function getSentryEnvironment() {
  return process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV;
}

export function isSentryEnabled() {
  return Boolean(dsn) && process.env.NODE_ENV === "production";
}

export function createSentryOptions(
  overrides: Record<string, unknown> = {},
) {
  return {
    dsn,
    enabled: isSentryEnabled(),
    environment: getSentryEnvironment(),
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    ...overrides,
  };
}
