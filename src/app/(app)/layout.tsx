import { AppNav } from "@/components/layout/AppNav";
import OfflineProvider from "@/components/offline/OfflineProvider";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import PwaInstallProvider from "@/components/pwa/PwaInstallProvider";
import { loadHeaderAlerts } from "@/lib/alerts";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const alerts = await loadHeaderAlerts(supabase, user?.id);

  return (
    <OnboardingGate>
      <PwaInstallProvider>
        <OfflineProvider>
          <div className="min-h-full bg-gradient-to-b from-emerald-50 to-slate-50">
            <AppNav alerts={alerts} />
            <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:px-4 sm:py-8 md:pb-8">
              {children}
            </main>
          </div>
        </OfflineProvider>
      </PwaInstallProvider>
    </OnboardingGate>
  );
}
