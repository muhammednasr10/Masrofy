import { splitCategoryPath } from "@/lib/categories/hierarchy";
import type { Category, Transaction } from "@/lib/types/database";

type TransactionLabelMessages = {
  typeIncome: string;
  typeTransfer: string;
  noCategory: string;
};

function formatCategoryItem(item: Pick<Category, "name" | "icon">) {
  return `${item.icon} ${item.name}`.trim();
}

export function getTransactionCategoryLabel(
  transaction: Pick<Transaction, "type" | "categories">,
  messages: TransactionLabelMessages,
) {
  if (transaction.categories?.name) {
    return transaction.categories.name;
  }

  if (transaction.type === "income") {
    return messages.typeIncome;
  }

  if (transaction.type === "transfer") {
    return messages.typeTransfer;
  }

  return messages.noCategory;
}

export function getTransactionCategoryColumns(
  transaction: Pick<Transaction, "category_id" | "type" | "categories">,
  categories: Category[],
  messages: TransactionLabelMessages,
) {
  const fallback = getTransactionCategoryLabel(transaction, messages);
  const category = categories.find((item) => item.id === transaction.category_id);

  if (!category) {
    const icon = transaction.categories?.icon;
    return {
      mainLabel: icon ? `${icon} ${fallback}` : fallback,
      subLabel: "—",
    };
  }

  const { root, branches } = splitCategoryPath(category, categories);

  return {
    mainLabel: root ? formatCategoryItem(root) : fallback,
    subLabel: branches.length
      ? branches.map((item) => formatCategoryItem(item)).join(" › ")
      : "—",
  };
}

export function getTransactionAmountTone(transaction: Transaction) {
  if (transaction.type === "expense") {
    return "expense" as const;
  }

  if (transaction.type === "transfer" && transaction.transfer_role === "out") {
    return "expense" as const;
  }

  return "income" as const;
}
