"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Wallet } from "@/lib/types/database";
import { isInvestmentWallet } from "@/lib/wallets";

type WalletInventoryReadOnlyRowProps = {
  wallet: Wallet;
  depth: number;
};

export default function WalletInventoryReadOnlyRow({ wallet, depth }: WalletInventoryReadOnlyRowProps) {
  const t = useTranslations();

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
      style={{ marginRight: `${depth * 0.75}rem` }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
          {wallet.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{wallet.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {isInvestmentWallet(wallet)
              ? t("wallets.inventoryReadOnlyInvestment")
              : t("wallets.inventoryReadOnlyParent")}
          </p>
        </div>
      </div>
    </article>
  );
}
