"use client";

import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { buildCategoryParentOptions, getCategoryFlow } from "@/lib/categories";
import type { CategoryFormState } from "@/lib/categories/form";
import {
  categoryColorOptions,
  categoryIconOptions,
  suggestCategoryIcon,
} from "@/lib/constants/category-options";
import type { Category } from "@/lib/types/database";

type CategoryFormFieldsProps = {
  form: CategoryFormState;
  categories: Category[];
  onChange: (form: CategoryFormState) => void;
  idPrefix?: string;
  /** When adding a subcategory from a parent row — hide type/parent pickers */
  lockParent?: boolean;
  compact?: boolean;
};

export default function CategoryFormFields({
  form,
  categories,
  onChange,
  idPrefix = "category",
  lockParent = false,
  compact = false,
}: CategoryFormFieldsProps) {
  const t = useTranslations();
  const parentOptions = buildCategoryParentOptions(
    categories,
    form.editingCategoryId,
  );
  const parentCategories = parentOptions.map(({ category }) => category);
  const lockedParent = lockParent && form.parentCategoryId
    ? categories.find((item) => item.id === form.parentCategoryId)
    : null;

  function setParentCategory(parentId: string) {
    const parent = categories.find((item) => item.id === parentId);

    onChange({
      ...form,
      parentCategoryId: parentId || null,
      flow: parent ? getCategoryFlow(parent) : form.flow,
    });
  }

  return (
    <div className="mt-6 space-y-5">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("categories.flowLabel")}</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={Boolean(form.parentCategoryId)}
            onClick={() => onChange({ ...form, flow: "income" })}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              form.flow === "income"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t("categories.flowIncome")}
          </button>
          <button
            type="button"
            disabled={Boolean(form.parentCategoryId)}
            onClick={() => onChange({ ...form, flow: "expense" })}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              form.flow === "expense"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t("categories.flowExpense")}
          </button>
        </div>
        {form.parentCategoryId ? (
          <p className="text-xs text-slate-500">{t("categories.flowInheritedHint")}</p>
        ) : null}
      </label>

      {lockedParent ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-medium text-emerald-700">{t("categories.typeSub")}</p>
          <p className="mt-1 flex items-center gap-2 font-medium text-slate-900">
            <span>{lockedParent.icon}</span>
            <span>
              {t("categories.under")} {lockedParent.name}
            </span>
          </p>
        </div>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{t("categories.kindLabel")}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...form, parentCategoryId: null })}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  !form.parentCategoryId
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("categories.typeRoot")}
              </button>
              <button
                type="button"
                disabled={parentOptions.length === 0}
                onClick={() => {
                  const parent = form.parentCategoryId
                    ? categories.find((item) => item.id === form.parentCategoryId)
                    : parentOptions[0]?.category;

                  onChange({
                    ...form,
                    parentCategoryId: parent?.id ?? parentOptions[0]?.category.id ?? null,
                    flow: parent ? getCategoryFlow(parent) : form.flow,
                  });
                }}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  form.parentCategoryId
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("categories.typeSub")}
              </button>
            </div>
          </label>

          {form.parentCategoryId ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700">{t("categories.parentLabel")}</span>
              <CategorySearchSelect
                categories={parentCategories}
                value={form.parentCategoryId}
                onChange={setParentCategory}
                required
                listInFlow
                placeholder={t("categories.searchPlaceholder")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus-within:border-emerald-500"
              />
            </div>
          ) : null}
        </>
      )}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("categories.nameLabel")}</span>
        <input
          id={`${idPrefix}-name`}
          type="text"
          required
          value={form.name}
          onChange={(event) => {
            const name = event.target.value;
            const hintIcon = suggestCategoryIcon(name);
            onChange({
              ...form,
              name,
              ...(hintIcon && !form.editingCategoryId ? { icon: hintIcon } : {}),
            });
          }}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      {compact ? null : (
      <>
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
      </>
      )}
    </div>
  );
}
