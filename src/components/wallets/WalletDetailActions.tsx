"use client";

import Link from "next/link";
import ModalActionButton from "@/components/ui/ModalActionButton";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Wallet } from "@/lib/types/database";
import { getInvestmentsPageHref, isInvestmentWallet } from "@/lib/wallets";

type WalletDetailActionsProps = {
  wallet: Wallet;
  canAddSubWallet: boolean;
  isReconcilable: boolean;
  onAddSubWallet: () => void;
  onInventoryWallet: () => void;
  onEditWallet: () => void;
  onDeleteWallet: () => void;
};

export default function WalletDetailActions({
  wallet,
  canAddSubWallet,
  isReconcilable,
  onAddSubWallet,
  onInventoryWallet,
  onEditWallet,
  onDeleteWallet,
}: WalletDetailActionsProps) {
  const t = useTranslations();
  const isInvestment = isInvestmentWallet(wallet);

  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-2">
      {canAddSubWallet ? (
        <ModalActionButton
          onClick={onAddSubWallet}
          label={t("wallets.addSubWallet")}
          icon="➕"
          className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        />
      ) : null}
      {isInvestment ? (
        <Link
          href={getInvestmentsPageHref(wallet)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800 transition hover:bg-indigo-100"
        >
          <span aria-hidden>📈</span>
          {t("wallets.investmentPage")}
        </Link>
      ) : null}
      {isReconcilable ? (
        <ModalActionButton
          onClick={onInventoryWallet}
          label={t("wallets.updateBalance")}
          icon="🔄"
          className="bg-amber-50 text-amber-800 hover:bg-amber-100"
        />
      ) : null}
      <ModalActionButton
        onClick={onEditWallet}
        label={t("common.edit")}
        icon="✏️"
        className="bg-slate-100 text-slate-800 hover:bg-slate-200"
      />
      <ModalActionButton
        onClick={onDeleteWallet}
        label={t("common.delete")}
        icon="🗑️"
        className="bg-red-50 text-red-700 hover:bg-red-100"
      />
    </div>
  );
}
