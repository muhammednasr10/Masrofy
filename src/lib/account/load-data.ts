import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Wallet } from "@/lib/types/database";

export type AccountStats = {
  categoriesCount: number;
  transactionsCount: number;
  walletsCount: number;
};

export type AccountPageData = {
  email: string;
  emailVerified: boolean;
  fullName: string;
  currency: string;
  defaultWalletId: string;
  wallets: Wallet[];
  createdAt: string | null;
  stats: AccountStats;
};

export async function loadAccountPageData(
  supabase: SupabaseClient,
): Promise<AccountPageData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [
    { data: profile },
    { count: categoriesCount },
    { count: transactionsCount },
    { count: walletsCount },
    { data: walletRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase.from("wallets").select("*", { count: "exact", head: true }),
    supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
  ]);

  const typedProfile = profile as Profile | null;
  const typedWallets = (walletRows ?? []) as Wallet[];

  return {
    email: user.email ?? "",
    emailVerified: Boolean(user.email_confirmed_at),
    fullName: typedProfile?.full_name ?? user.user_metadata?.full_name ?? "",
    currency: typedProfile?.currency ?? "EGP",
    defaultWalletId:
      typedProfile?.default_wallet_id ??
      typedWallets.find((wallet) => wallet.is_default)?.id ??
      typedWallets[0]?.id ??
      "",
    wallets: typedWallets,
    createdAt: user.created_at ?? null,
    stats: {
      categoriesCount: categoriesCount ?? 0,
      transactionsCount: transactionsCount ?? 0,
      walletsCount: walletsCount ?? 0,
    },
  };
}

export async function saveAccountProfile(
  supabase: SupabaseClient,
  params: {
    fullName: string;
    currency: string;
    defaultWalletId: string;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "يجب تسجيل الدخول أولاً." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: params.fullName.trim() || null,
      currency: params.currency,
      default_wallet_id: params.defaultWalletId || null,
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  if (params.defaultWalletId) {
    await supabase.from("wallets").update({ is_default: false }).eq("user_id", user.id);
    await supabase
      .from("wallets")
      .update({ is_default: true })
      .eq("id", params.defaultWalletId);
  }

  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { full_name: params.fullName.trim() },
  });

  if (authUpdateError) {
    return { error: authUpdateError.message };
  }

  return { message: "تم حفظ بيانات الحساب بنجاح." };
}
