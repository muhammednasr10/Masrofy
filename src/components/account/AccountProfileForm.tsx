import { currencyOptions } from "@/lib/constants/currency-options";
import type { Wallet } from "@/lib/types/database";
import { formatDate } from "@/lib/utils/format";
import WalletSelect from "@/components/wallets/WalletSelect";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";

type AccountProfileFormProps = {
  fullName: string;
  email: string;
  defaultWalletId: string;
  currency: string;
  wallets: Wallet[];
  createdAt: string | null;
  saving: boolean;
  error: string | null;
  message: string | null;
  onFullNameChange: (value: string) => void;
  onDefaultWalletChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignOut: () => void;
};

export default function AccountProfileForm({
  fullName,
  email,
  defaultWalletId,
  currency,
  wallets,
  createdAt,
  saving,
  error,
  message,
  onFullNameChange,
  onDefaultWalletChange,
  onCurrencyChange,
  onSubmit,
  onSignOut,
}: AccountProfileFormProps) {
  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">معلومات الحساب</h3>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">الاسم</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">البريد الإلكتروني</span>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المحفظة الافتراضية</span>
          <WalletSelect
            wallets={wallets}
            value={defaultWalletId}
            onChange={onDefaultWalletChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">العملة الافتراضية</span>
          <select
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            {currencyOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {createdAt ? (
          <p className="text-sm text-slate-500">
            تاريخ إنشاء الحساب: {formatDate(createdAt.slice(0, 10))}
          </p>
        ) : null}

        <FeedbackBanner error={error} message={message} />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            تسجيل الخروج
          </button>
        </div>
      </form>
    </section>
  );
}
