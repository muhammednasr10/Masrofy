"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { Profile } from "@/lib/types/database";

type AdminAccountsPanelProps = {
  accounts: Profile[];
  error: string | null;
};

export default function AdminAccountsPanel({ accounts, error }: AdminAccountsPanelProps) {
  const t = useTranslations();
  const { formatDate } = useFormat();

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{t("admin.accountsTitle")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("admin.accountsDesc")}</p>

      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {accounts.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {t("admin.accountsEmpty")}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {accounts.map((account) => (
            <article
              key={account.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">
                    {account.full_name?.trim() || t("admin.accountsUnnamed")}
                  </p>
                  {account.is_admin ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      {t("admin.accountsAdminBadge")}
                    </span>
                  ) : null}
                  {account.onboarding_completed ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      {t("admin.accountsOnboardingDone")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {t("admin.accountsOnboardingPending")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{account.email ?? "—"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {t("admin.accountsMeta", {
                    currency: account.currency,
                    date: formatDate(account.created_at),
                  })}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
