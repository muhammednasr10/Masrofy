import type { SupabaseClient } from "@supabase/supabase-js";

export type DependentWallet = {
  id: string;
  owner_id: string;
  owner_name: string;
  name: string;
  icon: string;
  color: string;
  wallet_type: string;
  parent_wallet_id: string | null;
  balance: number;
};

export async function loadDependentWallets(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("get_dependent_wallets");

  if (error) {
    const missing =
      error.code === "42883" ||
      error.code === "PGRST202" ||
      error.message.includes("get_dependent_wallets");

    return {
      wallets: [] as DependentWallet[],
      error: missing
        ? "ظهور محافظ الحساب التابع محتاج تطبيق ملف الهجرة 031."
        : error.message,
    };
  }

  return {
    wallets: ((data ?? []) as DependentWallet[]).map((wallet) => ({
      ...wallet,
      balance: Number(wallet.balance),
    })),
    error: null,
  };
}
