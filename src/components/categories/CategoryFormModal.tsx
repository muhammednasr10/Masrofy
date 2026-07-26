"use client";

import { FormEvent } from "react";
import CategoryFormFields from "@/components/categories/CategoryFormFields";
import ModalShell from "@/components/ui/ModalShell";
import type { CategoryFormState } from "@/lib/categories/form";
import type { Category } from "@/lib/types/database";

type CategoryFormModalProps = {
  form: CategoryFormState;
  parentOptions: Category[];
  submitting: boolean;
  error: string | null;
  onChange: (form: CategoryFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export default function CategoryFormModal({
  form,
  parentOptions,
  submitting,
  error,
  onChange,
  onSubmit,
  onClose,
}: CategoryFormModalProps) {
  const title = form.parentCategoryId ? "إضافة فئة فرعية" : "إضافة فئة";
  const description = form.parentCategoryId
    ? "أضف فئة فرعية تحت الفئة الرئيسية المختارة."
    : "أنشئ فئة رئيسية جديدة أو اختر فئة رئيسية لإضافة فرعية.";

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
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
            إغلاق
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <CategoryFormFields
            form={form}
            parentOptions={parentOptions}
            onChange={onChange}
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
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "جاري الحفظ..." : "حفظ الفئة"}
            </button>
          </div>
        </form>
    </ModalShell>
  );
}
