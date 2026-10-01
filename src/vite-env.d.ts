/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly NEXT_PUBLIC_SITE_URL?: string;
  readonly NEXT_PUBLIC_SUPPORT_WHATSAPP?: string;
  readonly NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
  readonly NEXT_PUBLIC_SENTRY_DSN?: string;
  readonly NEXT_PUBLIC_VERCEL_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
