"use client";

import { MONTH_START_DAYS } from "@/lib/calendar";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type MonthStartDayFieldProps = {
  value: number;
  onChange: (value: number) => void;
};

export default function MonthStartDayField({ value, onChange }: MonthStartDayFieldProps) {
  const t = useTranslations();

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{t("account.monthStartDay")}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
      >
        {MONTH_START_DAYS.map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500">{t("account.monthStartDayHint")}</p>
    </label>
  );
}
