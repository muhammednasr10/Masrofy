"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { CategorySuggestion, DefaultCategory } from "@/lib/types/database";

export default function AdminCategoriesPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [catalog, setCatalog] = useState<DefaultCategory[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: profile } = await supabase.from("profiles").select("is_admin").maybeSingle();

    if (!profile?.is_admin) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    const [{ data: suggestionRows }, { data: catalogRows }] = await Promise.all([
      supabase
        .from("category_suggestions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("default_categories").select("*").eq("is_active", true).order("sort_order"),
    ]);

    setSuggestions((suggestionRows ?? []) as CategorySuggestion[]);
    setCatalog((catalogRows ?? []) as DefaultCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!loading && forbidden) {
      router.replace("/dashboard");
    }
  }, [forbidden, loading, router]);

  async function review(id: string, approve: boolean) {
    setActingId(id);
    setError(null);
    const supabase = createClient();
    const { error: reviewError } = await supabase.rpc("review_category_suggestion", {
      p_id: id,
      p_approve: approve,
    });

    if (reviewError) {
      setError(reviewError.message);
      setActingId(null);
      return;
    }

    await load();
    setActingId(null);
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  if (forbidden) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{t("admin.suggestionsTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("admin.suggestionsDesc")}</p>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {suggestions.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {t("admin.suggestionsEmpty")}
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {suggestions.map((suggestion) => (
              <article
                key={suggestion.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${suggestion.color}22` }}
                  >
                    {suggestion.icon}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{suggestion.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {suggestion.parent_name
                        ? `${t("categories.under")} ${suggestion.parent_name}`
                        : t("categories.typeRoot")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{suggestion.user_id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actingId === suggestion.id}
                    onClick={() => void review(suggestion.id, true)}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {t("admin.approve")}
                  </button>
                  <button
                    type="button"
                    disabled={actingId === suggestion.id}
                    onClick={() => void review(suggestion.id, false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {t("admin.reject")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{t("admin.catalogTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("admin.catalogDesc")}</p>
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
    </div>
  );
}
