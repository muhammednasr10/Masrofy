"use client";

import { useMemo, useState } from "react";
import CategoryDetailModal from "@/components/categories/CategoryDetailModal";
import IconActionButton from "@/components/ui/IconActionButton";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { getCategoryFlow } from "@/lib/categories/flow";
import {
  buildCategoryDisplayRows,
  getCategoryDescendantIds,
  getDirectChildCategories,
} from "@/lib/categories/hierarchy";
import type { Category } from "@/lib/types/database";

type CategoriesTableProps = {
  categories: Category[];
  quickAddSubmitting: boolean;
  onAddSubCategory: (parentCategoryId: string) => void;
  onQuickAddSubCategory: (parent: Category, name: string) => Promise<void>;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export default function CategoriesTable({
  categories,
  quickAddSubmitting,
  onAddSubCategory,
  onQuickAddSubCategory,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  const t = useTranslations();
  const rows = useMemo(() => buildCategoryDisplayRows(categories), [categories]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [flowFilter, setFlowFilter] = useState<"" | "income" | "expense">("");
  const [kindFilter, setKindFilter] = useState<"" | "root" | "sub">("");
  const [subsFilter, setSubsFilter] = useState<"" | "with" | "without">("");
  const rootCount = rows.filter(({ category }) => !category.parent_category_id).length;
  const subCount = rows.length - rootCount;
  const filteredRows = rows.filter(({ category }) => {
    const isIncome = getCategoryFlow(category) === "income";
    const isRoot = !category.parent_category_id;
    const directCount = getDirectChildCategories(category.id, categories).length;
    const name = category.name.trim().toLowerCase();
    const query = nameQuery.trim().toLowerCase();

    if (query && !name.includes(query)) {
      return false;
    }

    if (flowFilter === "income" && !isIncome) {
      return false;
    }

    if (flowFilter === "expense" && isIncome) {
      return false;
    }

    if (kindFilter === "root" && !isRoot) {
      return false;
    }

    if (kindFilter === "sub" && isRoot) {
      return false;
    }

    if (subsFilter === "with" && directCount === 0) {
      return false;
    }

    if (subsFilter === "without" && directCount > 0) {
      return false;
    }

    return true;
  });
  const filterClass =
    "mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-emerald-500";

  const selectedCategory = useMemo(
    () => (selectedCategoryId ? categories.find((item) => item.id === selectedCategoryId) : undefined),
    [categories, selectedCategoryId],
  );

  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {t("categories.empty")}
      </p>
    );
  }

  return (
    <>
      <p className="mt-6 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">
          {t("categories.rootCount", { count: String(rootCount) })}
        </span>
        <span className="mx-2 text-slate-300">•</span>
        <span className="font-semibold text-slate-900">
          {t("categories.subCount", { count: String(subCount) })}
        </span>
      </p>

      <div className="mt-3 x-scroll">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-3 text-right align-top font-medium">
                {t("categories.columnName")}
                <input
                  type="search"
                  value={nameQuery}
                  onChange={(event) => setNameQuery(event.target.value)}
                  placeholder={t("categories.filterName")}
                  aria-label={t("categories.filterName")}
                  className={filterClass}
                />
              </th>
              <th className="px-3 py-3 text-right align-top font-medium">
                {t("categories.columnType")}
                <select
                  value={flowFilter}
                  onChange={(event) => setFlowFilter(event.target.value as "" | "income" | "expense")}
                  aria-label={t("categories.columnType")}
                  className={filterClass}
                >
                  <option value="">{t("categories.filterAll")}</option>
                  <option value="income">{t("categories.flowIncome")}</option>
                  <option value="expense">{t("categories.flowExpense")}</option>
                </select>
              </th>
              <th className="px-3 py-3 text-right align-top font-medium">
                {t("categories.columnKind")}
                <select
                  value={kindFilter}
                  onChange={(event) => setKindFilter(event.target.value as "" | "root" | "sub")}
                  aria-label={t("categories.columnKind")}
                  className={filterClass}
                >
                  <option value="">{t("categories.filterAll")}</option>
                  <option value="root">{t("categories.typeRootShort")}</option>
                  <option value="sub">{t("categories.typeSubShort")}</option>
                </select>
              </th>
              <th className="px-3 py-3 text-right align-top font-medium">
                {t("categories.columnSubs")}
                <select
                  value={subsFilter}
                  onChange={(event) => setSubsFilter(event.target.value as "" | "with" | "without")}
                  aria-label={t("categories.columnSubs")}
                  className={filterClass}
                >
                  <option value="">{t("categories.filterAll")}</option>
                  <option value="with">{t("categories.filterHasSubs")}</option>
                  <option value="without">{t("categories.filterNoSubs")}</option>
                </select>
              </th>
              <th className="px-3 py-3 text-right align-top font-medium">{t("categories.columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                  {t("categories.filterEmpty")}
                </td>
              </tr>
            ) : null}
            {filteredRows.map(({ category, depth }) => {
              const isIncome = getCategoryFlow(category) === "income";
              const isRoot = !category.parent_category_id;
              const directCount = getDirectChildCategories(category.id, categories).length;
              const totalCount = getCategoryDescendantIds(category.id, categories).size;

              return (
                <tr
                  key={category.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    isRoot ? "bg-emerald-50/80" : "bg-amber-50/70"
                  }`}
                >
                  <td data-span className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className="flex min-w-0 items-center gap-3 text-start"
                      style={{ paddingInlineStart: `${depth * 1.25}rem` }}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                          isRoot ? "bg-emerald-200" : "bg-amber-200"
                        }`}
                      >
                        {category.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block wrap-text font-semibold text-slate-900">
                          {category.name}
                        </span>
                        <span className="mt-0.5 block text-xs font-normal text-slate-400">
                          {t("categories.openDetails")}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td data-label={t("categories.columnType")} className="px-3 py-3">
                    <TypeBadge
                      label={isIncome ? t("categories.flowIncome") : t("categories.flowExpense")}
                      tone={isIncome ? "income" : "expense"}
                    />
                  </td>
                  <td data-label={t("categories.columnKind")} className="px-3 py-3">
                    <TypeBadge
                      label={isRoot ? t("categories.typeRootShort") : t("categories.typeSubShort")}
                    />
                  </td>
                  <td data-label={t("categories.columnSubs")} className="px-3 py-3">
                    <SubCountBadges directCount={directCount} totalCount={totalCount} />
                  </td>
                  <td data-label={t("categories.columnActions")} className="px-3 py-3">
                    <CategoryRowActions
                      onAddSub={() => onAddSubCategory(category.id)}
                      onEdit={() => onEdit(category)}
                      onDelete={() => onDelete(category)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedCategory ? (
        <CategoryDetailModal
          category={selectedCategory}
          categories={categories}
          quickAddSubmitting={quickAddSubmitting}
          onClose={() => setSelectedCategoryId(null)}
          onOpenCategory={setSelectedCategoryId}
          onAddSubCategory={onAddSubCategory}
          onQuickAddSubCategory={onQuickAddSubCategory}
          onEdit={onEdit}
          onDelete={(category) => {
            setSelectedCategoryId(null);
            onDelete(category);
          }}
        />
      ) : null}
    </>
  );
}

function TypeBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "income" | "expense";
}) {
  const toneClass =
    tone === "income"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "expense"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100/80 text-slate-500";

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneClass}`}>{label}</span>
  );
}

function SubCountBadges({
  directCount,
  totalCount,
}: {
  directCount: number;
  totalCount: number;
}) {
  const t = useTranslations();
  const hasDirect = directCount > 0;
  const hasTotal = totalCount > 0;
  const showTotal = totalCount !== directCount;

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`min-w-[1.5rem] rounded-lg px-2.5 py-1 text-center text-sm font-semibold tabular-nums ${
          hasDirect ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"
        }`}
        title={t("categories.directChildCount", { count: String(directCount) })}
      >
        {directCount}
      </span>
      {showTotal ? (
        <span
          className={`min-w-[1.15rem] rounded-md px-1.5 py-0.5 text-center text-[10px] font-medium tabular-nums ${
            hasTotal ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-400"
          }`}
          title={t("categories.totalChildCount", { count: String(totalCount) })}
        >
          {totalCount}
        </span>
      ) : null}
    </span>
  );
}

function CategoryRowActions({
  onAddSub,
  onEdit,
  onDelete,
}: {
  onAddSub: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-1">
      <IconActionButton
        icon="➕"
        label={t("categories.addSub")}
        onClick={onAddSub}
        tone="emerald"
      />
      <IconActionButton icon="✏️" label={t("common.edit")} onClick={onEdit} tone="slate" />
      <IconActionButton icon="🗑️" label={t("common.delete")} onClick={onDelete} tone="red" />
    </div>
  );
}
