import { loadHeaderAlerts } from "@/lib/alerts";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale");
  const locale: Locale = localeParam === "en" ? "en" : "ar";

  const alerts = await loadHeaderAlerts(supabase, user?.id, locale);

  return Response.json({ alerts });
}
