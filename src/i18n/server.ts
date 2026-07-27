import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export async function getServerLocale() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;

  if (isLocale(cookieValue)) {
    return cookieValue;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", user.id)
        .maybeSingle();

      if (isLocale(profile?.locale)) {
        return profile.locale;
      }
    }
  } catch {
    // Fall back to default locale when auth or profile lookup fails.
  }

  return defaultLocale;
}
