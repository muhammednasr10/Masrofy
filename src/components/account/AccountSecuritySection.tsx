"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountSecuritySectionProps = {
  email: string;
  emailVerified: boolean;
  onFeedback: (error: string | null, message: string | null) => void;
};

export default function AccountSecuritySection({
  email,
  emailVerified,
  onFeedback,
}: AccountSecuritySectionProps) {
  const [resending, setResending] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleResendVerification() {
    setResending(true);
    onFeedback(null, null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      onFeedback(error.message, null);
    } else {
      onFeedback(null, "تم إرسال رسالة تأكيد جديدة إلى بريدك.");
    }

    setResending(false);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onFeedback(null, null);

    if (newPassword.length < 6) {
      onFeedback("كلمة المرور يجب أن تكون 6 أحرف على الأقل.", null);
      return;
    }

    if (newPassword !== confirmPassword) {
      onFeedback("كلمتا المرور غير متطابقتين.", null);
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      onFeedback(error.message, null);
    } else {
      setNewPassword("");
      setConfirmPassword("");
      onFeedback(null, "تم تحديث كلمة المرور.");
    }

    setSavingPassword(false);
  }

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">الأمان</h3>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
        <p className="text-sm font-medium text-slate-900">تأكيد البريد الإلكتروني</p>
        <p className="mt-1 text-sm text-slate-500">
          {emailVerified
            ? "بريدك مؤكّد."
            : "بريدك غير مؤكّد بعد. بعض الميزات قد تتأثر حتى التأكيد."}
        </p>
        {!emailVerified ? (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="mt-3 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {resending ? "جاري الإرسال..." : "إعادة إرسال رسالة التأكيد"}
          </button>
        ) : null}
      </div>

      <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
        <p className="text-sm font-medium text-slate-900">تغيير كلمة المرور</p>

        <label className="block space-y-2">
          <span className="text-sm text-slate-700">كلمة المرور الجديدة</span>
          <input
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-slate-700">تأكيد كلمة المرور</span>
          <input
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <button
          type="submit"
          disabled={savingPassword || !newPassword}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {savingPassword ? "جاري التحديث..." : "تحديث كلمة المرور"}
        </button>
      </form>
    </section>
  );
}
