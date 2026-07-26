import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
  message = "يجب تسجيل الدخول أولاً.",
): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(message);
  }

  return user;
}
