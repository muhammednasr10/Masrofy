"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types/database";

const colorOptions = ["#f97316", "#3b82f6", "#eab308", "#ec4899", "#22c55e", "#a855f7", "#64748b"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState(colorOptions[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("*").order("name");
      setCategories((data ?? []) as Category[]);
      setLoading(false);
    }

    loadCategories();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: name.trim(),
        icon,
        color,
      })
      .select("*")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setCategories((current) =>
      [...current, data as Category].sort((a, b) => a.name.localeCompare(b.name, "ar")),
    );
    setName("");
    setIcon("📦");
    setColor(colorOptions[0]);
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setCategories((current) => current.filter((category) => category.id !== id));
  }

  if (loading) {
    return <p className="text-sm text-slate-500">جاري تحميل الفئات...</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">إضافة فئة</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">اسم الفئة</span>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">الأيقونة</span>
            <input
              type="text"
              maxLength={4}
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">اللون</span>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={`h-10 w-10 rounded-full border-2 ${
                    color === option ? "border-slate-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: option }}
                  aria-label={option}
                />
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "جاري الحفظ..." : "حفظ الفئة"}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">فئاتك</h2>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
                  style={{ backgroundColor: `${category.color}22` }}
                >
                  {category.icon}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{category.name}</p>
                  <p className="text-xs text-slate-500">{category.color}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(category.id)}
                className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-red-600"
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
