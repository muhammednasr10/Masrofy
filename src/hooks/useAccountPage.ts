"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { loadAccountPageData, saveAccountProfile } from "@/lib/account";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import type { Wallet } from "@/lib/types/database";
import type { AccountStats } from "@/lib/account/load-data";

export function useAccountPage() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [defaultWalletId, setDefaultWalletId] = useState("");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [stats, setStats] = useState<AccountStats>({
    categoriesCount: 0,
    transactionsCount: 0,
    walletsCount: 0,
  });

  const loadAccount = useCallback(async () => {
    const supabase = createClient();
    const data = await loadAccountPageData(supabase);

    if (!data) {
      router.push("/login");
      return;
    }

    setEmail(data.email);
    setEmailVerified(data.emailVerified);
    setFullName(data.fullName);
    setCurrency(data.currency);
    setDefaultWalletId(data.defaultWalletId);
    setWallets(data.wallets);
    setCreatedAt(data.createdAt);
    setStats(data.stats);

    if (isLocale(data.locale) && data.locale !== locale) {
      await setLocale(data.locale);
    }

    setLoading(false);
  }, [locale, router, setLocale]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    clearFeedback();

    const supabase = createClient();
    const result = await saveAccountProfile(supabase, {
      fullName,
      currency,
      defaultWalletId,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setMessage(result.message ?? "تم حفظ بيانات الحساب.");
    setSaving(false);
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleSectionFeedback(nextError: string | null, nextMessage: string | null) {
    setError(nextError);
    setMessage(nextMessage);
  }

  const initials = fullName.trim().charAt(0) || email.charAt(0).toUpperCase();

  return {
    loading,
    saving,
    error,
    message,
    email,
    emailVerified,
    fullName,
    currency,
    defaultWalletId,
    wallets,
    createdAt,
    stats,
    initials,
    setFullName,
    setCurrency,
    setDefaultWalletId,
    handleSubmit,
    handleSignOut,
    handleSectionFeedback,
  };
}
