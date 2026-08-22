"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSuggestionReviewModal from "@/components/admin/AdminSuggestionReviewModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import { formatProfileLabel } from "@/lib/admin/suggestions";
import type { SuggestionReviewEdits } from "@/lib/admin/suggestion-form";
import type { CategorySuggestion, DefaultCategory } from "@/lib/types/database";

type AdminDefaultsPanelProps = {
  suggestions: CategorySuggestion[];
  catalog: DefaultCategory[];
  error: string | null;
  actingId: string | null;
  onReview: (id: string, approve: boolean, edits?: SuggestionReviewEdits) => void;
  onReviewMany: (ids: string[], approve: boolean) => void;
  onSaveEdits: (id: string, edits: SuggestionReviewEdits) => Promise<void>;
};

export default function AdminDefaultsPanel({
  suggestions,
  catalog,
  error,
  actingId,
  onReview,
  onReviewMany,
  onSaveEdits,
}: AdminDefaultsPanelProps) {
  const t = useTranslations();
  const { formatDate } = useFormat();
  const [editingSuggestion, setEditingSuggestion] = useState<CategorySuggestion | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isBulkActing = actingId === "bulk";
  const isBusy = actingId !== null;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = suggestions.length > 0 && selectedIds.length === suggestions.length;
  const hasSelection = selectedIds.length > 0;

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => suggestions.some((suggestion) => suggestion.id === id)),
    );
  }, [suggestions]);

  useEffect(() => {
    if (editingSuggestion && !suggestions.some((suggestion) => suggestion.id === editingSuggestion.id)) {
      setEditingSuggestion(null);
    }

    if (previewId && !suggestions.some((suggestion) => suggestion.id === previewId)) {
      setPreviewId(null);
    }
  }, [editingSuggestion, previewId, suggestions]);

  function closeEditModal() {
    if (isBusy) {
      return;
    }

    setEditingSuggestion(null);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : suggestions.map((suggestion) => suggestion.id));
  }

  function runBulkAction(approve: boolean) {
    if (!hasSelection) {
      return;
    }

    onReviewMany(selectedIds, approve);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t("admin.suggestionsTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("admin.suggestionsDesc")}</p>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {suggestions.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {t("admin.suggestionsEmpty")}
          </p>
        ) : (
          <>
            <div className="mt-6 space-y-3 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-sm font-medium text-emerald-900">{t("admin.suggestionsBulkHint")}</p>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={isBusy}
                    onChange={toggleSelectAll}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium">{t("admin.suggestionsSelectAll")}</span>
                  <span className="text-xs text-slate-500">
                    {hasSelection
                      ? t("admin.suggestionsSelectedCount", { count: selectedIds.length })
                      : t("admin.suggestionsNoneSelected")}
                  </span>
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isBusy || !hasSelection}
                    onClick={() => runBulkAction(true)}
                    className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBulkActing ? t("admin.suggestionReviewSaving") : t("admin.suggestionsBulkApprove")}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy || !hasSelection}
                    onClick={() => runBulkAction(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("admin.suggestionsBulkReject")}
                  </button>
                  {hasSelection ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setSelectedIds([])}
                      className="rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white disabled:opacity-60"
                    >
                      {t("admin.suggestionsClearSelection")}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {suggestions.map((suggestion) => {
                const isSelected = selectedSet.has(suggestion.id);
                const isRowBusy = actingId === suggestion.id || isBulkActing;
                const isPreviewOpen = previewId === suggestion.id;

                return (
                  <article
                    key={suggestion.id}
                    className={`rounded-2xl border p-4 ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isBusy}
                          onChange={() => toggleSelection(suggestion.id)}
                          aria-label={suggestion.name}
                          className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                          style={{ backgroundColor: `${suggestion.color}22` }}
                        >
                          {suggestion.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400">
                            {formatDate(suggestion.created_at)}
                          </p>
                          <p className="mt-0.5 font-medium text-slate-900">{suggestion.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {suggestion.parent_name
                              ? `${t("categories.under")} ${suggestion.parent_name}`
                              : t("categories.typeRoot")}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {t("admin.suggestionsAuthor", {
                              author: formatProfileLabel(
                                suggestion.profiles,
                                t("admin.suggestionsUnknownAuthor"),
                              ),
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 ps-8 lg:ps-0 lg:justify-end">
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => onReview(suggestion.id, true)}
                          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {t("admin.approve")}
                        </button>
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => {
                            setPreviewId(null);
                            setEditingSuggestion(suggestion);
                          }}
                          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() =>
                            setPreviewId((current) =>
                              current === suggestion.id ? null : suggestion.id,
                            )
                          }
                          className={`rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
                            isPreviewOpen
                              ? "border-slate-300 bg-slate-100 text-slate-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {t("admin.suggestionPreviewAction")}
                        </button>
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => onReview(suggestion.id, false)}
                          className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          {t("admin.reject")}
                        </button>
                      </div>
                    </div>

                    {isPreviewOpen ? (
                      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                        <p className="font-medium text-slate-900">{t("admin.suggestionPreviewTitle")}</p>
                        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-slate-500">{t("categories.nameLabel")}</dt>
                            <dd className="mt-0.5 font-medium text-slate-900">{suggestion.name}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">{t("categories.kindLabel")}</dt>
                            <dd className="mt-0.5 text-slate-800">
                              {suggestion.parent_name
                                ? `${t("categories.typeSub")} — ${suggestion.parent_name}`
                                : t("categories.typeRoot")}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">{t("categories.iconLabel")}</dt>
                            <dd className="mt-0.5 text-xl">{suggestion.icon}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">{t("categories.colorLabel")}</dt>
                            <dd className="mt-1 flex items-center gap-2">
                              <span
                                className="h-6 w-6 rounded-full border border-slate-200"
                                style={{ backgroundColor: suggestion.color }}
                              />
                              <span className="text-slate-700">{suggestion.color}</span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t("admin.catalogTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("admin.catalogDesc")}</p>
        <p className="mt-2 text-xs text-slate-400">{t("admin.catalogSourceHint")}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {catalog.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3"
            >
              <span>{category.icon}</span>
              <div>
                <p className="text-sm font-medium text-slate-900">{category.name}</p>
                {category.parent_name ? (
                  <p className="text-xs text-slate-500">
                    {t("categories.under")} {category.parent_name}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">{t("categories.typeRoot")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {editingSuggestion ? (
        <AdminSuggestionReviewModal
          suggestion={editingSuggestion}
          catalog={catalog}
          saving={actingId === editingSuggestion.id}
          onClose={closeEditModal}
          onSaveEdits={async (edits) => {
            await onSaveEdits(editingSuggestion.id, edits);
            setEditingSuggestion(null);
          }}
          onApprove={(edits) => {
            onReview(editingSuggestion.id, true, edits);
          }}
          onReject={() => {
            onReview(editingSuggestion.id, false);
          }}
        />
      ) : null}
    </div>
  );
}
