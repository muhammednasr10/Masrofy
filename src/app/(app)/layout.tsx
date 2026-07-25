import { AppNav } from "@/components/layout/AppNav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50 to-slate-50">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
