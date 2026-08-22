"use client";

import { FormEvent, useMemo, useState } from "react";
import AdminSuggestionFormFields from "@/components/admin/AdminSuggestionFormFields";
import ModalShell from "@/components/ui/ModalShell";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  buildParentNameOptions,
  formToReviewEdits,
  suggestionToForm,
  validateSuggestionReviewForm,
  type SuggestionReviewEdits,
} from "@/lib/admin/suggestion-form";
import { formatProfileLabel } from "@/lib/admin/suggestions";
import type { CategorySuggestion, DefaultCategory } from "@/lib/types/database";

type AdminSuggestionReviewModalProps = {
  suggestion: CategorySuggestion;
  catalog: DefaultCategory[];
  saving: boolean;
  onClose: () => void;
  onSaveEdits: (edits: SuggestionReviewEdits) => void;
  onApprove: (edits: SuggestionReviewEdits) => void;
  onReject: () => void;
};

export default function AdminSuggestionReviewModal({
  suggestion,
  catalog,
  saving,
  onClose,
  onSaveEdits,
  onApprove,
  onReject,
}: AdminSuggestionReviewModalProps) {
  const t = useTranslations();
  const [form, setForm] = useState(() => suggestionToForm(suggestion));
  const [error, setError] = useState<string | null>(null);

  const parentOptions = useMemo(
    () => buildParentNameOptions(catalog, suggestion.parent_name),
    [catalog, suggestion.parent_name],
  );

  function submitEdits(action: "save" | "approve") {
    const validationError = validateSuggestionReviewForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const edits = formToReviewEdits(form);

    if (action === "save") {
      onSaveEdits(edits);
      return;
    }

    onApprove(edits);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitEdits("approve");
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("admin.suggestionEditTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("admin.suggestionEditDesc")}</p>
          <p className="mt-2 text-xs text-slate-400">
            {t("admin.suggestionsAuthor", {
              author: formatProfileLabel(
                suggestion.profiles,
                t("admin.suggestionsUnknownAuthor"),
              ),
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          {t("common.close")}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <AdminSuggestionFormFields
          form={form}
          parentOptions={parentOptions}
          onChange={setForm}
        />

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => submitEdits("save")}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {saving ? t("admin.suggestionReviewSaving") : t("admin.suggestionSaveEdits")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? t("admin.suggestionReviewSaving") : t("admin.approve")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onReject}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {t("admin.reject")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-2xl px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
