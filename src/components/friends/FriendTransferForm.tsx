import type { Wallet } from "@/lib/types/database";
import type { FriendWallet } from "@/lib/friends/types";
import WalletSelect from "@/components/wallets/WalletSelect";

type FriendTransferFormProps = {
  myWallets: Wallet[];
  friendWallets: FriendWallet[];
  senderWalletId: string;
  receiverWalletId: string;
  transferAmount: string;
  transferNote: string;
  submitting: boolean;
  onSenderWalletChange: (value: string) => void;
  onReceiverWalletChange: (value: string) => void;
  onTransferAmountChange: (value: string) => void;
  onTransferNoteChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function FriendTransferForm({
  myWallets,
  friendWallets,
  senderWalletId,
  receiverWalletId,
  transferAmount,
  transferNote,
  submitting,
  onSenderWalletChange,
  onReceiverWalletChange,
  onTransferAmountChange,
  onTransferNoteChange,
  onSubmit,
}: FriendTransferFormProps) {
  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">تحويل مبلغ</h3>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">من محفظتي</span>
          <WalletSelect
            wallets={myWallets}
            value={senderWalletId}
            onChange={onSenderWalletChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">إلى محفظة الشخص</span>
          <select
            value={receiverWalletId}
            onChange={(event) => onReceiverWalletChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            {friendWallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.icon} {wallet.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المبلغ</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={transferAmount}
            onChange={(event) => onTransferAmountChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">ملاحظة</span>
          <input
            type="text"
            value={transferNote}
            onChange={(event) => onTransferNoteChange(event.target.value)}
            placeholder="مثال: مصروف الشهر"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <button
          type="submit"
          disabled={submitting || !receiverWalletId}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "جاري التحويل..." : "إرسال التحويل"}
        </button>
      </form>
    </section>
  );
}
