import { AppNav } from "@/components/layout/AppNav";
import AppShell from "@/components/layout/AppShell";
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
          <AppShell>
            <div className="min-h-full w-full overflow-x-hidden bg-gradient-to-b from-emerald-50 to-slate-50">
              <AppNav />
              <main className="mx-auto w-full min-w-0 max-w-5xl overflow-x-hidden px-3 py-4 pb-24 sm:px-4 sm:py-8 sm:pb-28">
                {children}
              </main>
            </div>
          </AppShell>
        </OfflineProvider>
      </PwaInstallProvider>
    </OnboardingGate>
  );
}
