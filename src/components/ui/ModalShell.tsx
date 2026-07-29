"use client";

import type { ReactNode } from "react";

type ModalShellProps = {
  children: ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
  zIndexClassName?: string;
};

export default function ModalShell({
  children,
  onClose,
  maxWidthClassName = "sm:max-w-2xl",
  zIndexClassName = "z-50",
}: ModalShellProps) {
  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4`}
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="إغلاق"
      />
      <section
        className={`relative max-h-[92dvh] w-full max-w-full overflow-x-hidden overflow-y-auto rounded-t-3xl border border-white bg-white p-4 shadow-xl sm:max-h-[90vh] sm:rounded-3xl sm:p-6 ${maxWidthClassName}`}
      >
        {children}
      </section>
    </div>
  );
}
