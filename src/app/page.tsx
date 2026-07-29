import Link from "next/link";
import SiteFooter from "@/components/layout/SiteFooter";

export default function Home() {
  return (
    <div className="min-h-full w-full overflow-x-hidden bg-gradient-to-b from-emerald-100 via-white to-slate-50">
      <main className="mx-auto flex min-h-full w-full min-w-0 max-w-5xl flex-col justify-center px-4 py-16">
        <section className="max-w-2xl">
          <p className="text-sm font-medium text-emerald-700">Masrofy</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            نظّم مصروفاتك ببساطة
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            تطبيق ويب عربي لتسجيل المصروفات والدخل، تصنيفهم حسب الفئات، ومتابعة
            ملخص شهري واضح.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-2xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700"
            >
              ابدأ مجانًا
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-emerald-200 bg-white px-6 py-3 font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              تسجيل الدخول
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          <FeatureCard title="تسجيل سريع" description="أضف مصروف أو دخل في ثوانٍ." />
          <FeatureCard title="فئات جاهزة" description="فئات عربية افتراضية من أول حساب." />
          <FeatureCard title="ملخص شهري" description="شوف توزيع مصروفاتك بشكل واضح." />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-white bg-white/80 p-6 shadow-sm backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}
