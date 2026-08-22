"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import AuthShell, {
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/AuthShell";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import PasswordInput from "@/components/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfigHint, translateAuthError } from "@/lib/supabase/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const configHint = getSupabaseConfigHint();

  useEffect(() => {
    if (configHint) {
      return;
    }

    let cancelled = false;

    void fetch("/api/health/supabase")
      .then(async (response) => {
        const data = (await response.json()) as { connected?: boolean; message?: string };
        if (!cancelled && !data.connected) {
          setConnectionWarning(data.message ?? t("auth.connectionFailed"));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConnectionWarning(t("auth.connectionFailed"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [configHint, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(translateAuthError(signInError.message));
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : String(submitError);
      setError(translateAuthError(message));
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      heroTitle={t("auth.loginHeroTitle")}
      heroSubtitle={t("auth.loginHeroSubtitle")}
      heroFeatures={[
        t("auth.loginHeroFeature1"),
        t("auth.loginHeroFeature2"),
        t("auth.loginHeroFeature3"),
      ]}
      footer={
        <p className="text-center text-sm text-slate-500">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
            {t("auth.createAccount")}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-2">
          <span className={authLabelClassName}>{t("auth.email")}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authInputClassName}
            placeholder="name@example.com"
          />
        </label>

        <label className="block space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className={authLabelClassName}>{t("auth.password")}</span>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <PasswordInput
            required
            minLength={6}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </label>

        {configHint ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{configHint}</p>
        ) : null}

        {connectionWarning ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {connectionWarning}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? t("auth.loggingIn") : t("auth.loginButton")}
        </button>
      </form>
    </AuthShell>
  );
}
