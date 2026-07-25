"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <p className="text-sm text-emerald-700">Masrofy</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-slate-500">
          ادخل لحسابك لمتابعة مصروفاتك الشهرية.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          مفيش حساب؟{" "}
          <Link href="/register" className="font-medium text-emerald-700">
            أنشئ حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}
