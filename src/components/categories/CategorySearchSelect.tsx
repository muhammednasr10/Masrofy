"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
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
  autoFocus?: boolean;
  onQueryChange?: (query: string) => void;
  onCreateNew?: (query: string) => void;
  onPicked?: (categoryId: string) => void;
};

function useIsPhone() {
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    function sync() {
      setIsPhone(media.matches);
    }

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isPhone;
}

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
  autoFocus = false,
  onQueryChange,
  onCreateNew,
  onPicked,
}: CategorySearchSelectProps) {
  const t = useTranslations();
  const isPhone = useIsPhone();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const items = useMemo(() => buildCategorySearchIndex(categories), [categories]);
  const filteredItems = useMemo(() => searchCategoryItems(query, items), [items, query]);
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

  const useSheet = isPhone;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || useSheet) {
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
  }, [onQueryChange, open, useSheet]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!open || !useSheet) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => sheetInputRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, useSheet]);

  function closeList() {
    setOpen(false);
    setQuery("");
    onQueryChange?.("");
  }

  function selectItem(categoryId: string) {
    onChange(categoryId);
    closeList();
    onPicked?.(categoryId);
  }

  function createNew() {
    const name = query.trim();
    closeList();
    onCreateNew?.(name);
  }

  function updateQuery(next: string) {
    setQuery(next);
    onQueryChange?.(next);
    if (!open) {
      setOpen(true);
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
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

  const listBody = (
    <>
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
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center gap-2 ${className ?? ""}`}>
        <input
          ref={inputRef}
          type="text"
          value={open && !useSheet ? query : selectedLabel}
          readOnly={useSheet}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          onKeyDown={useSheet ? undefined : handleKeyDown}
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
            if (!open && !useSheet) {
              inputRef.current?.focus();
            }
          }}
          className="shrink-0 rounded-full px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={t("categories.toggleList")}
        >
          {open ? "▲" : "▼"}
        </button>
      </div>

      {open && !useSheet ? (
        <div
          className={
            listInFlow
              ? "mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 md:max-h-64 md:py-2"
              : "absolute inset-x-0 top-[calc(100%+0.35rem)] z-50 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-lg md:max-h-64"
          }
        >
          {listBody}
        </div>
      ) : null}

      {open && useSheet && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex flex-col justify-end">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/40"
                aria-label={t("common.close")}
                onClick={closeList}
              />
              <div className="relative flex max-h-[85dvh] flex-col rounded-t-3xl border border-white bg-white shadow-2xl">
                <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" />
                <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {placeholder ?? t("categories.searchPlaceholder")}
                  </h3>
                  <button
                    type="button"
                    onClick={closeList}
                    className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
                  >
                    {t("common.close")}
                  </button>
                </div>
                <div className="px-4 pb-2">
                  <input
                    ref={sheetInputRef}
                    type="search"
                    value={query}
                    onChange={(event) => updateQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("categories.searchPlaceholder")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    aria-label={t("categories.searchPlaceholder")}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
                  {listBody}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
