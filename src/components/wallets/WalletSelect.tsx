"use client";

import type { Wallet } from "@/lib/types/database";
import {
  buildWalletSelectGroups,
  getWalletSelectGroupLabel,
  getWalletSelectOptionLabel,
} from "@/lib/wallets/hierarchy";

type WalletSelectProps = {
  wallets: Wallet[];
  value: string;
  onChange: (walletId: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export default function WalletSelect({
  wallets,
  value,
  onChange,
  className,
  required,
  disabled,
  allowEmpty = false,
  emptyLabel = "كل المحافظ",
}: WalletSelectProps) {
  const groups = buildWalletSelectGroups(wallets);

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      disabled={disabled}
      className={className}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {groups.map(({ parent, children }) =>
        children.length > 0 ? (
          <optgroup key={parent.id} label={getWalletSelectGroupLabel(parent)}>
            <option value={parent.id}>
              {getWalletSelectOptionLabel(parent, "parent")}
            </option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {getWalletSelectOptionLabel(child, "child")}
              </option>
            ))}
          </optgroup>
        ) : (
          <option key={parent.id} value={parent.id}>
            {getWalletSelectOptionLabel(parent, "standalone")}
          </option>
        ),
      )}
    </select>
  );
}
