"use client";

import { FormEvent, useEffect, useState } from "react";
import CategoriesTable from "@/components/categories/CategoriesTable";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import { createClient } from "@/lib/supabase/client";
import {
  buildCategoryPayload,
  categoryHasChildren,
  categoryToFormState,
  emptyCategoryForm,
  getCategoryDescendantIds,
  getNextCategorySortOrder,
  updateCategory,
} from "@/lib/categories";
import type { CategoryFormState } from "@/lib/categories/form";
import type { Category } from "@/lib/types/database";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      setCategories((data ?? []) as Category[]);
      setLoading(false);
    }

    loadCategories();
  }, []);

  function openForm(parentCategoryId: string | null = null) {
    setForm(emptyCategoryForm(parentCategoryId));
    setError(null);
  }

  function openEditForm(category: Category) {
    setForm(categoryToFormState(category));
    setError(null);
  }

  function closeForm() {
    setForm(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();

    if (form.editingCategoryId) {
      const result = await updateCategory(supabase, form);

      if (result.error || !result.category) {
        setError(result.error ?? "تعذّر حفظ التعديلات.");
        setSubmitting(false);
        return;
      }

      setCategories((current) =>
        current.map((item) => (item.id === result.category!.id ? result.category! : item)),
      );
      closeForm();
      setSubmitting(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("يجب تسجيل الدخول أولاً.");
      setSubmitting(false);
      return;
    }

    const sortOrder = getNextCategorySortOrder(categories, form.parentCategoryId);
    const { data, error: insertError } = await supabase
      .from("categories")
      .insert(buildCategoryPayload(form, user.id, sortOrder))
      .select("*")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setCategories((current) => [...current, data as Category]);
    closeForm();
    setSubmitting(false);
  }

  async function handleDelete(category: Category) {
    const hasChildren = categoryHasChildren(category.id, categories);
    const message = hasChildren
      ? `حذف "${category.name}" هيحذف الفئات الفرعية التابعة ليها كمان. متأكد؟`
      : `حذف "${category.name}"؟`;

    if (!window.confirm(message)) {
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
    return <p className="text-sm text-slate-500">جاري تحميل الفئات...</p>;
  }

  return (
    <>
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">فئاتك</h2>
            <p className="mt-1 text-sm text-slate-500">
              {categories.length} فئة • رتّب مصروفاتك بفئات رئيسية وفرعية
            </p>
          </div>

          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            + إضافة فئة
          </button>
        </div>

        {error && !form ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <CategoriesTable
          categories={categories}
          onAddSubCategory={(parentCategoryId) => openForm(parentCategoryId)}
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
