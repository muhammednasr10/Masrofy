"use client";

import type { Category } from "@/lib/types/database";
import {
  buildCategorySelectGroups,
  getCategorySelectGroupLabel,
  getCategorySelectOptionLabel,
} from "@/lib/categories/hierarchy";

type CategorySelectProps = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export default function CategorySelect({
  categories,
  value,
  onChange,
  className,
  required,
  disabled,
  allowEmpty = false,
  emptyLabel = "بدون فئة",
}: CategorySelectProps) {
  const groups = buildCategorySelectGroups(categories);

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      disabled={disabled}
      className={className}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {groups.map(({ parent, children }) =>
        children.length > 0 ? (
          <optgroup key={parent.id} label={getCategorySelectGroupLabel(parent)}>
            <option value={parent.id}>
              {getCategorySelectOptionLabel(parent, "parent")}
            </option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {getCategorySelectOptionLabel(child, "child")}
              </option>
            ))}
          </optgroup>
        ) : (
          <option key={parent.id} value={parent.id}>
            {getCategorySelectOptionLabel(parent, "standalone")}
          </option>
        ),
      )}
    </select>
  );
}
