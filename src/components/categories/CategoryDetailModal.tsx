"use client";

import CategoryQuickAddRow from "@/components/categories/CategoryQuickAddRow";
import ModalActionButton from "@/components/ui/ModalActionButton";
import ModalEntityHeader from "@/components/ui/ModalEntityHeader";
import ModalShell from "@/components/ui/ModalShell";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  getDirectChildCategories,
  getCategoryFullPathLabel,
} from "@/lib/categories/hierarchy";
import type { Category } from "@/lib/types/database";

type CategoryDetailModalProps = {
  category: Category;
  categories: Category[];
  quickAddSubmitting: boolean;
  onClose: () => void;
  onOpenCategory: (categoryId: string) => void;
  onAddSubCategory: (parentCategoryId: string) => void;
  onQuickAddSubCategory: (parent: Category, name: string) => Promise<void>;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export default function CategoryDetailModal({
  category,
  categories,
  quickAddSubmitting,
  onClose,
  onOpenCategory,
  onAddSubCategory,
  onQuickAddSubCategory,
  onEdit,
  onDelete,
}: CategoryDetailModalProps) {
  const t = useTranslations();
  const isRoot = !category.parent_category_id;
  const children = getDirectChildCategories(category.id, categories);
  const pathLabel = isRoot
    ? null
    : getCategoryFullPathLabel(category, categories, " › ");

  function runAndClose(action: () => void) {
    onClose();
    action();
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <ModalEntityHeader
        icon={category.icon}
        color={category.color}
        title={category.name}
        subtitle={
          pathLabel
            ? `${pathLabel} • ${isRoot ? t("categories.typeRoot") : t("categories.typeSub")}`
            : isRoot
              ? t("categories.typeRoot")
              : t("categories.typeSub")
        }
        onClose={onClose}
      />

      <dl className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">{t("categories.colorLabel")}</dt>
          <dd className="flex items-center gap-2 font-medium text-slate-800">
            <span
              className="h-5 w-5 rounded-full border border-slate-200"
              style={{ backgroundColor: category.color }}
            />
            {category.color}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">{t("categories.subCountLabel")}</dt>
          <dd className="font-medium text-slate-800">{children.length}</dd>
        </div>
      </dl>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-slate-700">{t("categories.subListTitle")}</h3>

        {children.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {children.map((child) => {
              const nestedCount = getDirectChildCategories(child.id, categories).length;

              return (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => onOpenCategory(child.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-start transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                        style={{ backgroundColor: `${child.color}22` }}
                      >
                        {child.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="wrap-text font-medium text-slate-800">{child.name}</span>
                          {nestedCount > 0 ? (
                            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                              {nestedCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-emerald-700">{t("categories.openDetails")}</p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{t("categories.noSubcategoriesYet")}</p>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-100">
          <CategoryQuickAddRow
            parent={category}
            submitting={quickAddSubmitting}
            onSubmit={onQuickAddSubCategory}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <ModalActionButton
          onClick={() => runAndClose(() => onAddSubCategory(category.id))}
          label={t("categories.addSubFull")}
          icon="➕"
          className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        />
        <ModalActionButton
          onClick={() => runAndClose(() => onEdit(category))}
          label={t("common.edit")}
          icon="✏️"
          className="bg-slate-100 text-slate-800 hover:bg-slate-200"
        />
        <ModalActionButton
          onClick={() => runAndClose(() => onDelete(category))}
          label={t("common.delete")}
          icon="🗑️"
          className="bg-red-50 text-red-700 hover:bg-red-100"
        />
      </div>
    </ModalShell>
  );
}
