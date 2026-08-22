import type { CategorySuggestion, Profile } from "@/lib/types/database";

type AuthorFields = Pick<Profile, "full_name" | "email"> | null | undefined;

export function formatProfileLabel(
  profile: AuthorFields,
  fallback = "",
): string {
  const name = profile?.full_name?.trim();
  const email = profile?.email?.trim();

  if (name && email) {
    return `${name} (${email})`;
  }

  if (name) {
    return name;
  }

  if (email) {
    return email;
  }

  return fallback;
}

export type CategorySuggestionRow = CategorySuggestion & {
  author_name?: string | null;
  author_email?: string | null;
};

export function normalizeCategorySuggestion(row: CategorySuggestionRow): CategorySuggestion {
  return {
    ...row,
    profiles: {
      full_name: row.author_name ?? row.profiles?.full_name ?? null,
      email: row.author_email ?? row.profiles?.email ?? null,
    },
  };
}

export async function loadPendingCategorySuggestions(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
): Promise<CategorySuggestion[]> {
  const { data: rpcRows, error: rpcError } = await supabase.rpc(
    "admin_list_pending_category_suggestions",
  );

  if (!rpcError && rpcRows) {
    return (rpcRows as CategorySuggestionRow[]).map(normalizeCategorySuggestion);
  }

  const { data: suggestionRows } = await supabase
    .from("category_suggestions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const rows = (suggestionRows ?? []) as CategorySuggestion[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];

  if (userIds.length === 0) {
    return rows;
  }

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileById = new Map(
    (profileRows ?? []).map((profile) => [
      profile.id,
      { full_name: profile.full_name, email: profile.email },
    ]),
  );

  return rows.map((row) => ({
    ...row,
    profiles: profileById.get(row.user_id) ?? null,
  }));
}
