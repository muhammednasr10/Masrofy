import { createClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl } from "@/lib/supabase/site-url";

export async function POST(request: Request) {
  let email = "";

  try {
    const body = (await request.json()) as { email?: string };
    email = body.email?.trim() ?? "";
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!email) {
    return Response.json({ error: "missing_email" }, { status: 400 });
  }

  const supabase = await createClient();
  const redirectTo = getAuthCallbackUrl("/reset-password");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true, redirectTo });
}
