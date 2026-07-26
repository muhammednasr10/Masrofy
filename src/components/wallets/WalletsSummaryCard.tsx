import { formatCurrency } from "@/lib/utils/format";
import type { ParentWalletBalanceSummary } from "@/lib/wallets/hierarchy";

export default function WalletsSummaryCard({
  summary,
  currency,
}: {
  summary: ParentWalletBalanceSummary;
  currency: string;
}) {
  return (
    <section className="rounded-3xl border border-white bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
      <p className="text-sm text-emerald-700">صافي ثروتك (بدون كريديت)</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">
        {formatCurrency(summary.assetTotal, currency)}
      </p>
      {summary.creditNotes.length > 0 ? (
        <div className="mt-3 space-y-1">
          {summary.creditNotes.map((note) => (
            <p key={note.walletName} className="text-sm text-amber-700">
              ملاحظة: {note.walletName} — مستحق {formatCurrency(note.owed, currency)}
              {note.limit != null
                ? ` • متاح ${formatCurrency(note.available ?? 0, currency)}`
                : ""}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
