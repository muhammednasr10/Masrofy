"use client";

import DashboardAddExpenseButton from "@/components/dashboard/DashboardAddExpenseButton";
import {
  DashboardBalanceToggleButton,
  DashboardBalanceVisibilityProvider,
  useDashboardBalanceVisibility,
} from "@/components/dashboard/DashboardBalanceVisibility";
import DashboardSectionCard from "@/components/dashboard/DashboardSectionCard";
import type { DashboardData } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils/format";

type DashboardViewProps = {
  monthLabel: string;
  data: DashboardData;
};

function DashboardCards({ data }: { data: DashboardData }) {
  const { maskBalance } = useDashboardBalanceVisibility();

  const netMonthSecondary = `دخل ${formatCurrency(data.summary.totalIncome, data.currency)} • مصروفات ${formatCurrency(data.summary.totalExpenses, data.currency)}`;

  const investmentSecondary =
    data.investmentCount > 0
      ? `${data.investmentCount} استثمار • ${
          data.investmentSummary.totalProfit >= 0 ? "+" : ""
        }${formatCurrency(data.investmentSummary.totalProfit, data.currency)}`
      : "ابدأ بإضافة استثمار";

  const savingsSecondary =
    data.savingsSummary.activeCount > 0
      ? `${data.savingsSummary.activeCount} هدف نشط • ${data.savingsSummary.overallProgress}%`
      : "أضف هدف ادّخار";

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <DashboardSectionCard
        href="/wallets"
        icon="👛"
        title="المحافظ"
        description="أرصدة البنوك والكاش والبطاقات"
        primaryValue={maskBalance(formatCurrency(data.portfolio.assetTotal, data.currency))}
        secondaryValue={`${data.walletCount} محفظة • صافي الثروة بدون كريديت`}
        tone="emerald"
      />

      <DashboardSectionCard
        href="/expenses"
        icon="💸"
        title="المصروفات"
        description="تسجيل ومتابعة العمليات اليومية"
        primaryValue={maskBalance(formatCurrency(data.summary.totalExpenses, data.currency))}
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
        primaryValue={maskBalance(formatCurrency(data.summary.balance, data.currency))}
        secondaryValue={maskBalance(netMonthSecondary)}
        tone="sky"
      />

      <DashboardSectionCard
        href="/plan"
        icon="📋"
        title="الخطة"
        description="مقارنة المخطط بالواقع"
        className="hidden md:block"
        primaryValue={
          data.planComparison.hasPlan
            ? maskBalance(formatCurrency(data.planComparison.expenses.actual, data.currency))
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
        className="hidden md:block"
        primaryValue={maskBalance(
          formatCurrency(data.investmentSummary.totalCurrentValue, data.currency),
        )}
        secondaryValue={maskBalance(investmentSecondary, data.investmentCount > 0)}
        tone="indigo"
      />

      <DashboardSectionCard
        href="/reports"
        icon="📊"
        title="التقارير"
        description="تحليلات وتقارير مالية شاملة"
        className="hidden md:block"
        primaryValue={maskBalance(formatCurrency(data.summary.balance, data.currency))}
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
        className="hidden md:block"
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
        className="hidden md:block"
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
        className="hidden md:block"
        primaryValue={maskBalance(formatCurrency(data.savingsSummary.totalSaved, data.currency))}
        secondaryValue={maskBalance(savingsSecondary, data.savingsSummary.activeCount > 0)}
        tone="emerald"
      />

      <DashboardSectionCard
        href="/account"
        icon="⚙️"
        title="الحساب"
        description="الإعدادات والملف الشخصي"
        className="hidden md:block"
        primaryValue={data.profile?.full_name ?? "حسابك"}
        secondaryValue={`العملة: ${data.currency}`}
        tone="slate"
      />
    </section>
  );
}

export default function DashboardView({ monthLabel, data }: DashboardViewProps) {
  return (
    <DashboardBalanceVisibilityProvider>
      <div className="space-y-6">
        <section className="flex min-w-0 items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-2xl font-semibold text-slate-900 sm:text-3xl">
            {monthLabel}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <DashboardBalanceToggleButton />
            <DashboardAddExpenseButton />
          </div>
        </section>

        <DashboardCards data={data} />
      </div>
    </DashboardBalanceVisibilityProvider>
  );
}
