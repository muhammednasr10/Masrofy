import { AppNav } from "@/components/layout/AppNav";
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
          <div className="min-h-full bg-gradient-to-b from-emerald-50 to-slate-50">
            <AppNav />
            <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
              {children}
            </main>
          </div>
        </OfflineProvider>
      </PwaInstallProvider>
    </OnboardingGate>
  );
}
