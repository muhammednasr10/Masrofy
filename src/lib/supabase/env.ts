export function normalizeSupabaseUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return "";
  }

  const trimmed = rawUrl.trim().replace(/\/+$/, "");

  return trimmed.replace(/\/rest\/v1$/i, "");
}

export function getSupabaseUrl() {
  const normalized = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!normalized) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing. Use your project URL like https://xyz.supabase.co (without /rest/v1).",
    );
  }

  return normalized;
}

export function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  return key;
}

export function isMisconfiguredSupabaseUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return false;
  }

  return /\/rest\/v1\/?$/i.test(rawUrl.trim());
}

export function getSupabaseUrlValidationError(rawUrl: string | undefined) {
  const normalized = normalizeSupabaseUrl(rawUrl);

  if (!normalized) {
    return "NEXT_PUBLIC_SUPABASE_URL غير مُعدّ على Vercel.";
  }

  if (isMisconfiguredSupabaseUrl(rawUrl)) {
    return "NEXT_PUBLIC_SUPABASE_URL يحتوي على /rest/v1 — استخدم رابط المشروع فقط مثل https://xxx.supabase.co";
  }

  let hostname = "";

  try {
    hostname = new URL(normalized).hostname.toLowerCase();
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL غير صالح.";
  }

  if (!hostname.endsWith(".supabase.co")) {
    return "NEXT_PUBLIC_SUPABASE_URL يجب أن يكون رابط Supabase (https://xxx.supabase.co) وليس رابط Vercel.";
  }

  return null;
}
