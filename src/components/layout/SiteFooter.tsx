import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Masrofy (مصروفي)</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy" className="transition hover:text-emerald-700">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="transition hover:text-emerald-700">
            شروط الاستخدام
          </Link>
        </div>
      </div>
    </footer>
  );
}
