import { AppNav } from "@/components/layout/AppNav";
import OnboardingGate from "@/components/onboarding/OnboardingGate";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <OnboardingGate>
      <div className="min-h-full bg-gradient-to-b from-emerald-50 to-slate-50">
        <AppNav />
        <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:px-4 sm:py-8 md:pb-8">{children}</main>
      </div>
    </OnboardingGate>
  );
}
