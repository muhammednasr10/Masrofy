"use client";

import { DifferenceBadge } from "@/components/wallets/WalletReconciliationHistory";
import { useFormat } from "@/hooks/useFormat";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Wallet } from "@/lib/types/database";
import {
  getActualBalanceLabel,
  getRecordedBalanceLabel,
  isCreditWallet,
} from "@/lib/wallets";
import type { WalletInventoryPreview } from "@/hooks/useWalletInventory";

type WalletInventoryEditableRowProps = {
  wallet: Wallet;
  depth: number;
  parentName: string | null;
  preview: WalletInventoryPreview;
  actualBalanceInput: string;
  currency: string;
  onActualBalanceChange: (walletId: string, value: string) => void;
};

export default function WalletInventoryEditableRow({
  wallet,
  depth,
  parentName,
  preview,
  actualBalanceInput,
  currency,
  onActualBalanceChange,
}: WalletInventoryEditableRowProps) {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const actualBalanceLabel = getActualBalanceLabel(wallet);
  const isCredit = isCreditWallet(wallet);

  return (
    <article
      className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/40 p-4"
      style={{ marginRight: `${depth * 0.75}rem` }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
          {wallet.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{wallet.name}</p>
          {parentName ? (
            <p className="mt-0.5 text-xs text-emerald-700">
              {t("wallets.inventoryUnderParent", { name: parentName })}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-slate-500">{getRecordedBalanceLabel(wallet)}</p>
        </div>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-emerald-900">{actualBalanceLabel}</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          required
          value={actualBalanceInput}
          onChange={(event) => onActualBalanceChange(wallet.id, event.target.value)}
          placeholder="0.00"
          className="w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3.5 text-lg font-semibold text-slate-900 outline-none focus:border-emerald-500"
        />
        <span className="block text-xs leading-6 text-slate-600">
          {isCredit ? t("wallets.inventoryCreditHint") : t("wallets.inventoryCashHint")}
        </span>
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white/80 p-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">{t("wallets.inventoryRecordedInApp")}</p>
          <p className="mt-1 font-medium text-slate-700">
            {formatCurrency(preview.recordedBalance, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t("wallets.inventoryDifference")}</p>
          <div className="mt-1">
            <DifferenceBadge difference={preview.difference} currency={currency} />
          </div>
        </div>
      </div>
    </article>
  );
}
