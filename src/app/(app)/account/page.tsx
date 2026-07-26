"use client";

import Link from "next/link";
import AccountAppSection from "@/components/account/AccountAppSection";
import AccountDataSection from "@/components/account/AccountDataSection";
import AccountProfileForm from "@/components/account/AccountProfileForm";
import AccountProfileHeader from "@/components/account/AccountProfileHeader";
import AccountSecuritySection from "@/components/account/AccountSecuritySection";
import AccountStatsCards from "@/components/account/AccountStatsCards";
import PageLoading from "@/components/ui/PageLoading";
import { useAccountPage } from "@/hooks/useAccountPage";

export default function AccountPage() {
  const account = useAccountPage();

  if (account.loading) {
    return <PageLoading label="جاري تحميل بيانات الحساب..." />;
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

      <AccountSecuritySection
        email={account.email}
        emailVerified={account.emailVerified}
        onFeedback={account.handleSectionFeedback}
      />

      <AccountAppSection />

      <AccountDataSection email={account.email} onFeedback={account.handleSectionFeedback} />

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">قانوني</h3>
        <p className="mt-2 text-sm text-slate-500">
          راجع سياسات استخدام Masrofy وحقوقك في بياناتك.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            سياسة الخصوصية
          </Link>
          <Link
            href="/terms"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            شروط الاستخدام
          </Link>
        </div>
      </section>
    </div>
  );
}
