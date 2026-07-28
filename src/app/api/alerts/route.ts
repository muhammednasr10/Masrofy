import { loadHeaderAlerts } from "@/lib/alerts";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const alerts = await loadHeaderAlerts(supabase, user?.id);

  return Response.json({ alerts });
}
