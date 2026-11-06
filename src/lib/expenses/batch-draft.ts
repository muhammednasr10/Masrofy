import type { TransactionType } from "@/lib/types/database";

export type TransactionDraftLine = {
  id: string;
  type: Extract<TransactionType, "expense" | "income">;
  categoryId: string;
  amount: string;
  note: string;
};

export type ReadyTransactionDraft = {
  type: TransactionDraftLine["type"];
  categoryId: string | null;
  amount: number;
  note: string | null;
};

export function createTransactionDraftLine(
  type: TransactionDraftLine["type"] = "expense",
): TransactionDraftLine {
  return {
    id: crypto.randomUUID(),
    type,
    categoryId: "",
    amount: "",
    note: "",
  };
}

function isBlankLine(line: TransactionDraftLine) {
  return !line.amount.trim() && !line.note.trim() && !line.categoryId;
}

export function parseTransactionDrafts(lines: TransactionDraftLine[]) {
  const ready: ReadyTransactionDraft[] = [];

  for (const line of lines) {
    if (isBlankLine(line)) {
      continue;
    }

    const amount = Number(line.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "اكتب مبلغ أكبر من صفر في كل سطر.", lines: [] as ReadyTransactionDraft[] };
    }

    if (line.type === "expense" && !line.categoryId) {
      return { error: "اختَر فئة لكل مصروف.", lines: [] as ReadyTransactionDraft[] };
    }

    ready.push({
      type: line.type,
      categoryId: line.categoryId || null,
      amount,
      note: line.note.trim() || null,
    });
  }

  if (ready.length === 0) {
    return { error: "أضف معاملة واحدة على الأقل.", lines: [] as ReadyTransactionDraft[] };
  }

  return { error: null, lines: ready };
}
