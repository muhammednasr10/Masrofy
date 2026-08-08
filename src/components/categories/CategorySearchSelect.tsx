"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
        setOpen(false);
        setQuery("");
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  function selectItem(categoryId: string) {
    onChange(categoryId);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
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
        <div className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-lg">
          {listItems.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">{t("categories.searchEmpty")}</p>
          ) : (
            <ul role="listbox">
              {listItems.map((item, index) => {
                const isSelected = item.id === value;
                const isHighlighted = index === highlightIndex;

                return (
                  <li key={item.id || "__empty__"} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlightIndex(index)}
                      onClick={() => selectItem(item.id)}
                      className={`flex w-full items-start gap-3 px-3 py-2.5 text-start transition ${
                        isHighlighted ? "bg-emerald-50" : "hover:bg-slate-50"
                      } ${isSelected ? "font-medium text-emerald-800" : "text-slate-800"}`}
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
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {item.pathLabel}
                              </span>
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
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
