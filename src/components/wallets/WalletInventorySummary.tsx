"use client";

import { useFormat } from "@/hooks/useFormat";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type WalletInventorySummaryProps = {
  total: number;
  matched: number;
  mismatched: number;
  netAdjustment: number;
  currency: string;
};

export default function WalletInventorySummary({
  total,
  matched,
  mismatched,
  netAdjustment,
  currency,
}: WalletInventorySummaryProps) {
  const t = useTranslations();
  const { formatCurrency } = useFormat();

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryChip label={t("wallets.inventorySummaryWallets")} value={String(total)} tone="neutral" />
        <SummaryChip label={t("wallets.inventorySummaryMatched")} value={String(matched)} tone="success" />
        <SummaryChip label={t("wallets.inventorySummaryMismatched")} value={String(mismatched)} tone="warning" />
      </div>

      {mismatched > 0 ? (
        <div className="space-y-2">
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t("wallets.inventoryNetDiff", { amount: formatCurrency(netAdjustment, currency) })}
          </p>
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {Math.abs(netAdjustment) < 0.005
              ? t("wallets.inventoryNetZero")
              : netAdjustment > 0
                ? t("wallets.inventoryNetIncome", {
                    amount: formatCurrency(Math.abs(netAdjustment), currency),
                  })
                : t("wallets.inventoryNetExpense", {
                    amount: formatCurrency(Math.abs(netAdjustment), currency),
                  })}
          </p>
        </div>
      ) : (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("wallets.inventoryAllMatched")}
        </p>
      )}
    </>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning";
}) {
  const toneClasses = {
    neutral: "bg-slate-50 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClasses[tone]}`}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
