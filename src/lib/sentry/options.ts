import { readPublicEnv } from "@/lib/public-env";

function readNodeEnv(name: string) {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  return process.env[name];
}

export function getSentryDsn() {
  return readPublicEnv("NEXT_PUBLIC_SENTRY_DSN") || readNodeEnv("SENTRY_DSN");
}

export function getSentryEnvironment() {
  return readPublicEnv("NEXT_PUBLIC_VERCEL_ENV") ?? readNodeEnv("VERCEL_ENV") ?? import.meta.env.MODE;
}

export function isSentryEnabled() {
  return Boolean(getSentryDsn()) && import.meta.env.PROD;
}

export function createSentryOptions(
  overrides: Record<string, unknown> = {},
) {
  return {
    dsn: getSentryDsn(),
    enabled: isSentryEnabled(),
    environment: getSentryEnvironment(),
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    ...overrides,
  };
}
