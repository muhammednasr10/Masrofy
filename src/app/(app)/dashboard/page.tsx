import DashboardAddExpenseButton from "@/components/dashboard/DashboardAddExpenseButton";
import DashboardSectionCard from "@/components/dashboard/DashboardSectionCard";
import { loadDashboardData } from "@/lib/dashboard";
import { getServerLocale } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getMonthRange } from "@/lib/utils/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const locale = await getServerLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await loadDashboardData(supabase, user?.id);
  const monthLabel = getMonthRange(new Date(), locale).label;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{monthLabel}</h1>
        <DashboardAddExpenseButton />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          href="/expenses"
          icon="💸"
          title="المصروفات"
          description="تسجيل ومتابعة العمليات اليومية"
          primaryValue={formatCurrency(data.summary.totalExpenses, data.currency)}
          secondaryValue={
            data.dueRecurringCount > 0
              ? `${data.dueRecurringCount} عملية متكررة مستحقة`
              : `${data.transactionCount} عملية هذا الشهر`
          }
          tone="red"
        />

        <DashboardSectionCard
          href="/expenses"
          icon="📊"
          title="صافي الشهر"
          description="دخل − مصروفات"
          primaryValue={formatCurrency(data.summary.balance, data.currency)}
          secondaryValue={`دخل ${formatCurrency(data.summary.totalIncome, data.currency)} • مصروفات ${formatCurrency(data.summary.totalExpenses, data.currency)}`}
          tone="sky"
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
