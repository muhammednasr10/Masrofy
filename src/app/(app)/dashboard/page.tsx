import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types/database";
import { formatCurrency, formatDate, getMonthRange } from "@/lib/utils/format";
import { summarizeTransactions } from "@/lib/utils/summary";

export default async function DashboardPage() {
  const supabase = await createClient();
  const month = getMonthRange();

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from("profiles").select("currency").maybeSingle(),
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color)")
      .gte("transaction_date", month.start)
      .lte("transaction_date", month.end)
      .order("transaction_date", { ascending: false }),
  ]);

  const currency = profile?.currency ?? "EGP";
  const summary = summarizeTransactions((transactions ?? []) as Transaction[]);
  const recentTransactions = (transactions ?? []).slice(0, 5) as Transaction[];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-emerald-700">ملخص الشهر</p>
          <h2 className="text-3xl font-semibold text-slate-900">{month.label}</h2>
        </div>

        <Link
          href="/expenses"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          + إضافة مصروف
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="إجمالي المصروفات"
          value={formatCurrency(summary.totalExpenses, currency)}
          tone="expense"
        />
        <SummaryCard
          title="إجمالي الدخل"
          value={formatCurrency(summary.totalIncome, currency)}
          tone="income"
        />
        <SummaryCard
          title="الرصيد"
          value={formatCurrency(summary.balance, currency)}
          tone="balance"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">المصروفات حسب الفئة</h3>

          {summary.byCategory.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">لسه مفيش مصروفات هذا الشهر.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {summary.byCategory.map((category) => (
                <li key={category.categoryId ?? category.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span>{category.icon}</span>
                      {category.name}
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(category.total, currency)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max(
                          8,
                          (category.total / summary.totalExpenses) * 100,
                        )}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">آخر العمليات</h3>
            <Link href="/expenses" className="text-sm font-medium text-emerald-700">
              عرض الكل
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">ابدأ بإضافة أول مصروف.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {recentTransactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {transaction.categories?.name ?? "بدون فئة"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(transaction.transaction_date)}
                      {transaction.note ? ` • ${transaction.note}` : ""}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      transaction.type === "expense"
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(Number(transaction.amount), currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "expense" | "income" | "balance";
}) {
  const toneClasses = {
    expense: "from-red-50 to-white text-red-700",
    income: "from-emerald-50 to-white text-emerald-700",
    balance: "from-slate-100 to-white text-slate-800",
  };

  return (
    <article
      className={`rounded-3xl border border-white bg-gradient-to-br ${toneClasses[tone]} p-6 shadow-sm`}
    >
      <p className="text-sm">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}
