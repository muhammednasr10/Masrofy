import { AppNav } from "@/components/layout/AppNav";
import AppShell from "@/components/layout/AppShell";
import { SelectedMonthProvider } from "@/components/month/SelectedMonthProvider";
import OfflineProvider from "@/components/offline/OfflineProvider";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import PwaInstallProvider from "@/components/pwa/PwaInstallProvider";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <OnboardingGate>
      <PwaInstallProvider>
        <OfflineProvider>
          <SelectedMonthProvider>
            <AppShell>
              <div className="min-h-full w-full overflow-x-hidden bg-gradient-to-b from-emerald-50 to-slate-50">
                <AppNav />
                <main className="mx-auto w-full min-w-0 max-w-5xl overflow-x-hidden px-3 py-4 pb-36 sm:px-4 sm:py-8 md:pb-28">
                  {children}
                </main>
              </div>
            </AppShell>
          </SelectedMonthProvider>
        </OfflineProvider>
      </PwaInstallProvider>
    </OnboardingGate>
  );
}
