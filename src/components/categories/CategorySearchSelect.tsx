"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import CategorySearchOption from "@/components/categories/CategorySearchOption";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  buildCategorySearchIndex,
  getCategoryFullPathLabel,
  searchCategoryItems,
} from "@/lib/categories";
import type { Category } from "@/lib/types/database";

type CategorySearchSelectProps = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  placeholder?: string;
  listInFlow?: boolean;
  onQueryChange?: (query: string) => void;
  onCreateNew?: (query: string) => void;
};

export default function CategorySearchSelect({
  categories,
  value,
  onChange,
  className,
  required,
  disabled,
  allowEmpty = false,
  emptyLabel,
  placeholder,
  listInFlow = false,
  onQueryChange,
  onCreateNew,
}: CategorySearchSelectProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const items = useMemo(() => buildCategorySearchIndex(categories), [categories]);
  const filteredItems = useMemo(
    () => searchCategoryItems(query, items),
    [items, query],
  );
  const selectedCategory = categories.find((category) => category.id === value);
  const selectedLabel = selectedCategory
    ? getCategoryFullPathLabel(selectedCategory, categories)
    : "";

  const listItems = allowEmpty
    ? [
        {
          id: "",
          category: null as Category | null,
          depth: 0,
          pathLabel: emptyLabel ?? t("categories.noCategory"),
          searchText: "",
          hasChildren: false,
        },
        ...filteredItems,
      ]
    : filteredItems;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        window.setTimeout(() => {
          setOpen(false);
          setQuery("");
          onQueryChange?.("");
        }, 0);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onQueryChange, open]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  function selectItem(categoryId: string) {
    onChange(categoryId);
    setOpen(false);
    setQuery("");
    onQueryChange?.("");
  }

  function createNew() {
    const name = query.trim();
    setOpen(false);
    setQuery("");
    onQueryChange?.("");
    onCreateNew?.(name);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) => Math.min(current + 1, listItems.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = listItems[highlightIndex];

      if (item) {
        selectItem(item.id);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center gap-2 ${className ?? ""}`}>
        <input
          ref={inputRef}
          type="text"
          value={open ? query : selectedLabel}
          onChange={(event) => {
            setQuery(event.target.value);
            onQueryChange?.(event.target.value);
            if (!open) {
              setOpen(true);
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("categories.searchPlaceholder")}
          disabled={disabled}
          required={required && !allowEmpty}
          className="min-w-0 flex-1 bg-transparent outline-none"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            setOpen((current) => !current);
            if (!open) {
              inputRef.current?.focus();
            }
          }}
          className="shrink-0 rounded-full px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={t("categories.toggleList")}
        >
          {open ? "▲" : "▼"}
        </button>
      </div>

      {open ? (
        <div
          className={
            listInFlow
              ? "mt-2 max-h-32 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 md:max-h-48 md:py-2"
              : "absolute inset-x-0 top-[calc(100%+0.35rem)] z-50 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-lg md:max-h-64"
          }
        >
          {listItems.length === 0 ? (
            <div className="px-4 py-3">
              <p className="text-sm text-slate-500">{t("categories.searchEmpty")}</p>
              {onCreateNew ? (
                <button
                  type="button"
                  onClick={createNew}
                  className="mt-2 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
                >
                  {t("expenses.addCategory")}
                </button>
              ) : null}
            </div>
          ) : (
            <ul role="listbox">
              {listItems.map((item, index) => (
                <CategorySearchOption
                  key={item.id || "__empty__"}
                  item={item}
                  selected={item.id === value}
                  highlighted={index === highlightIndex}
                  onHighlight={() => setHighlightIndex(index)}
                  onSelect={() => selectItem(item.id)}
                />
              ))}
            </ul>
          )}
          {onCreateNew && listItems.length > 0 ? (
            <button
              type="button"
              onClick={createNew}
              className="mt-1 w-full border-t border-slate-100 px-4 py-2.5 text-start text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              {t("expenses.addCategory")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
