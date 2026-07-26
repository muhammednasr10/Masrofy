import type { OfflineTransaction } from "@/lib/offline/types";
import type { Wallet } from "@/lib/types/database";
import { getTransactionWalletDisplay } from "@/lib/expenses/display";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function TransactionsList({
  transactions,
  wallets,
  currency,
  attachmentUrls,
  onDelete,
}: {
  transactions: OfflineTransaction[];
  wallets: Wallet[];
  currency: string;
  attachmentUrls: Record<string, string>;
  onDelete: (id: string) => void;
}) {
  if (transactions.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">لا توجد عمليات مطابقة للفلتر.</p>;
  }

  return (
    <ul className="mt-6 space-y-3">
      {transactions.map((transaction) => {
        const walletDisplay = getTransactionWalletDisplay(wallets, transaction.wallet_id);

        return (
          <li
            key={transaction.id}
            className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900">
                {transaction.categories?.icon}{" "}
                {transaction.categories?.name ??
                  (transaction.type === "income" ? "دخل" : "بدون فئة")}
                {transaction.offlinePending ? (
                  <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    بانتظار المزامنة
                  </span>
                ) : null}
              </p>
              <p className="text-sm text-slate-500">
                {walletDisplay ? (
                  <>
                    {walletDisplay.wallet.icon} {walletDisplay.wallet.name}
                    {walletDisplay.parent ? (
                      <>
                        {" "}
                        • {walletDisplay.parent.icon} {walletDisplay.parent.name}
                      </>
                    ) : null}
                    {walletDisplay.typeLabel ? ` • ${walletDisplay.typeLabel}` : ""}
                  </>
                ) : (
                  <>
                    {transaction.wallets?.icon}{" "}
                    {transaction.wallets?.name ?? "بدون محفظة"}
                  </>
                )}
                {" • "}
                {formatDate(transaction.transaction_date)}
                {transaction.note ? ` • ${transaction.note}` : ""}
                {attachmentUrls[transaction.id] ? (
                  <>
                    {" • "}
                    <a
                      href={attachmentUrls[transaction.id]}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      📎 مرفق
                    </a>
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
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
                onClick={() => onDelete(transaction.id)}
                className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-white hover:text-red-600"
                aria-label="حذف العملية"
              >
                حذف
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
