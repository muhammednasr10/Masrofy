"use client";

import type { Wallet } from "@/lib/types/database";
import WalletSelect from "@/components/wallets/WalletSelect";

type WalletsToolbarProps = {
  wallets: Wallet[];
  defaultWalletId: string;
  hasReconcilableWallets: boolean;
  canTransfer: boolean;
  onSetDefault: (walletId: string) => void;
  onOpenInventory: () => void;
  onOpenTransfer: () => void;
  onOpenAdd: () => void;
};

export default function WalletsToolbar({
  wallets,
  defaultWalletId,
  hasReconcilableWallets,
  canTransfer,
  onSetDefault,
  onOpenInventory,
  onOpenTransfer,
  onOpenAdd,
}: WalletsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      {wallets.length > 0 ? (
        <label className="flex w-full items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 shadow-sm sm:w-auto">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg"
            title="المحفظة الافتراضية"
            aria-hidden
          >
            ⭐
          </span>
          <div className="min-w-0 flex-1 sm:min-w-[180px]">
            <p className="text-xs text-slate-500">المحفظة الافتراضية</p>
            <WalletSelect
              wallets={wallets}
              value={defaultWalletId}
              onChange={onSetDefault}
              className="mt-1 w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
            />
          </div>
        </label>
      ) : null}

      {hasReconcilableWallets ? (
        <button
          type="button"
          onClick={onOpenInventory}
          className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100 sm:w-auto"
        >
          🔄 تحديث أرصدة المحافظ
        </button>
      ) : null}

      {canTransfer ? (
        <button
          type="button"
          onClick={onOpenTransfer}
          className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-medium text-indigo-800 transition hover:bg-indigo-100 sm:w-auto"
        >
          ↔ تحويل
        </button>
      ) : null}

      <button
        type="button"
        onClick={onOpenAdd}
        className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 sm:w-auto"
      >
        + إضافة محفظة
      </button>
    </div>
  );
}
