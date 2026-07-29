"use client";

import { buildCategoryDisplayRows, isSubCategory } from "@/lib/categories";
import type { Category } from "@/lib/types/database";

type CategoriesTableProps = {
  categories: Category[];
  onAddSubCategory: (parentCategoryId: string) => void;
  onDelete: (category: Category) => void;
};

function getParentName(category: Category, categories: Category[]) {
  if (!category.parent_category_id) {
    return "—";
  }

  const parent = categories.find((item) => item.id === category.parent_category_id);
  return parent ? `${parent.icon} ${parent.name}` : "—";
}

export default function CategoriesTable({
  categories,
  onAddSubCategory,
  onDelete,
}: CategoriesTableProps) {
  const rows = buildCategoryDisplayRows(categories);

  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        مفيش فئات لسه. اضغط «إضافة فئة» للبدء.
      </p>
    );
  }

  return (
    <div className="mt-6 x-scroll rounded-2xl border border-slate-100">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <th className="px-4 py-3 text-right font-medium">الفئة</th>
            <th className="px-4 py-3 text-right font-medium">النوع</th>
            <th className="px-4 py-3 text-right font-medium">تحت</th>
            <th className="px-4 py-3 text-right font-medium">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ category, depth }) => (
            <tr key={category.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-4">
                <div
                  className="flex items-center gap-3"
                  style={{ paddingRight: `${depth}rem` }}
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
                {isSubCategory(category) ? "فرعية" : "رئيسية"}
              </td>
              <td className="px-4 py-4 text-slate-600">
                {getParentName(category, categories)}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-1">
                  {!isSubCategory(category) ? (
                    <CategoryIconButton
                      icon="➕"
                      label="إضافة فئة فرعية"
                      onClick={() => onAddSubCategory(category.id)}
                      tone="emerald"
                    />
                  ) : null}
                  <CategoryIconButton
                    icon="🗑️"
                    label="حذف"
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
