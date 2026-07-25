"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Transaction, TransactionType } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function ExpensesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [note, setNote] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [{ data: profile }, { data: categoryRows }, { data: transactionRows }] =
        await Promise.all([
          supabase.from("profiles").select("currency").maybeSingle(),
          supabase.from("categories").select("*").order("name"),
          supabase
            .from("transactions")
            .select("*, categories(name, icon, color)")
            .order("transaction_date", { ascending: false })
            .limit(20),
        ]);

      setCurrency(profile?.currency ?? "EGP");
      setCategories((categoryRows ?? []) as Category[]);
      setTransactions((transactionRows ?? []) as Transaction[]);

      if (categoryRows?.[0]) {
        setCategoryId(categoryRows[0].id);
      }

      setLoading(false);
    }

    loadData();
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
      .from("transactions")
      .insert({
        user_id: user.id,
        category_id: categoryId || null,
        amount: Number(amount),
        type,
        note: note.trim() || null,
        transaction_date: transactionDate,
      })
      .select("*, categories(name, icon, color)")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setTransactions((current) => [data as Transaction, ...current]);
    setAmount("");
    setNote("");
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTransactions((current) => current.filter((item) => item.id !== id));
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">جاري تحميل المصروفات...</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">إضافة عملية</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">النوع</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TransactionType)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            >
              <option value="expense">مصروف</option>
              <option value="income">دخل</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">المبلغ</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">الفئة</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">التاريخ</span>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">ملاحظة</span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="اختياري"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "جاري الحفظ..." : "حفظ"}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">آخر 20 عملية</h2>

        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">لسه مفيش عمليات مسجلة.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {transaction.categories?.icon} {transaction.categories?.name ?? "بدون فئة"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(transaction.transaction_date)}
                    {transaction.note ? ` • ${transaction.note}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p
                    className={`font-semibold ${
                      transaction.type === "expense" ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(Number(transaction.amount), currency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(transaction.id)}
                    className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-white hover:text-red-600"
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
