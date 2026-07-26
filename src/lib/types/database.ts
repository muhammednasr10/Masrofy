export type TransactionType = "expense" | "income" | "transfer";

export type TransferRole = "out" | "in";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  currency: string;
  default_wallet_id: string | null;
  onboarding_completed: boolean;
  created_at: string;
};

export type WalletType = "bank" | "cash" | "wallet" | "card" | "investment";

export type CardKind = "debit" | "credit";

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  wallet_type: WalletType;
  icon: string;
  color: string;
  opening_balance: number;
  is_default: boolean;
  sort_order: number;
  parent_wallet_id: string | null;
  investment_id: string | null;
  card_kind: CardKind | null;
  credit_limit: number | null;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  parent_category_id: string | null;
  sort_order: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  wallet_id: string | null;
  category_id: string | null;
  recurring_transaction_id: string | null;
  internal_transfer_id: string | null;
  transfer_role: TransferRole | null;
  amount: number;
  type: TransactionType;
  note: string | null;
  transaction_date: string;
  created_at: string;
  categories?: Pick<Category, "name" | "icon" | "color"> | null;
  wallets?: Pick<Wallet, "name" | "icon" | "color"> | null;
  attachments?: TransactionAttachment[];
};

export type RecurringFrequency = "weekly" | "monthly" | "yearly";

export type RecurringTransaction = {
  id: string;
  user_id: string;
  title: string;
  wallet_id: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  next_due_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  categories?: Pick<Category, "name" | "icon" | "color"> | null;
  wallets?: Pick<Wallet, "name" | "icon" | "color"> | null;
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

export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";
export type RelationshipType = "friend" | "spouse" | "child" | "parent" | "sibling";

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  relationship_type: RelationshipType;
  requester_shares_activity: boolean;
  addressee_shares_activity: boolean;
  created_at: string;
  updated_at: string;
  requester?: Pick<Profile, "full_name" | "email"> | null;
  addressee?: Pick<Profile, "full_name" | "email"> | null;
};

export type WalletTransfer = {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string;
  sender_wallet_name: string;
  receiver_wallet_name: string;
  amount: number;
  note: string | null;
  created_at: string;
  sender?: Pick<Profile, "full_name"> | null;
  receiver?: Pick<Profile, "full_name"> | null;
};

export type InternalWalletTransfer = {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  note: string | null;
  transaction_date: string;
  created_at: string;
  from_wallet?: Pick<Wallet, "name" | "icon" | "color"> | null;
  to_wallet?: Pick<Wallet, "name" | "icon" | "color"> | null;
};

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  wallet_id: string | null;
  notes: string | null;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  wallets?: Pick<Wallet, "name" | "icon" | "color"> | null;
};

export type TransactionAttachment = {
  id: string;
  user_id: string;
  transaction_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type ReconciliationResolution =
  | "adjust_opening"
  | "adjustment_tx"
  | "log_only"
  | "matched";

export type WalletReconciliation = {
  id: string;
  user_id: string;
  wallet_id: string;
  recorded_balance: number;
  actual_balance: number;
  difference: number;
  resolution: ReconciliationResolution;
  adjustment_transaction_id: string | null;
  note: string | null;
  reconciled_at: string;
  wallets?: Pick<Wallet, "name" | "icon" | "color"> | null;
};

export type FriendActivity = {
  friend_id: string;
  full_name: string | null;
  relationship_type: RelationshipType;
  month_expenses: number;
  month_income: number;
  month_transactions: number;
};

export type InvestmentType =
  | "stock"
  | "gold"
  | "crypto"
  | "fund"
  | "real_estate"
  | "other";

export type CollectionPeriod = "monthly" | "annual";

export type Investment = {
  id: string;
  user_id: string;
  name: string;
  investment_type: InvestmentType;
  icon: string;
  color: string;
  cost_basis: number;
  current_value: number;
  quantity: number | null;
  unit_label: string | null;
  notes: string | null;
  is_fixed_return: boolean;
  fixed_return_percent: number | null;
  collection_period: CollectionPeriod | null;
  collection_date: string | null;
  sort_order: number;
  created_at: string;
};

export type InvestmentUpdate = {
  id: string;
  user_id: string;
  investment_id: string;
  previous_value: number;
  new_value: number;
  note: string | null;
  recorded_at: string;
};

export type InvestmentProfitEntry = {
  id: string;
  user_id: string;
  investment_id: string;
  profit_amount: number;
  period_start: string | null;
  period_end: string;
  note: string | null;
  created_at: string;
};

export type MonthlyPlan = {
  id: string;
  user_id: string;
  plan_month: string;
  planned_income: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanItem = {
  id: string;
  user_id: string;
  plan_id: string;
  category_id: string;
  planned_amount: number;
  sort_order: number;
  created_at: string;
  categories?: Pick<Category, "name" | "icon" | "color"> | null;
};

export type AnnualPlanTemplate = {
  id: string;
  user_id: string;
  plan_year: number;
  planned_income: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnualPlanTemplateItem = {
  id: string;
  user_id: string;
  template_id: string;
  category_id: string;
  planned_amount: number;
  sort_order: number;
  created_at: string;
};

export type PlanComparisonRow = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  planned: number;
  actual: number;
  difference: number;
  progressPercent: number | null;
};

export type PlanComparison = {
  monthLabel: string;
  monthStart: string;
  monthEnd: string;
  hasPlan: boolean;
  income: {
    planned: number;
    actual: number;
    difference: number;
  };
  expenses: {
    planned: number;
    actual: number;
    difference: number;
  };
  balance: {
    planned: number;
    actual: number;
    difference: number;
  };
  expenseRows: PlanComparisonRow[];
  uncategorizedExpenses: number;
};
