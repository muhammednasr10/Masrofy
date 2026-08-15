"use client";

import Link from "next/link";
import AccountAppSection from "@/components/account/AccountAppSection";
import AccountDataSection from "@/components/account/AccountDataSection";
import AccountLanguageSection from "@/components/account/AccountLanguageSection";
import AccountNotificationsSection from "@/components/account/AccountNotificationsSection";
import AccountProfileForm from "@/components/account/AccountProfileForm";
import AccountProfileHeader from "@/components/account/AccountProfileHeader";
import AccountSecuritySection from "@/components/account/AccountSecuritySection";
import AccountSupportSection from "@/components/account/AccountSupportSection";
import AccountStatsCards from "@/components/account/AccountStatsCards";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import PageLoading from "@/components/ui/PageLoading";
import { useAccountPage } from "@/hooks/useAccountPage";

export default function AccountPage() {
  const account = useAccountPage();
  const t = useTranslations();

  if (account.loading) {
    return <PageLoading label={t("account.loading")} />;
  }

  return (
    <div className="space-y-6">
      <AccountProfileHeader
        initials={account.initials}
        fullName={account.fullName}
        email={account.email}
      />

      <AccountStatsCards stats={account.stats} />

      <AccountProfileForm
        fullName={account.fullName}
        email={account.email}
        defaultWalletId={account.defaultWalletId}
        currency={account.currency}
        wallets={account.wallets}
        createdAt={account.createdAt}
        saving={account.saving}
        error={account.error}
        message={account.message}
        onFullNameChange={account.setFullName}
        onDefaultWalletChange={account.setDefaultWalletId}
        onCurrencyChange={account.setCurrency}
        onSubmit={account.handleSubmit}
        onSignOut={account.handleSignOut}
      />

      <AccountLanguageSection />

      <AccountNotificationsSection />

      <AccountSecuritySection
        email={account.email}
        emailVerified={account.emailVerified}
        onFeedback={account.handleSectionFeedback}
      />

      <AccountAppSection />

      <AccountSupportSection email={account.email} fullName={account.fullName} />

      <AccountDataSection email={account.email} onFeedback={account.handleSectionFeedback} />

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{t("account.legalTitle")}</h3>
        <p className="mt-2 text-sm text-slate-500">{t("account.legalSubtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t("account.privacy")}
          </Link>
          <Link
            href="/terms"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t("account.terms")}
          </Link>
        </div>
      </section>
    </div>
  );
}
