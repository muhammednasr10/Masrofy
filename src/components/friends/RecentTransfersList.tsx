import type { WalletTransfer } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type RecentTransfersListProps = {
  transfers: WalletTransfer[];
  currentUserId: string;
  currency: string;
};

export default function RecentTransfersList({
  transfers,
  currentUserId,
  currency,
}: RecentTransfersListProps) {
  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">آخر التحويلات</h3>

      {transfers.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">لسه مفيش تحويلات.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {transfers.map((transfer) => {
            const isSender = transfer.sender_id === currentUserId;

            return (
              <li
                key={transfer.id}
                className="flex flex-col gap-2 rounded-2xl bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {isSender ? "أرسلت إلى" : "استلمت من"}{" "}
                    {isSender ? transfer.receiver?.full_name : transfer.sender?.full_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {transfer.sender_wallet_name} → {transfer.receiver_wallet_name}
                    {" • "}
                    {formatDate(transfer.created_at.slice(0, 10))}
                    {transfer.note ? ` • ${transfer.note}` : ""}
                  </p>
                </div>
                <p className={`font-semibold ${isSender ? "text-red-600" : "text-emerald-600"}`}>
                  {isSender ? "-" : "+"}
                  {formatCurrency(Number(transfer.amount), currency)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
