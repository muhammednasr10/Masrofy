"use client";

import { FormEvent, useEffect, useState } from "react";
import CategoriesTable from "@/components/categories/CategoriesTable";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import {
  categoryToFormState,
  emptyCategoryForm,
  importDefaultCategories,
  insertCategory,
  categoryHasChildren,
  getCategoryDescendantIds,
  updateCategory,
} from "@/lib/categories";
import type { CategoryFormState } from "@/lib/categories/form";
import type { Category } from "@/lib/types/database";

export default function CategoriesPage() {
  const t = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importingDefaults, setImportingDefaults] = useState(false);
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadCategories() {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function openForm(parentCategoryId: string | null = null) {
    setForm(emptyCategoryForm(parentCategoryId));
    setError(null);
    setMessage(null);
  }

  function openEditForm(category: Category) {
    setForm(categoryToFormState(category));
    setError(null);
    setMessage(null);
  }

  function closeForm() {
    setForm(null);
    setError(null);
  }

  async function saveCategory(formState: CategoryFormState) {
    const supabase = createClient();

    if (formState.editingCategoryId) {
      const result = await updateCategory(supabase, formState);

      if (result.error || !result.category) {
        setError(result.error ?? "تعذّر حفظ التعديلات.");
        return false;
      }

      setCategories((current) =>
        current.map((item) => (item.id === result.category!.id ? result.category! : item)),
      );
      return true;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("يجب تسجيل الدخول أولاً.");
      return false;
    }

    const result = await insertCategory(supabase, user.id, formState, categories);

    if (result.error || !result.category) {
      setError(result.error ?? "تعذّر حفظ الفئة.");
      return false;
    }

    setCategories((current) => {
      const existingIndex = current.findIndex((item) => item.id === result.category!.id);
      if (existingIndex >= 0) {
        return current.map((item) => (item.id === result.category!.id ? result.category! : item));
      }

      return [...current, result.category!];
    });
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const saved = await saveCategory(form);

    if (saved) {
      closeForm();
    }

    setSubmitting(false);
  }

  async function handleQuickAddSubCategory(parent: Category, name: string) {
    setQuickAddSubmitting(true);
    setError(null);
    setMessage(null);

    const formState = emptyCategoryForm(parent.id);
    formState.name = name;
    formState.icon = parent.icon;
    formState.color = parent.color;

    const saved = await saveCategory(formState);

    if (!saved) {
      setQuickAddSubmitting(false);
      return;
    }

    setQuickAddSubmitting(false);
  }

  async function handleImportDefaults() {
    setImportingDefaults(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { result, error: importError } = await importDefaultCategories(supabase);

    if (importError || !result) {
      setError(importError ?? t("categories.importDefaultsError"));
      setImportingDefaults(false);
      return;
    }

    await loadCategories();

    if (result.inserted === 0 && result.synced === 0) {
      setMessage(t("categories.importDefaultsNothing"));
    } else {
      setMessage(
        t("categories.importDefaultsSuccess", {
          inserted: String(result.inserted),
          synced: String(result.synced),
        }),
      );
    }

    setImportingDefaults(false);
  }

  async function handleDelete(category: Category) {
    const hasChildren = categoryHasChildren(category.id, categories);
    const messageText = hasChildren
      ? `حذف "${category.name}" هيحذف الفئات الفرعية التابعة ليها كمان. متأكد؟`
      : `حذف "${category.name}"؟`;

    if (!window.confirm(messageText)) {
      return;
    }

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setCategories((current) => {
      const removeIds = new Set([category.id, ...getCategoryDescendantIds(category.id, current)]);

      return current.filter((item) => !removeIds.has(item.id));
    });
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  return (
    <>
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t("nav.categories")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {categories.length} فئة • اضغط على الفئة لعرض التفاصيل والفرعية.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={importingDefaults}
              onClick={() => void handleImportDefaults()}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
            >
              {importingDefaults ? t("categories.importDefaultsLoading") : t("categories.importDefaults")}
            </button>
            <button
              type="button"
              onClick={() => openForm()}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              + {t("categories.typeRoot")}
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
        ) : null}

        {error && !form ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <CategoriesTable
          categories={categories}
          quickAddSubmitting={quickAddSubmitting}
          onAddSubCategory={(parentCategoryId) => openForm(parentCategoryId)}
          onQuickAddSubCategory={handleQuickAddSubCategory}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      </section>

      {form ? (
        <CategoryFormModal
          form={form}
          categories={categories}
          submitting={submitting}
          error={error}
          onChange={setForm}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      ) : null}
    </>
  );
}
