"use client";

import ModalShell from "@/components/ui/ModalShell";
import type { InternalWalletTransfer, Wallet } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type InternalTransfersListProps = {
  transfers: InternalWalletTransfer[];
  wallets: Wallet[];
  currency: string;
};

function getWalletLabel(wallets: Wallet[], walletId: string) {
  const wallet = wallets.find((item) => item.id === walletId);
  return wallet ? `${wallet.icon} ${wallet.name}` : "محفظة";
}

export default function InternalTransfersList({
  transfers,
  wallets,
  currency,
}: InternalTransfersListProps) {
  if (transfers.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-semibold text-slate-900">تحويلات بين المحافظ</h2>
      <p className="mt-1 text-sm text-slate-500">آخر التحويلات الداخلية — لا تُحسب مصروفات أو دخل.</p>

      <ul className="mt-4 space-y-3">
        {transfers.map((transfer) => (
          <li
            key={transfer.id}
            className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900">
                {getWalletLabel(wallets, transfer.from_wallet_id)} →{" "}
                {getWalletLabel(wallets, transfer.to_wallet_id)}
              </p>
              <p className="text-sm text-slate-500">
                {formatDate(transfer.transaction_date)}
                {transfer.note ? ` • ${transfer.note}` : ""}
              </p>
            </div>
            <p className="shrink-0 font-semibold text-indigo-700">
              {formatCurrency(Number(transfer.amount), currency)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
