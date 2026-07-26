"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildCategoryPayload,
  emptyCategoryForm,
  getNextCategorySortOrder,
  getParentCategories,
} from "@/lib/categories";
import type { CategoryFormState } from "@/lib/categories/form";
import type { Category } from "@/lib/types/database";

export function useCategoryForm(categories: Category[], onCreated?: (category: Category) => void) {
  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentOptions = useMemo(
    () => getParentCategories(categories),
    [categories],
  );

  function openForm(parentCategoryId: string | null = null) {
    setForm(emptyCategoryForm(parentCategoryId));
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

    onCreated?.(data as Category);
    closeForm();
    setSubmitting(false);
  }

  return {
    form,
    submitting,
    error,
    parentOptions,
    openForm,
    closeForm,
    setForm,
    handleSubmit,
  };
}
