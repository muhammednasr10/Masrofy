"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fallbackDefaultCategories, rootCatalogCategories } from "@/lib/categories/catalog";

type CategoryStepProps = {
  selectedCategories: string[];
  onToggle: (name: string) => void;
};

export default function OnboardingCategoryStep({
  selectedCategories,
  onToggle,
}: CategoryStepProps) {
  const [options, setOptions] = useState(rootCatalogCategories(fallbackDefaultCategories()));

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("default_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setOptions(rootCatalogCategories(data));
        }
      });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">2. فئات المصروفات</h2>
      <p className="text-sm text-slate-500">اختار الفئات اللي هتستخدمها في تسجيل المصروفات.</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((category) => {
          const selected = selectedCategories.includes(category.name);

          return (
            <button
              key={category.name}
              type="button"
              onClick={() => onToggle(category.name)}
              className={`rounded-2xl border px-4 py-3 text-right transition ${
                selected
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {category.icon} {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
