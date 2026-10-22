"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Category } from "@/lib/types/database";

export type CategorySearchListItem = {
  id: string;
  category: Category | null;
  depth: number;
  pathLabel: string;
  searchText: string;
  hasChildren: boolean;
};

export default function CategorySearchOption({
  item,
  selected,
  highlighted,
  onHighlight,
  onSelect,
}: {
  item: CategorySearchListItem;
  selected: boolean;
  highlighted: boolean;
  onHighlight: () => void;
  onSelect: () => void;
}) {
  const t = useTranslations();

  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onMouseEnter={onHighlight}
        onClick={onSelect}
        className={`flex w-full items-start gap-3 px-3 py-2.5 text-start transition ${
          highlighted ? "bg-emerald-50" : "hover:bg-slate-50"
        } ${selected ? "font-medium text-emerald-800" : "text-slate-800"}`}
      >
        {item.category ? (
          <>
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base"
              style={{ backgroundColor: `${item.category.color}22` }}
            >
              {item.category.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{item.category.name}</span>
              {item.depth > 0 ? (
                <span className="mt-0.5 block text-xs text-slate-500">{item.pathLabel}</span>
              ) : item.hasChildren ? (
                <span className="mt-0.5 block text-xs text-slate-500">
                  {t("categories.hasSubcategories")}
                </span>
              ) : null}
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-600">{item.pathLabel}</span>
        )}
      </button>
    </li>
  );
}
