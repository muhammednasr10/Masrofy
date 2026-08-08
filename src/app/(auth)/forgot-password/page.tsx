"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? t("auth.resetRequestFailed"));
        return;
      }

      setMessage(t("auth.resetEmailSent"));
    } catch {
      setError(t("auth.resetRequestFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <p className="text-sm text-emerald-700">{t("common.appShortName")}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{t("auth.forgotPasswordTitle")}</h1>
        <p className="mt-2 text-sm text-slate-500">{t("auth.forgotPasswordSubtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{t("auth.email")}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          {message ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? t("auth.resetSending") : t("auth.resetSendLink")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-emerald-700">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
