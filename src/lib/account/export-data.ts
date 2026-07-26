import type { SupabaseClient } from "@supabase/supabase-js";

const EXPORT_TABLES = [
  "profiles",
  "categories",
  "wallets",
  "transactions",
  "recurring_transactions",
  "savings_goals",
  "investments",
  "investment_profit_entries",
  "investment_updates",
  "monthly_plans",
  "plan_items",
  "annual_plan_templates",
  "annual_plan_template_items",
  "wallet_reconciliations",
  "friendships",
  "wallet_transfers",
  "internal_wallet_transfers",
  "transaction_attachments",
] as const;

export type AccountExportPayload = {
  exportedAt: string;
  userId: string;
  email: string | null;
  data: Record<string, unknown[]>;
};

export async function buildAccountExport(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
): Promise<AccountExportPayload> {
  const data: Record<string, unknown[]> = {};

  await Promise.all(
    EXPORT_TABLES.map(async (table) => {
      const query = supabase.from(table).select("*");

      if (table === "profiles") {
        const { data: rows, error } = await query.eq("id", userId);
        if (error) {
          throw error;
        }
        data[table] = rows ?? [];
        return;
      }

      if (table === "wallet_transfers") {
        const { data: rows, error } = await query.or(
          `sender_id.eq.${userId},receiver_id.eq.${userId}`,
        );
        if (error) {
          throw error;
        }
        data[table] = rows ?? [];
        return;
      }

      if (table === "friendships") {
        const { data: rows, error } = await query.or(
          `requester_id.eq.${userId},addressee_id.eq.${userId}`,
        );
        if (error) {
          throw error;
        }
        data[table] = rows ?? [];
        return;
      }

      const { data: rows, error } = await query.eq("user_id", userId);
      if (error) {
        throw error;
      }
      data[table] = rows ?? [];
    }),
  );

  return {
    exportedAt: new Date().toISOString(),
    userId,
    email,
    data,
  };
}

export function downloadAccountExport(payload: AccountExportPayload) {
  const fileName = `masrofy-export-${payload.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
