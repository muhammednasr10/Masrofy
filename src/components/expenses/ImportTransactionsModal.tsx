"use client";

import { useMemo, useState } from "react";
import ModalShell from "@/components/ui/ModalShell";
import WalletSelect from "@/components/wallets/WalletSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import { parseTransactionsCsv, type ParsedImportRow } from "@/lib/expenses/import-csv";
import type { Wallet } from "@/lib/types/database";

type ImportTransactionsModalProps = {
  open: boolean;
  wallets: Wallet[];
  currency: string;
  submitting: boolean;
  onClose: () => void;
  onImport: (rows: ParsedImportRow[], walletId: string) => Promise<void>;
};

export default function ImportTransactionsModal({
  open,
  wallets,
  currency,
  submitting,
  onClose,
  onImport,
}: ImportTransactionsModalProps) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();
  const [walletId, setWalletId] = useState("");
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const defaultWalletId = useMemo(
    () => wallets.find((wallet) => wallet.is_default)?.id ?? wallets[0]?.id ?? "",
    [wallets],
  );

  const activeWalletId = walletId || defaultWalletId;
  const previewRows = rows.slice(0, 8);

  if (!open) {
    return null;
  }

  async function handleFileChange(file: File | null) {
    setParseError(null);
    setRows([]);
    setSkipped(0);
    setFileName("");

    if (!file) {
      return;
    }

    const content = await file.text();
    const result = parseTransactionsCsv(content);

    if (result.errors.includes("importEmptyFile")) {
      setParseError(t("expenses.importEmptyFile"));
      return;
    }

    if (result.errors.includes("importNoValidRows")) {
      setParseError(t("expenses.importNoValidRows"));
      return;
    }

    setRows(result.rows);
    setSkipped(result.skipped);
    setFileName(file.name);
    setWalletId((current) => current || defaultWalletId);
  }

  async function handleImportClick() {
    if (rows.length === 0 || !activeWalletId) {
      return;
    }

    await onImport(rows, activeWalletId);
    setRows([]);
    setSkipped(0);
    setFileName("");
    setParseError(null);
    onClose();
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("expenses.importModalTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("expenses.importModalSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
          aria-label={t("common.close")}
        >
          ✕
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">{t("expenses.importFileLabel")}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
            className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <p className="text-xs text-slate-500">{t("expenses.importFormatHint")}</p>
        </label>

        {wallets.length > 0 ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{t("expenses.importWalletLabel")}</span>
            <WalletSelect
              wallets={wallets}
              value={activeWalletId}
              onChange={setWalletId}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
        ) : null}

        {parseError ? <p className="text-sm text-red-600">{parseError}</p> : null}

        {rows.length > 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              {t("expenses.importPreviewTitle", { count: String(rows.length), file: fileName })}
            </p>
            {skipped > 0 ? (
              <p className="mt-1 text-xs text-amber-700">
                {t("expenses.importSkipped", { count: String(skipped) })}
              </p>
            ) : null}

            <ul className="mt-3 space-y-2">
              {previewRows.map((row, index) => (
                <li
                  key={`${row.transaction_date}-${row.amount}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-slate-500">{formatDate(row.transaction_date)}</p>
                    <p className="wrap-text text-slate-800">{row.note ?? "—"}</p>
                  </div>
                  <p
                    className={`shrink-0 font-semibold ${
                      row.type === "expense" ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {row.type === "expense" ? "-" : "+"}
                    {formatCurrency(row.amount, currency)}
                  </p>
                </li>
              ))}
            </ul>

            {rows.length > previewRows.length ? (
              <p className="mt-2 text-xs text-slate-500">
                {t("expenses.importMoreRows", { count: String(rows.length - previewRows.length) })}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={submitting || rows.length === 0 || !activeWalletId}
            onClick={() => void handleImportClick()}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? t("expenses.importing") : t("expenses.importConfirm", { count: String(rows.length) })}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
