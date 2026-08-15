"use client";

import { currencyOptions } from "@/lib/constants/currency-options";
import type { Wallet } from "@/lib/types/database";
import WalletSelect from "@/components/wallets/WalletSelect";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import MonthStartDayField from "@/components/account/MonthStartDayField";

type AccountProfileFormProps = {
  fullName: string;
  email: string;
  defaultWalletId: string;
  currency: string;
  wallets: Wallet[];
  createdAt: string | null;
  saving: boolean;
  error: string | null;
  message: string | null;
  monthStartDay: number;
  onFullNameChange: (value: string) => void;
  onDefaultWalletChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onMonthStartDayChange: (value: number) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignOut: () => void;
};

export default function AccountProfileForm({
  fullName,
  email,
  defaultWalletId,
  currency,
  wallets,
  createdAt,
  saving,
  error,
  message,
  monthStartDay,
  onFullNameChange,
  onDefaultWalletChange,
  onCurrencyChange,
  onMonthStartDayChange,
  onSubmit,
  onSignOut,
}: AccountProfileFormProps) {
  const t = useTranslations();
  const { formatDate } = useFormat();

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{t("account.profileTitle")}</h3>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">{t("auth.name")}</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">{t("auth.email")}</span>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">{t("account.defaultWallet")}</span>
          <WalletSelect
            wallets={wallets}
            value={defaultWalletId}
            onChange={onDefaultWalletChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">{t("account.defaultCurrency")}</span>
          <select
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            {currencyOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <MonthStartDayField value={monthStartDay} onChange={onMonthStartDayChange} />

        {createdAt ? (
          <p className="text-sm text-slate-500">
            {t("account.createdAt", { date: formatDate(createdAt.slice(0, 10)) })}
          </p>
        ) : null}

        <FeedbackBanner error={error} message={message} />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? t("account.saving") : t("account.saveChanges")}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {t("common.signOutFull")}
          </button>
        </div>
      </form>
    </section>
  );
}
