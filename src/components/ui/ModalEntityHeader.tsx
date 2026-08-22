"use client";

import type { ReactNode } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type ModalEntityHeaderProps = {
  icon: string;
  color: string;
  title: ReactNode;
  subtitle?: string;
  onClose: () => void;
};

export default function ModalEntityHeader({
  icon,
  color,
  title,
  subtitle,
  onClose,
}: ModalEntityHeaderProps) {
  const t = useTranslations();

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
          style={{ backgroundColor: `${color}25` }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="wrap-text text-xl font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
      >
        {t("common.close")}
      </button>
    </div>
  );
}
