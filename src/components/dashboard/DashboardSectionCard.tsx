"use client";

import Link from "next/link";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export type DashboardSectionCardProps = {
  href: string;
  icon: string;
  title: string;
  description: string;
  primaryValue: string;
  secondaryValue?: string;
  tone?: "emerald" | "red" | "indigo" | "amber" | "slate" | "sky";
  className?: string;
};

const toneClasses = {
  emerald: "from-emerald-50 to-white hover:border-emerald-200",
  red: "from-red-50 to-white hover:border-red-200",
  indigo: "from-indigo-50 to-white hover:border-indigo-200",
  amber: "from-amber-50 to-white hover:border-amber-200",
  slate: "from-slate-100 to-white hover:border-slate-300",
  sky: "from-sky-50 to-white hover:border-sky-200",
};

export default function DashboardSectionCard({
  href,
  icon,
  title,
  description,
  primaryValue,
  secondaryValue,
  tone = "emerald",
  className = "",
}: DashboardSectionCardProps) {
  const t = useTranslations();

  return (
    <Link
      href={href}
      className={`group block rounded-3xl border border-white bg-gradient-to-br ${toneClasses[tone]} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
          {icon}
        </span>
        <span className="rounded-full bg-white/80 px-2 py-1 text-xs text-slate-500 transition group-hover:text-emerald-700">
          {t("dashboard.openCard")}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 wrap-text text-sm leading-6 text-slate-500">{description}</p>
      <p className="amount-text mt-4 text-slate-900">{primaryValue}</p>
      {secondaryValue ? (
        <p className="mt-1 wrap-text text-sm leading-6 text-slate-600">{secondaryValue}</p>
      ) : null}
    </Link>
  );
}
