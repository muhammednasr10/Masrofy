"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountDataSection from "@/components/account/AccountDataSection";
import AccountSecuritySection from "@/components/account/AccountSecuritySection";
import { currencyOptions } from "@/lib/constants/currency-options";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Wallet } from "@/lib/types/database";
import { formatDate } from "@/lib/utils/format";
import WalletSelect from "@/components/wallets/WalletSelect";

type AccountStats = {
  categoriesCount: number;
  transactionsCount: number;
  walletsCount: number;
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");
      setEmailVerified(Boolean(user.email_confirmed_at));
      setCreatedAt(user.created_at ?? null);

      const [
        { data: profile },
        { count: categoriesCount },
        { count: transactionsCount },
        { count: walletsCount },
        { data: walletRows },
      ] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("categories")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("transactions")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("wallets")
            .select("*", { count: "exact", head: true }),
          supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
        ]);

      const typedProfile = profile as Profile | null;
      const typedWallets = (walletRows ?? []) as Wallet[];
      setFullName(typedProfile?.full_name ?? user.user_metadata?.full_name ?? "");
      setCurrency(typedProfile?.currency ?? "EGP");
      setWallets(typedWallets);
      setDefaultWalletId(
        typedProfile?.default_wallet_id ??
          typedWallets.find((wallet) => wallet.is_default)?.id ??
          typedWallets[0]?.id ??
          "",
      );
      setStats({
        categoriesCount: categoriesCount ?? 0,
        transactionsCount: transactionsCount ?? 0,
        walletsCount: walletsCount ?? 0,
      });
      setLoading(false);
    }

    loadAccount();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("يجب تسجيل الدخول أولاً.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        currency,
        default_wallet_id: defaultWalletId || null,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    if (defaultWalletId) {
      await supabase.from("wallets").update({ is_default: false }).eq("user_id", user.id);
      await supabase
        .from("wallets")
        .update({ is_default: true })
        .eq("id", defaultWalletId);
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    if (authUpdateError) {
      setError(authUpdateError.message);
      setSaving(false);
      return;
    }

    setMessage("تم حفظ بيانات الحساب بنجاح.");
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

  if (loading) {
    return <p className="text-sm text-slate-500">جاري تحميل بيانات الحساب...</p>;
  }

  const initials = fullName.trim().charAt(0) || email.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-semibold text-white">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {fullName.trim() || "حسابي"}
            </h2>
            <p className="text-sm text-slate-500">{email}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <InfoCard title="عدد المحافظ" value={String(stats.walletsCount)} />
        <InfoCard title="عدد الفئات" value={String(stats.categoriesCount)} />
        <InfoCard title="عدد العمليات" value={String(stats.transactionsCount)} />
      </section>

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">معلومات الحساب</h3>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">الاسم</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">البريد الإلكتروني</span>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">المحفظة الافتراضية</span>
            <WalletSelect
              wallets={wallets}
              value={defaultWalletId}
              onChange={setDefaultWalletId}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">العملة الافتراضية</span>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            >
              {currencyOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {createdAt ? (
            <p className="text-sm text-slate-500">
              تاريخ إنشاء الحساب: {formatDate(createdAt.slice(0, 10))}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          {message ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              تسجيل الخروج
            </button>
          </div>
        </form>
      </section>

      <AccountSecuritySection
        email={email}
        emailVerified={emailVerified}
        onFeedback={handleSectionFeedback}
      />

      <AccountDataSection email={email} onFeedback={handleSectionFeedback} />

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

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-3xl border border-white bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
