"use client";

import { buildCategoryDisplayRows, getCategoryFullPathLabel } from "@/lib/categories";
import type { Category } from "@/lib/types/database";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type CategoriesTableProps = {
  categories: Category[];
  onAddSubCategory: (parentCategoryId: string) => void;
  onDelete: (category: Category) => void;
};

function getParentPath(category: Category, categories: Category[]) {
  if (!category.parent_category_id) {
    return "—";
  }

  const parent = categories.find((item) => item.id === category.parent_category_id);

  if (!parent) {
    return "—";
  }

  return getCategoryFullPathLabel(parent, categories);
}

export default function CategoriesTable({
  categories,
  onAddSubCategory,
  onDelete,
}: CategoriesTableProps) {
  const t = useTranslations();
  const rows = buildCategoryDisplayRows(categories);

  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {t("categories.empty")}
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 space-y-3 md:hidden">
        {rows.map(({ category, depth }) => (
          <article
            key={category.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            style={{ marginInlineStart: `${depth * 0.75}rem` }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: `${category.color}22` }}
              >
                {category.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="wrap-text font-medium text-slate-900">
                  {depth > 0 ? `↳ ${category.name}` : category.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {depth === 0 ? t("categories.typeRoot") : t("categories.typeSub")}
                </p>
                <p className="mt-1 wrap-text text-sm leading-6 text-slate-600">
                  {t("categories.under")}: {getParentPath(category, categories)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <CategoryIconButton
                icon="➕"
                label={t("categories.addSub")}
                onClick={() => onAddSubCategory(category.id)}
                tone="emerald"
              />
              <CategoryIconButton
                icon="🗑️"
                label={t("common.delete")}
                onClick={() => onDelete(category)}
                tone="red"
              />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 hidden x-scroll rounded-2xl border border-slate-100 md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-start font-medium">{t("categories.columnName")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("categories.columnType")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("categories.columnParent")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("categories.columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ category, depth }) => (
              <tr key={category.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-4">
                  <div
                    className="flex items-center gap-3"
                    style={{ paddingInlineStart: `${depth}rem` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                      style={{ backgroundColor: `${category.color}22` }}
                    >
                      {category.icon}
                    </span>
                    <span className="font-medium text-slate-900">
                      {depth > 0 ? `↳ ${category.name}` : category.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {depth === 0 ? t("categories.typeRootShort") : t("categories.typeSubShort")}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {getParentPath(category, categories)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <CategoryIconButton
                      icon="➕"
                      label={t("categories.addSub")}
                      onClick={() => onAddSubCategory(category.id)}
                      tone="emerald"
                    />
                    <CategoryIconButton
                      icon="🗑️"
                      label={t("common.delete")}
                      onClick={() => onDelete(category)}
                      tone="red"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const iconToneClasses = {
  emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  red: "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600",
};

function CategoryIconButton({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  tone: keyof typeof iconToneClasses;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${iconToneClasses[tone]}`}
    >
      {icon}
    </button>
  );
}
