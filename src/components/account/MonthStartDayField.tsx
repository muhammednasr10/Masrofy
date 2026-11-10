"use client";

import { useEffect, useRef, useState } from "react";
import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  MONTH_START_DAY_MAX,
  MONTH_START_DAY_MIN,
  normalizeMonthStartDay,
  resolveCategoryMonthStartDay,
  type MonthStartMode,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types/database";

type MonthStartDayFieldProps = {
  value: number;
  mode: MonthStartMode;
  categoryId: string | null;
  onDayChange: (value: number) => void;
  onModeChange: (mode: MonthStartMode) => void;
  onCategoryChange: (categoryId: string | null) => void;
};

export default function MonthStartDayField({
  value,
  mode,
  categoryId,
  onDayChange,
  onModeChange,
  onCategoryChange,
}: MonthStartDayFieldProps) {
  const t = useTranslations();
  const [dayInput, setDayInput] = useState(String(value));
  const [categories, setCategories] = useState<Category[]>([]);
  const [linkedDayHint, setLinkedDayHint] = useState<number | null>(null);
  // Keep UI mode locally so parent reloads / form submit races can't snap it back.
  const [uiMode, setUiMode] = useState<MonthStartMode>(mode);
  const userPickedModeRef = useRef(false);

  useEffect(() => {
    if (!userPickedModeRef.current) {
      setUiMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    setDayInput(String(value));
  }, [value]);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setCategories((data ?? []) as Category[]);
      });
  }, []);

  useEffect(() => {
    if (uiMode !== "category" || !categoryId) {
      setLinkedDayHint(null);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      const day = await resolveCategoryMonthStartDay(supabase, user.id, categoryId);

      if (cancelled || day == null) {
        if (!cancelled) {
          setLinkedDayHint(day);
        }
        return;
      }

      setLinkedDayHint(day);
      onDayChange(day);
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId, onDayChange, uiMode]);

  function commitDayInput(raw: string) {
    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
      setDayInput(String(value));
      return;
    }

    const next = normalizeMonthStartDay(Math.round(parsed));
    setDayInput(String(next));
    onDayChange(next);
  }

  function selectMode(nextMode: MonthStartMode) {
    userPickedModeRef.current = true;
    setUiMode(nextMode);
    onModeChange(nextMode);
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-slate-700">{t("account.monthStartDay")}</span>

      <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("account.monthStartDay")}>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            selectMode("fixed");
          }}
          className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
            uiMode === "fixed"
              ? "bg-emerald-700 text-white"
              : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          }`}
        >
          {t("account.monthStartModeFixed")}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            selectMode("category");
          }}
          className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
            uiMode === "category"
              ? "bg-emerald-700 text-white"
              : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          }`}
        >
          {t("account.monthStartModeCategory")}
        </button>
      </div>

      {uiMode === "fixed" ? (
        <label className="block space-y-2">
          <span className="text-sm text-slate-600">{t("account.monthStartDayInputLabel")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={MONTH_START_DAY_MIN}
            max={MONTH_START_DAY_MAX}
            step={1}
            value={dayInput}
            onChange={(event) => setDayInput(event.target.value)}
            onBlur={(event) => commitDayInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDayInput(dayInput);
              }
            }}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-slate-500">{t("account.monthStartDayHint")}</p>
        </label>
      ) : (
        <div className="space-y-2">
          <span className="block text-sm text-slate-600">
            {t("account.monthStartCategoryLabel")}
          </span>
          <CategorySearchSelect
            categories={categories}
            value={categoryId ?? ""}
            onChange={(nextId) => onCategoryChange(nextId || null)}
            allowEmpty
            emptyLabel={t("account.monthStartCategoryEmpty")}
            listInFlow
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus-within:border-emerald-500"
          />
          <p className="text-xs leading-6 text-slate-500">
            {t("account.monthStartCategoryHint")}
            {linkedDayHint != null
              ? ` ${t("account.monthStartCategoryCurrentDay", { day: linkedDayHint })}`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}
