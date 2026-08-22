import { getSupabaseUrlValidationError } from "@/lib/supabase/env";

const authErrorMessages: Record<string, string> = {
  "Invalid login credentials": "البريد أو كلمة المرور غير صحيحة.",
  "Email not confirmed": "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.",
};

export function translateAuthError(message: string) {
  if (authErrorMessages[message]) {
    return authErrorMessages[message];
  }

  if (/unexpected token '<'|<!doctype/i.test(message)) {
    return "خطأ في إعدادات Supabase على Vercel: تأكد أن NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co (بدون /rest/v1) وليس رابط الموقع.";
  }

  if (/invalid path specified in request url/i.test(message)) {
    return "خطأ في إعدادات Supabase: تأكد أن NEXT_PUBLIC_SUPABASE_URL هو رابط المشروع فقط (https://xxx.supabase.co) بدون /rest/v1.";
  }

  if (/typeerror|failed to fetch|networkerror|network request failed|load failed|fetch failed|econnrefused|enotfound|etimedout|socket hang up/i.test(message)) {
    return "تعذّر الاتصال بخادم Supabase. تحقق من الإنترنت، وأغلق VPN إن وُجد، وتأكد أن المشروع غير موقوف في Supabase Dashboard، ثم أعد تشغيل السيرفر: npm run dev:clean";
  }

  return message;
}

export function getSupabaseConfigHint() {
  return getSupabaseUrlValidationError(process.env.NEXT_PUBLIC_SUPABASE_URL);
}
