import Link from "next/link";
import DashboardAlerts from "@/components/dashboard/DashboardAlerts";
import DashboardSectionCard from "@/components/dashboard/DashboardSectionCard";
import { loadDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await loadDashboardData(supabase, user?.id);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-emerald-700">لوحة التحكم</p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {data.profile?.full_name ? `أهلاً، ${data.profile.full_name}` : "أهلاً بك"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ملخص {data.monthLabel} — اضغط على أي كارت للانتقال
          </p>
        </div>

        <Link
          href="/expenses"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          + إضافة مصروف
        </Link>
      </section>

      <section className="rounded-3xl border border-white bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 text-white shadow-sm sm:p-6">
        <p className="text-sm text-emerald-100">صافي الشهر</p>
        <p className="mt-2 text-3xl font-semibold">
          {formatCurrency(data.summary.balance, data.currency)}
        </p>
        <p className="mt-2 text-sm text-emerald-100">
          دخل {formatCurrency(data.summary.totalIncome, data.currency)} • مصروفات{" "}
          {formatCurrency(data.summary.totalExpenses, data.currency)}
        </p>
      </section>

      <DashboardAlerts alerts={data.alerts} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardSectionCard
          href="/expenses"
          icon="💸"
          title="المصروفات"
          description="تسجيل ومتابعة العمليات اليومية"
          primaryValue={formatCurrency(data.summary.totalExpenses, data.currency)}
          secondaryValue={
            data.dueRecurringCount > 0
              ? `${data.dueRecurringCount} عملية متكررة مستحقة`
              : `${data.transactionCount} عملية • صافي ${formatCurrency(data.summary.balance, data.currency)}`
          }
          tone="red"
        />

        <DashboardSectionCard
          href="/plan"
          icon="📋"
          title="الخطة"
          description="مقارنة المخطط بالواقع"
          primaryValue={
            data.planComparison.hasPlan
              ? formatCurrency(data.planComparison.expenses.actual, data.currency)
              : "بدون خطة"
          }
          secondaryValue={data.planStatus}
          tone="amber"
        />

        <DashboardSectionCard
          href="/wallets"
          icon="👛"
          title="المحافظ"
          description="أرصدة البنوك والكاش والبطاقات"
          primaryValue={formatCurrency(data.portfolio.assetTotal, data.currency)}
          secondaryValue={`${data.walletCount} محفظة • صافي الثروة بدون كريديت`}
          tone="emerald"
        />

        <DashboardSectionCard
          href="/investments"
          icon="📈"
          title="الاستثمار"
          description="متابعة قيمة محفظتك الاستثمارية"
          primaryValue={formatCurrency(data.investmentSummary.totalCurrentValue, data.currency)}
          secondaryValue={
            data.investmentCount > 0
              ? `${data.investmentCount} استثمار • ${
                  data.investmentSummary.totalProfit >= 0 ? "+" : ""
                }${formatCurrency(data.investmentSummary.totalProfit, data.currency)}`
              : "ابدأ بإضافة استثمار"
          }
          tone="indigo"
        />

        <DashboardSectionCard
          href="/reports"
          icon="📊"
          title="التقارير"
          description="تحليلات وتقارير مالية شاملة"
          primaryValue={formatCurrency(data.summary.balance, data.currency)}
          secondaryValue={
            data.topCategory
              ? `أعلى فئة: ${data.topCategory.icon} ${data.topCategory.name}`
              : "9 تقارير جاهزة للعرض"
          }
          tone="sky"
        />

        <DashboardSectionCard
          href="/categories"
          icon="🏷️"
          title="الفئات"
          description="تنظيم مصروفاتك حسب الفئات"
          primaryValue={`${data.categoryCount} فئة`}
          secondaryValue={
            data.topCategory
              ? `الأكثر هذا الشهر: ${data.topCategory.icon} ${data.topCategory.name}`
              : "أضف فئات لتنظيم المصروفات"
          }
          tone="slate"
        />

        <DashboardSectionCard
          href="/friends"
          icon="👥"
          title="العلاقات"
          description="مشاركة النشاط مع الأصدقاء والعائلة"
          primaryValue={`${data.acceptedFriends} علاقة`}
          secondaryValue={
            data.acceptedFriends > 0 ? "عرض النشاط المشترك" : "ادعُ شخصاً للمتابعة"
          }
          tone="emerald"
        />

        <DashboardSectionCard
          href="/savings"
          icon="🎯"
          title="أهداف الادّخار"
          description="تابع تقدمك نحو أهدافك المالية"
          primaryValue={formatCurrency(data.savingsSummary.totalSaved, data.currency)}
          secondaryValue={
            data.savingsSummary.activeCount > 0
              ? `${data.savingsSummary.activeCount} هدف نشط • ${data.savingsSummary.overallProgress}%`
              : "أضف هدف ادّخار"
          }
          tone="emerald"
        />

        <DashboardSectionCard
          href="/account"
          icon="⚙️"
          title="الحساب"
          description="الإعدادات والملف الشخصي"
          primaryValue={data.profile?.full_name ?? "حسابك"}
          secondaryValue={`العملة: ${data.currency}`}
          tone="slate"
        />
      </section>
    </div>
  );
}
