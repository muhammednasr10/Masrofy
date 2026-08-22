"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Category } from "@/lib/types/database";

type CategoryQuickAddRowProps = {
  parent: Category;
  submitting: boolean;
  onSubmit: (parent: Category, name: string) => Promise<void>;
};

export default function CategoryQuickAddRow({
  parent,
  submitting,
  onSubmit,
}: CategoryQuickAddRowProps) {
  const t = useTranslations();
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    await onSubmit(parent, trimmed);
    setName("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-dashed border-emerald-100 bg-emerald-50/40 px-4 py-3 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-600">
        <span aria-hidden>{parent.icon}</span>
        <span className="truncate">
          {t("categories.quickAddUnder")} <strong className="text-slate-800">{parent.name}</strong>
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("categories.quickAddPlaceholder")}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 sm:w-48"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? t("categories.saving") : t("categories.quickAddButton")}
        </button>
      </div>
    </form>
  );
}
