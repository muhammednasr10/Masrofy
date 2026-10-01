import type { DependentWallet } from "@/lib/friends/dependent";
import { formatCurrency } from "@/lib/utils/format";

export default function DependentWalletsList({
  wallets,
  currency,
  title,
}: {
  wallets: DependentWallet[];
  currency: string;
  title?: string;
}) {
  const groups = new Map<string, { name: string; wallets: DependentWallet[] }>();

  for (const wallet of wallets) {
    const group = groups.get(wallet.owner_id) ?? { name: wallet.owner_name, wallets: [] };
    group.wallets.push(wallet);
    groups.set(wallet.owner_id, group);
  }

  return (
    <div className="space-y-4">
      {title ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3> : null}
      {[...groups.values()].map((group) => (
        <div key={group.name} className="space-y-2">
          {groups.size > 1 ? <p className="text-sm font-medium text-slate-700">{group.name}</p> : null}
          <ul className="space-y-2">
            {group.wallets.map((wallet) => (
              <li
                key={wallet.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                style={{ marginInlineStart: wallet.parent_wallet_id ? "1.25rem" : undefined }}
              >
                <span className="flex items-center gap-2 text-sm text-slate-800">
                  <span>{wallet.icon}</span>
                  {wallet.name}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(wallet.balance, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
