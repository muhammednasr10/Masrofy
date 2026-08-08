"use client";

import { useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  id?: string;
  className?: string;
};

export default function PasswordInput({
  value,
  onChange,
  required = false,
  minLength,
  autoComplete = "current-password",
  id,
  className = "",
}: PasswordInputProps) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border border-slate-200 px-4 py-3 pe-12 outline-none transition focus:border-emerald-500 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-lg leading-none text-slate-500 transition hover:bg-slate-100"
        aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
        aria-pressed={visible}
      >
        <span aria-hidden>{visible ? "🙈" : "👁️"}</span>
      </button>
    </div>
  );
}
