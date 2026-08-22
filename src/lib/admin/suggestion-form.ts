import type { CategorySuggestion, DefaultCategory } from "@/lib/types/database";

export type SuggestionReviewFormState = {
  name: string;
  icon: string;
  color: string;
  isSub: boolean;
  parentName: string | null;
};

export type SuggestionReviewEdits = {
  name: string;
  icon: string;
  color: string;
  parentName: string | null;
};

export function suggestionToForm(suggestion: CategorySuggestion): SuggestionReviewFormState {
  return {
    name: suggestion.name,
    icon: suggestion.icon,
    color: suggestion.color,
    isSub: Boolean(suggestion.parent_name),
    parentName: suggestion.parent_name,
  };
}

export function getDefaultCatalogRootNames(catalog: DefaultCategory[]): string[] {
  const names = catalog.filter((item) => !item.parent_name).map((item) => item.name);
  return [...new Set(names)];
}

export function buildParentNameOptions(
  catalog: DefaultCategory[],
  currentParentName: string | null,
): string[] {
  const options = getDefaultCatalogRootNames(catalog);

  if (currentParentName && !options.includes(currentParentName)) {
    return [currentParentName, ...options];
  }

  return options;
}

export function formToReviewEdits(form: SuggestionReviewFormState): SuggestionReviewEdits {
  return {
    name: form.name.trim(),
    icon: form.icon,
    color: form.color,
    parentName: form.isSub ? form.parentName?.trim() || null : null,
  };
}

export function validateSuggestionReviewForm(form: SuggestionReviewFormState): string | null {
  if (!form.name.trim()) {
    return "أدخل اسم الفئة.";
  }

  if (form.isSub && !form.parentName?.trim()) {
    return "اختر الفئة الرئيسية.";
  }

  return null;
}
