"use client";

import {
  categoryColorOptions,
  categoryIconOptions,
} from "@/lib/constants/category-options";
import { buildCategoryParentOptions } from "@/lib/categories";
import type { CategoryFormState } from "@/lib/categories/form";
import type { Category } from "@/lib/types/database";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type CategoryFormFieldsProps = {
  form: CategoryFormState;
  categories: Category[];
  onChange: (form: CategoryFormState) => void;
  idPrefix?: string;
};

export default function CategoryFormFields({
  form,
  categories,
  onChange,
  idPrefix = "category",
}: CategoryFormFieldsProps) {
  const t = useTranslations();
  const parentOptions = buildCategoryParentOptions(
    categories,
    form.editingCategoryId,
  );

  return (
    <div className="mt-6 space-y-5">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("categories.parentLabel")}</span>
        <select
          value={form.parentCategoryId ?? ""}
          onChange={(event) =>
            onChange({
              ...form,
              parentCategoryId: event.target.value || null,
            })
          }
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        >
          <option value="">{t("categories.parentNone")}</option>
          {parentOptions.map(({ category, label }) => (
            <option key={category.id} value={category.id}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("categories.nameLabel")}</span>
        <input
          id={`${idPrefix}-name`}
          type="text"
          required
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{t("categories.iconLabel")}</span>
          <span className="rounded-xl bg-slate-100 px-3 py-1 text-lg">{form.icon}</span>
        </div>
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 p-3">
          <div className="grid grid-cols-8 gap-2">
            {categoryIconOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ ...form, icon: option })}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition ${
                  form.icon === option
                    ? "bg-emerald-100 ring-2 ring-emerald-500"
                    : "bg-slate-50 hover:bg-emerald-50"
                }`}
                aria-label={`${t("categories.iconLabel")} ${option}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{t("categories.colorLabel")}</span>
          <span
            className="h-6 w-6 rounded-full border border-slate-200"
            style={{ backgroundColor: form.color }}
            aria-hidden
          />
        </div>
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="grid grid-cols-8 gap-2">
            {categoryColorOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ ...form, color: option })}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  form.color === option ? "border-slate-900 scale-110" : "border-white"
                }`}
                style={{ backgroundColor: option }}
                aria-label={option}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 px-4 py-3"
        style={{ backgroundColor: `${form.color}15` }}
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
          style={{ backgroundColor: `${form.color}33` }}
        >
          {form.icon}
        </span>
        <div>
          <p className="text-sm text-slate-500">{t("categories.preview")}</p>
          <p className="font-medium text-slate-900">{form.name.trim() || t("categories.nameLabel")}</p>
        </div>
      </div>
    </div>
  );
}
