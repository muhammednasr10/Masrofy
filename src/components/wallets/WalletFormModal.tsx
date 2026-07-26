"use client";

import type { ReactNode } from "react";
import ModalShell from "@/components/ui/ModalShell";

type WalletFormModalProps = {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
};

export default function WalletFormModal({
  title,
  description,
  onClose,
  children,
}: WalletFormModalProps) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          إغلاق
        </button>
      </div>
      {children}
    </ModalShell>
  );
}
