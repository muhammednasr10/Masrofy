"use client";

import { useMemo, useState } from "react";
import CategoryDetailModal from "@/components/categories/CategoryDetailModal";
import IconActionButton from "@/components/ui/IconActionButton";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  getCategoryDescendantIds,
  getDirectChildCategories,
  getParentCategories,
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
  const roots = useMemo(() => getParentCategories(categories), [categories]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => (selectedCategoryId ? categories.find((item) => item.id === selectedCategoryId) : undefined),
    [categories, selectedCategoryId],
  );

  if (roots.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {t("categories.empty")}
      </p>
    );
  }

  return (
    <>
      <ul className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {roots.map((category, index) => {
          const directCount = getDirectChildCategories(category.id, categories).length;
          const totalCount = getCategoryDescendantIds(category.id, categories).size;

          return (
            <li
              key={category.id}
              className={`flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
                index > 0 ? "border-t border-slate-100/80" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-0.5 text-start transition hover:bg-slate-50/80"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: `${category.color}18` }}
                >
                  {category.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="wrap-text text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                      {category.name}
                    </span>
                    <TypeBadge label={t("categories.typeRootShort")} />
                    <SubCountBadges directCount={directCount} totalCount={totalCount} />
                  </div>
                  <p className="mt-0.5 text-xs font-normal text-slate-400">
                    {t("categories.openDetails")}
                  </p>
                </div>
              </button>

              <CategoryRowActions
                onAddSub={() => onAddSubCategory(category.id)}
                onEdit={() => onEdit(category)}
                onDelete={() => onDelete(category)}
              />
            </li>
          );
        })}
      </ul>

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

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-slate-100/80 px-2 py-0.5 text-xs font-medium text-slate-500">
      {label}
    </span>
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
    <div className="flex items-center gap-1 sm:shrink-0">
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
