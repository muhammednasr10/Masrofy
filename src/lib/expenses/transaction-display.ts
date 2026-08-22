import type { Transaction } from "@/lib/types/database";

type TransactionLabelMessages = {
  typeIncome: string;
  typeTransfer: string;
  noCategory: string;
};

export function getTransactionCategoryLabel(
  transaction: Transaction,
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

export function getTransactionAmountTone(transaction: Transaction) {
  if (transaction.type === "expense") {
    return "expense" as const;
  }

  if (transaction.type === "transfer" && transaction.transfer_role === "out") {
    return "expense" as const;
  }

  return "income" as const;
}
