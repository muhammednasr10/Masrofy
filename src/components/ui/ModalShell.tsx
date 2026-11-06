"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalShellProps = {
  children: ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
  zIndexClassName?: string;
  /** Centered card on every screen size, including phones. */
  dialog?: boolean;
};

export default function ModalShell({
  children,
  onClose,
  maxWidthClassName = "sm:max-w-2xl",
  zIndexClassName = "z-[80]",
  dialog = false,
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
      className={`fixed inset-0 ${zIndexClassName} flex justify-center ${
        dialog ? "items-center p-3" : "items-end p-0 sm:items-center sm:p-4"
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-label="إغلاق"
      />
      <section
        className={`relative w-full overflow-x-hidden overflow-y-auto overscroll-contain border border-white bg-white shadow-2xl ${
          dialog
            ? `max-h-[90dvh] rounded-3xl p-4 sm:p-6 ${maxWidthClassName}`
            : `max-h-[92dvh] rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-h-[90vh] sm:rounded-3xl sm:p-6 ${maxWidthClassName}`
        }`}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}
