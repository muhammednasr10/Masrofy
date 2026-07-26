import Link from "next/link";
import type { LegalSection } from "@/lib/legal/content";

type LegalDocumentLayoutProps = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export default function LegalDocumentLayout({
  title,
  lastUpdated,
  sections,
}: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50 to-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10 pb-16">
        <div className="mb-8">
          <Link href="/" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← العودة للرئيسية
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">آخر تحديث: {lastUpdated}</p>
        </div>

        <article className="space-y-8 rounded-3xl border border-white bg-white p-6 shadow-sm sm:p-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="list-disc space-y-2 pr-5 text-sm leading-7 text-slate-600">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="font-medium text-emerald-700 hover:text-emerald-800">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="font-medium text-emerald-700 hover:text-emerald-800">
            شروط الاستخدام
          </Link>
        </div>
      </main>
    </div>
  );
}
