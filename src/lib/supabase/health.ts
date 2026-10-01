import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseUrlValidationError,
  normalizeSupabaseUrl,
} from "@/lib/supabase/env";
import { readPublicEnv } from "@/lib/public-env";

export type SupabaseHealth = {
  connected: boolean;
  configuredHost: string | null;
  message: string;
};

function getConfiguredSupabaseHost() {
  const normalized = normalizeSupabaseUrl(readPublicEnv("NEXT_PUBLIC_SUPABASE_URL"));

  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).hostname;
  } catch {
    return "invalid-url";
  }
}

export async function checkSupabaseHealth(supabase: SupabaseClient): Promise<SupabaseHealth> {
  const configuredHost = getConfiguredSupabaseHost();
  const configError = getSupabaseUrlValidationError(readPublicEnv("NEXT_PUBLIC_SUPABASE_URL"));

  if (configError) {
    return { connected: false, configuredHost, message: configError };
  }

  try {
    const checks: Array<{ table: "wallets" | "friendships" | "categories"; missing: string }> = [
      {
        table: "wallets",
        missing: "Supabase connected, but wallets table is missing. Run supabase/migrations/002_wallets.sql first.",
      },
      {
        table: "friendships",
        missing:
          "Supabase connected, but friendships table is missing. Run supabase/migrations/003_friendships.sql first.",
      },
      {
        table: "categories",
        missing: "Supabase connected, but tables are missing. Run supabase/migrations/001_init.sql first.",
      },
    ];

    for (const check of checks) {
      const { error } = await supabase.from(check.table).select("id").limit(1);

      if (error) {
        return {
          connected: false,
          configuredHost,
          message:
            error.code === "PGRST125"
              ? "Invalid Supabase URL path. Set NEXT_PUBLIC_SUPABASE_URL to https://your-project.supabase.co without /rest/v1."
              : error.code === "PGRST205"
                ? check.missing
                : error.message,
        };
      }
    }

    return {
      connected: true,
      configuredHost,
      message: "Supabase is connected and Masrofy schema is ready.",
    };
  } catch (connectionError) {
    const message =
      connectionError instanceof Error ? connectionError.message : String(connectionError);

    return {
      connected: false,
      configuredHost,
      message: /fetch failed|failed to fetch|enotfound|econnrefused|etimedout/i.test(message)
        ? `تعذّر الوصول إلى Supabase (${configuredHost ?? "unknown"}). تحقق من الإنترنت أو جدار الحماية أو VPN.`
        : message,
    };
  }
}
