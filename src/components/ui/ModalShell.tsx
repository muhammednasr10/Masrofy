"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

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
  zIndexClassName = "z-[80]",
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-3 sm:p-4`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-label="إغلاق"
      />
      <section
        className={`relative max-h-[88dvh] w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl border border-white bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:p-6 ${maxWidthClassName}`}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}
