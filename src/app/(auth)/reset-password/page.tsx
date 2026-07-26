"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("رابط إعادة التعيين غير صالح أو منتهي. اطلب رابطاً جديداً.");
      }

      setCheckingSession(false);
    }

    verifySession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setMessage("تم تحديث كلمة المرور بنجاح.");
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  if (checkingSession) {
    return <p className="px-4 py-12 text-sm text-slate-500">جاري التحقق من الرابط...</p>;
  }

  const hasRecoverySession = !error;

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <p className="text-sm text-emerald-700">Masrofy</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">كلمة مرور جديدة</h1>
        <p className="mt-2 text-sm text-slate-500">اختر كلمة مرور قوية لحسابك.</p>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {hasRecoverySession ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">كلمة المرور الجديدة</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">تأكيد كلمة المرور</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </label>

          {message ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
          </button>
        </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/forgot-password" className="font-medium text-emerald-700">
            طلب رابط جديد
          </Link>
        </p>
      </div>
    </div>
  );
}
