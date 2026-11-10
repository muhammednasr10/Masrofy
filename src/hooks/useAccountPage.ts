"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/router/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { loadAccountPageData, saveAccountProfile } from "@/lib/account";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import type { MonthStartMode } from "@/lib/calendar";
import type { Wallet } from "@/lib/types/database";
import type { AccountStats } from "@/lib/account/load-data";

export function useAccountPage() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const { setMonthStartDay: setSharedMonthStartDay } = useSelectedMonth();
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();
  const formDirtyRef = useRef(false);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [defaultWalletId, setDefaultWalletId] = useState("");
  const [monthStartDay, setMonthStartDay] = useState(1);
  const [monthStartMode, setMonthStartMode] = useState<MonthStartMode>("fixed");
  const [monthStartCategoryId, setMonthStartCategoryId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [stats, setStats] = useState<AccountStats>({
    categoriesCount: 0,
    transactionsCount: 0,
    walletsCount: 0,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const supabase = createClient();
        const data = await loadAccountPageData(supabase);

        if (cancelled) {
          return;
        }

        if (!data) {
          router.push("/login");
          return;
        }

        setEmail(data.email);
        setEmailVerified(data.emailVerified);
        setCreatedAt(data.createdAt);
        setStats(data.stats);
        setWallets(data.wallets);

        // Don't overwrite fields the user already edited (e.g. month-start mode).
        if (!formDirtyRef.current) {
          setFullName(data.fullName);
          setCurrency(data.currency);
          setDefaultWalletId(data.defaultWalletId);
          setMonthStartDay(data.monthStartDay);
          setMonthStartMode(data.monthStartMode);
          setMonthStartCategoryId(data.monthStartCategoryId);
        }

        setSharedMonthStartDay(data.monthStartDay);

        if (isLocale(data.locale) && data.locale !== localeRef.current) {
          await setLocale(data.locale);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "تعذر تحميل بيانات الحساب.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, setLocale, setSharedMonthStartDay]);

  function markDirty() {
    formDirtyRef.current = true;
  }

  function handleFullNameChange(value: string) {
    markDirty();
    setFullName(value);
  }

  function handleCurrencyChange(value: string) {
    markDirty();
    setCurrency(value);
  }

  function handleDefaultWalletChange(value: string) {
    markDirty();
    setDefaultWalletId(value);
  }

  function handleMonthStartDayChange(value: number) {
    markDirty();
    setMonthStartDay(value);
  }

  function handleMonthStartModeChange(mode: MonthStartMode) {
    markDirty();
    setMonthStartMode(mode);
  }

  function handleMonthStartCategoryChange(categoryId: string | null) {
    markDirty();
    setMonthStartCategoryId(categoryId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    clearFeedback();

    const supabase = createClient();
    const result = await saveAccountProfile(supabase, {
      fullName,
      currency,
      defaultWalletId,
      monthStartDay,
      monthStartMode,
      monthStartCategoryId,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    formDirtyRef.current = false;
    setMessage(result.message ?? "تم حفظ بيانات الحساب.");
    setSharedMonthStartDay(monthStartDay);
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
    monthStartDay,
    monthStartMode,
    monthStartCategoryId,
    wallets,
    createdAt,
    stats,
    initials,
    setFullName: handleFullNameChange,
    setCurrency: handleCurrencyChange,
    setDefaultWalletId: handleDefaultWalletChange,
    setMonthStartDay: handleMonthStartDayChange,
    setMonthStartMode: handleMonthStartModeChange,
    setMonthStartCategoryId: handleMonthStartCategoryChange,
    handleSubmit,
    handleSignOut,
    handleSectionFeedback,
  };
}
