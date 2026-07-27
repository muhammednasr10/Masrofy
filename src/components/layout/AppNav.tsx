"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import HeaderAlertsBell from "@/components/layout/HeaderAlertsBell";
import { MasrofyLogo } from "@/components/layout/MasrofyLogo";
import type { DashboardAlert } from "@/lib/alerts/dashboard";
import { createClient } from "@/lib/supabase/client";

const primaryLinkKeys = [
  { href: "/dashboard", key: "nav.dashboard", icon: "🏠" },
  { href: "/expenses", key: "nav.expenses", icon: "💸" },
  { href: "/plan", key: "nav.plan", icon: "📋" },
  { href: "/wallets", key: "nav.wallets", icon: "👛" },
  { href: "/investments", key: "nav.investments", icon: "📈" },
] as const;

const secondaryLinkKeys = [
  { href: "/reports", key: "nav.reports" },
  { href: "/savings", key: "nav.savings" },
  { href: "/friends", key: "nav.friends" },
  { href: "/categories", key: "nav.categories" },
  { href: "/account", key: "nav.account" },
] as const;

export function AppNav({ alerts = [] }: { alerts?: DashboardAlert[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryLinks = useMemo(
    () => primaryLinkKeys.map((link) => ({ ...link, label: t(link.key) })),
    [t],
  );

  const secondaryLinks = useMemo(
    () => secondaryLinkKeys.map((link) => ({ ...link, label: t(link.key) })),
    [t],
  );

  const allLinks = useMemo(() => [...primaryLinks, ...secondaryLinks], [primaryLinks, secondaryLinks]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur safe-top">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="shrink-0">
            <MasrofyLogo href="/dashboard" />
          </div>

          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex md:flex-nowrap md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden">
            {allLinks.map((link) => {
              const active = pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition lg:px-4 lg:py-2 lg:text-sm ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <HeaderAlertsBell alerts={alerts} />

            <button
              type="button"
              onClick={handleSignOut}
              className="hidden rounded-full px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:inline-flex lg:px-4 lg:py-2 lg:text-sm"
            >
              {t("common.signOut")}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50 md:hidden"
              aria-expanded={menuOpen}
              aria-label={t("common.menu")}
            >
              ☰
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-emerald-50 bg-white px-4 py-3 md:hidden">
            <nav className="grid gap-1">
              {secondaryLinks.map((link) => {
                const active = pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-2xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-emerald-50 font-medium text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-2xl px-4 py-3 text-start text-sm text-red-600 transition hover:bg-red-50"
              >
                {t("common.signOutFull")}
              </button>
            </nav>
          </div>
        ) : null}
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 backdrop-blur md:hidden safe-bottom"
        aria-label={t("common.mainNav")}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-5">
          {primaryLinks.map((link) => {
            const active = pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-1 py-2 text-[11px] transition ${
                  active ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl text-base ${
                    active ? "bg-emerald-100" : ""
                  }`}
                >
                  {link.icon}
                </span>
                <span className={active ? "font-semibold" : ""}>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
