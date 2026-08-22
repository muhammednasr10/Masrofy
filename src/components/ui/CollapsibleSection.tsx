"use client";

import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
};

export default function CollapsibleSection({
  title,
  subtitle,
  count,
  open,
  onToggle,
  children,
  className = "mt-4",
}: CollapsibleSectionProps) {
  return (
    <section className={`${className} overflow-hidden rounded-2xl border border-slate-100`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-slate-50"
      >
        <span
          className={`inline-block shrink-0 text-[10px] text-slate-400 transition-transform ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden
        >
          ◀
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {count}
        </span>
      </button>
      {open ? <div className="border-t border-slate-100 px-4 py-3">{children}</div> : null}
    </section>
  );
}
