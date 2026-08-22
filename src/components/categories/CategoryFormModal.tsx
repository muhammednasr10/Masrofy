"use client";

import { FormEvent } from "react";
import CategoryFormFields from "@/components/categories/CategoryFormFields";
import ModalShell from "@/components/ui/ModalShell";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { CategoryFormState } from "@/lib/categories/form";
import type { Category } from "@/lib/types/database";

type CategoryFormModalProps = {
  form: CategoryFormState;
  categories: Category[];
  submitting: boolean;
  error: string | null;
  onChange: (form: CategoryFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  zIndexClassName?: string;
};

export default function CategoryFormModal({
  form,
  categories,
  submitting,
  error,
  onChange,
  onSubmit,
  onClose,
  zIndexClassName,
}: CategoryFormModalProps) {
  const t = useTranslations();
  const isEditing = Boolean(form.editingCategoryId);
  const title = isEditing
    ? t("categories.editTitle")
    : form.parentCategoryId
      ? t("categories.addSubTitle")
      : t("categories.addTitle");
  const description = isEditing
    ? t("categories.editDesc")
    : form.parentCategoryId
      ? t("categories.addSubDesc")
      : t("categories.addDesc");

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg" zIndexClassName={zIndexClassName}>
      <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
          >
            {t("common.close")}
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <CategoryFormFields
            form={form}
            categories={categories}
            onChange={onChange}
            lockParent={Boolean(form.parentCategoryId && !isEditing)}
          />

          {error ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting
                ? t("categories.saving")
                : isEditing
                  ? t("categories.saveChanges")
                  : t("categories.save")}
            </button>
          </div>
        </form>
    </ModalShell>
  );
}
