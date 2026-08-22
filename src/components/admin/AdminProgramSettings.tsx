"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminAccountsPanel from "@/components/admin/AdminAccountsPanel";
import AdminDefaultsPanel from "@/components/admin/AdminDefaultsPanel";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import { loadPendingCategorySuggestions } from "@/lib/admin/suggestions";
import type { SuggestionReviewEdits } from "@/lib/admin/suggestion-form";
import type { CategorySuggestion, DefaultCategory, Profile } from "@/lib/types/database";

type AdminSettingsTab = "defaults" | "accounts";

export default function AdminProgramSettings() {
  const t = useTranslations();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("defaults");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [catalog, setCatalog] = useState<DefaultCategory[]>([]);
  const [accounts, setAccounts] = useState<Profile[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: isAdmin } = await supabase.rpc("is_admin");

    if (!isAdmin) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    const [suggestionRows, { data: catalogRows }, { data: accountRows, error: accountsError }] =
      await Promise.all([
        loadPendingCategorySuggestions(supabase),
        supabase.from("default_categories").select("*").eq("is_active", true).order("sort_order"),
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    if (accountsError) {
      setError(accountsError.message);
    }

    setSuggestions(suggestionRows);
    setCatalog((catalogRows ?? []) as DefaultCategory[]);
    setAccounts((accountRows ?? []) as Profile[]);
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

  async function reviewMany(ids: string[], approve: boolean) {
    if (ids.length === 0) {
      return;
    }

    setActingId("bulk");
    setError(null);
    const supabase = createClient();

    for (const id of ids) {
      const { error: reviewError } = await supabase.rpc("review_category_suggestion", {
        p_id: id,
        p_approve: approve,
      });

      if (reviewError) {
        setError(reviewError.message);
        break;
      }
    }

    await load();
    setActingId(null);
  }

  async function review(id: string, approve: boolean, edits?: SuggestionReviewEdits) {
    setActingId(id);
    setError(null);
    const supabase = createClient();

    if (edits) {
      const { error: updateError } = await supabase
        .from("category_suggestions")
        .update({
          name: edits.name,
          icon: edits.icon,
          color: edits.color,
          parent_name: edits.parentName,
        })
        .eq("id", id)
        .eq("status", "pending");

      if (updateError) {
        setError(updateError.message);
        setActingId(null);
        return;
      }
    }

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

  async function saveEdits(id: string, edits: SuggestionReviewEdits) {
    setActingId(id);
    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("category_suggestions")
      .update({
        name: edits.name,
        icon: edits.icon,
        color: edits.color,
        parent_name: edits.parentName,
      })
      .eq("id", id)
      .eq("status", "pending");

    if (updateError) {
      setError(updateError.message);
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

  const tabs: Array<{ id: AdminSettingsTab; label: string }> = [
    { id: "defaults", label: t("admin.tabDefaults") },
    { id: "accounts", label: t("admin.tabAccounts") },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-100 bg-amber-50/50 p-5">
        <h1 className="text-xl font-semibold text-slate-900">{t("admin.settingsTitle")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("admin.settingsDesc")}</p>
      </section>

      <div className="x-scroll flex max-w-full gap-2 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setError(null);
            }}
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "defaults" ? (
        <AdminDefaultsPanel
          suggestions={suggestions}
          catalog={catalog}
          error={error}
          actingId={actingId}
          onReview={(id, approve, edits) => void review(id, approve, edits)}
          onReviewMany={(ids, approve) => void reviewMany(ids, approve)}
          onSaveEdits={(id, edits) => saveEdits(id, edits)}
        />
      ) : (
        <AdminAccountsPanel accounts={accounts} error={error} />
      )}
    </div>
  );
}
