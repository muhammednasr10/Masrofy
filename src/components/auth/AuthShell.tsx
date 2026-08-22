"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import SiteFooter from "@/components/layout/SiteFooter";
import { MasrofyLogo } from "@/components/layout/MasrofyLogo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  heroTitle: string;
  heroSubtitle: string;
  heroFeatures: [string, string, string];
};

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  heroTitle,
  heroSubtitle,
  heroFeatures,
}: AuthShellProps) {
  const t = useTranslations();

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-emerald-100 via-white to-slate-50">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col lg:flex-row lg:items-stretch">
        <aside className="relative hidden overflow-hidden lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-12">
          <div className="pointer-events-none absolute -start-16 top-16 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 end-0 h-72 w-72 rounded-full bg-teal-100/70 blur-3xl" />

          <div className="relative">
            <MasrofyLogo href="/" />
          </div>

          <div className="relative space-y-6">
            <div>
              <h2 className="text-3xl font-semibold leading-tight text-slate-900">{heroTitle}</h2>
              <p className="mt-3 text-base leading-8 text-slate-600">{heroSubtitle}</p>
            </div>

            <ul className="space-y-3">
              {heroFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-sm text-slate-500">{t("common.appName")}</p>
        </aside>

        <main className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <MasrofyLogo href="/" size="sm" />
            <LanguageSwitcher compact />
          </div>

          <div className="mx-auto w-full max-w-md rounded-3xl border border-white bg-white/90 p-6 shadow-lg backdrop-blur sm:p-8">
            <div className="mb-6 hidden items-center justify-between lg:flex">
              <Link
                href="/"
                className="text-sm font-medium text-slate-500 transition hover:text-emerald-700"
              >
                ← {t("auth.backHome")}
              </Link>
              <LanguageSwitcher compact />
            </div>

            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>

            <div className="mt-8">{children}</div>

            {footer ? <div className="mt-6 border-t border-slate-100 pt-6">{footer}</div> : null}
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}

export const authInputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export const authPrimaryButtonClassName =
  "w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60";

export const authLabelClassName = "text-sm font-medium text-slate-700";
