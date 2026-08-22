"use client";

import ModalShell from "@/components/ui/ModalShell";
import WalletInventoryEditableRow from "@/components/wallets/WalletInventoryEditableRow";
import WalletInventoryReadOnlyRow from "@/components/wallets/WalletInventoryReadOnlyRow";
import WalletInventorySummary from "@/components/wallets/WalletInventorySummary";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useWalletInventory } from "@/hooks/useWalletInventory";
import type { Transaction, Wallet } from "@/lib/types/database";

type WalletInventoryModalProps = {
  wallets: Wallet[];
  transactions: Transaction[];
  currency: string;
  focusWalletId?: string | null;
  onClose: () => void;
  onComplete: () => Promise<void>;
};

export default function WalletInventoryModal({
  wallets,
  transactions,
  currency,
  focusWalletId = null,
  onClose,
  onComplete,
}: WalletInventoryModalProps) {
  const t = useTranslations();
  const {
    walletRows,
    editableWallets,
    previews,
    summary,
    focusWallet,
    note,
    saving,
    error,
    setNote,
    getActualBalanceInput,
    updateActualBalance,
    handleSubmit,
  } = useWalletInventory(wallets, transactions, focusWalletId, onComplete, onClose);

  const title = focusWalletId
    ? t("wallets.inventoryTitleSingle")
    : t("wallets.inventoryTitleAll");

  const description =
    focusWallet && walletRows.length > 1
      ? t("wallets.inventoryDescSubWallets", { name: focusWallet.name })
      : t("wallets.inventoryDescDefault");

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          {t("common.close")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {walletRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-900">
            <p className="font-medium">{t("wallets.inventoryEmptyTitle")}</p>
            <p className="mt-2 leading-7 text-amber-800">
              {focusWallet
                ? t("wallets.inventoryEmptyFocusDesc")
                : t("wallets.inventoryEmptyDefaultDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {t("wallets.inventoryEditableCount", { count: editableWallets.length })}
            </p>

            {walletRows.map(({ wallet, depth, editable, parentName }) => {
              if (!editable) {
                return (
                  <WalletInventoryReadOnlyRow key={wallet.id} wallet={wallet} depth={depth} />
                );
              }

              const preview = previews.find((item) => item.wallet.id === wallet.id);

              if (!preview) {
                return null;
              }

              return (
                <WalletInventoryEditableRow
                  key={wallet.id}
                  wallet={wallet}
                  depth={depth}
                  parentName={parentName}
                  preview={preview}
                  actualBalanceInput={getActualBalanceInput(wallet)}
                  currency={currency}
                  onActualBalanceChange={updateActualBalance}
                />
              );
            })}
          </div>
        )}

        {walletRows.length > 0 ? (
          <WalletInventorySummary
            total={summary.total}
            matched={summary.matched}
            mismatched={summary.mismatched}
            netAdjustment={summary.netAdjustment}
            currency={currency}
          />
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">{t("wallets.inventoryNoteLabel")}</span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("wallets.inventoryNotePlaceholder")}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || walletRows.length === 0}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? t("wallets.inventorySaving") : t("wallets.inventorySubmit")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
