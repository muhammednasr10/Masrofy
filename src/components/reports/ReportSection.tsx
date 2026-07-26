import type { ReactNode } from "react";

type ReportSectionProps = {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function ReportSection({ id, title, description, children }: ReportSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}
