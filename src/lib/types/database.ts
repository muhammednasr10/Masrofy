export type TransactionType = "expense" | "income";

export type Profile = {
  id: string;
  full_name: string | null;
  currency: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  note: string | null;
  transaction_date: string;
  created_at: string;
  categories?: Pick<Category, "name" | "icon" | "color"> | null;
};

export type MonthlySummary = {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  byCategory: Array<{
    categoryId: string | null;
    name: string;
    icon: string;
    color: string;
    total: number;
  }>;
};
