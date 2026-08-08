"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import SiteFooter from "@/components/layout/SiteFooter";
import PasswordInput from "@/components/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/supabase/site-url";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl("/dashboard"),
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setMessage("تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيد الحساب.");
    setLoading(false);
  }

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-emerald-50 to-slate-50">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <p className="text-sm text-emerald-700">Masrofy</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">إنشاء حساب</h1>
        <p className="mt-2 text-sm text-slate-500">
          ابدأ تتبع مصروفاتك بفئات جاهزة من أول يوم.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">الاسم</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">البريد الإلكتروني</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">كلمة المرور</span>
            <PasswordInput
              required
              minLength={6}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          {message ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <p className="text-xs leading-6 text-slate-500">
            بإنشاء حساب، فإنك توافق على{" "}
            <Link href="/terms" className="font-medium text-emerald-700">
              شروط الاستخدام
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="font-medium text-emerald-700">
              سياسة الخصوصية
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          عندك حساب؟{" "}
          <Link href="/login" className="font-medium text-emerald-700">
            سجل دخول
          </Link>
        </p>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}
