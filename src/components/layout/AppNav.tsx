"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import HeaderAlertsBell from "@/components/layout/HeaderAlertsBell";
import HeaderPwaInstallButton from "@/components/layout/HeaderPwaInstallButton";
import SidebarPwaInstallButton from "@/components/layout/SidebarPwaInstallButton";
import { MasrofyLogo } from "@/components/layout/MasrofyLogo";
import { createClient } from "@/lib/supabase/client";

const navLinkKeys = [
  { href: "/expenses", key: "nav.expenses", icon: "💸" },
  { href: "/plan", key: "nav.plan", icon: "📋" },
  { href: "/wallets", key: "nav.wallets", icon: "👛" },
  { href: "/investments", key: "nav.investments", icon: "📈" },
  { href: "/reports", key: "nav.reports", icon: "📊" },
  { href: "/savings", key: "nav.savings", icon: "🎯" },
  { href: "/friends", key: "nav.friends", icon: "👥" },
  { href: "/categories", key: "nav.categories", icon: "🏷️" },
  { href: "/account", key: "nav.account", icon: "⚙️" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = useMemo(
    () => navLinkKeys.map((link) => ({ ...link, label: t(link.key) })),
    [t],
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [sidebarOpen]);

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
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-nav-sidebar"
            aria-label={t("common.menu")}
          >
            ☰
          </button>

          <div className="min-w-0 shrink md:shrink-0">
            <div className="md:hidden">
              <MasrofyLogo href="/dashboard" showText={false} size="sm" />
            </div>
            <div className="hidden md:block">
              <MasrofyLogo href="/dashboard" />
            </div>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex md:flex-nowrap md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden">
            {navLinks.map((link) => {
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

          <div className="ms-auto flex shrink-0 items-center gap-2 md:ms-0">
            <HeaderPwaInstallButton />
            <HeaderAlertsBell />

            <button
              type="button"
              onClick={handleSignOut}
              className="hidden rounded-full px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:inline-flex lg:px-4 lg:py-2 lg:text-sm"
            >
              {t("common.signOut")}
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setSidebarOpen(false)}
            aria-label={t("common.close")}
          />

          <aside
            id="mobile-nav-sidebar"
            className="absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-2xl safe-top safe-bottom"
            aria-label={t("common.mainNav")}
          >
            <div className="flex items-center justify-between border-b border-emerald-50 px-4 py-4">
              <MasrofyLogo href="/dashboard" size="sm" />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {navLinks.map((link) => {
                  const active = pathname.startsWith(link.href);

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                          active
                            ? "bg-emerald-50 font-medium text-emerald-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${
                            active ? "bg-emerald-100" : "bg-slate-50"
                          }`}
                        >
                          {link.icon}
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-emerald-50 p-4 space-y-2">
              <SidebarPwaInstallButton onOpen={() => setSidebarOpen(false)} />
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-2xl px-4 py-3 text-start text-sm text-red-600 transition hover:bg-red-50"
              >
                {t("common.signOutFull")}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
