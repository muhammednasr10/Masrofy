const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: import.meta.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPPORT_WHATSAPP: import.meta.env.NEXT_PUBLIC_SUPPORT_WHATSAPP,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: import.meta.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NEXT_PUBLIC_SENTRY_DSN: import.meta.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_VERCEL_ENV: import.meta.env.NEXT_PUBLIC_VERCEL_ENV,
} as const;

export type PublicEnvName = keyof typeof publicEnv;

function readProcessEnv(name: string) {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function readPublicEnv(name: PublicEnvName) {
  return readProcessEnv(name) ?? publicEnv[name];
}
