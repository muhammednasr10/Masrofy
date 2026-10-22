"use client";

import Link from "@/components/router/Link";
import { usePathname, useRouter } from "@/lib/router/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import AppNavMoreMenu from "@/components/layout/AppNavMoreMenu";
import AppNavSidebar from "@/components/layout/AppNavSidebar";
import HeaderAlertsBell from "@/components/layout/HeaderAlertsBell";
import HeaderMonthSwitcher from "@/components/layout/HeaderMonthSwitcher";
import HeaderPwaInstallButton from "@/components/layout/HeaderPwaInstallButton";
import { MasrofyLogo } from "@/components/layout/MasrofyLogo";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { createClient } from "@/lib/supabase/client";
import {
  ADMIN_NAV_LINK,
  isMoreNavActive,
  isNavLinkActive,
  MORE_NAV_LINKS,
  PRIMARY_NAV_LINKS,
  type AppNavLink,
} from "@/lib/navigation/links";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { isAdmin } = useIsAdmin();
  const moreRef = useRef<HTMLDivElement>(null);

  const moreLinks = useMemo(() => {
    const links: AppNavLink[] = [...MORE_NAV_LINKS];
    if (isAdmin) {
      links.splice(links.length - 1, 0, ADMIN_NAV_LINK);
    }
    return links;
  }, [isAdmin]);

  useEffect(() => {
    setSidebarOpen(false);
    setMoreOpen(false);
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

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [moreOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const moreActive = isMoreNavActive(pathname, isAdmin);

  return (
    <>
      <header className="sticky top-0 z-40 w-full overflow-visible border-b border-emerald-100 bg-white/95 backdrop-blur safe-top">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center gap-1.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
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

          <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
            {PRIMARY_NAV_LINKS.map((link) => {
              const active = isNavLinkActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition lg:px-4 lg:py-2 ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {t(link.key)}
                </Link>
              );
            })}

            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((current) => !current)}
                aria-expanded={moreOpen}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition lg:px-4 lg:py-2 ${
                  moreActive || moreOpen
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {t("nav.more")}
              </button>
              {moreOpen ? <AppNavMoreMenu pathname={pathname} moreLinks={moreLinks} /> : null}
            </div>
          </nav>

          <div className="ms-auto flex shrink-0 items-center gap-2 md:ms-0">
            <div className="hidden md:block">
              <HeaderMonthSwitcher />
            </div>
            <LanguageSwitcher compact persistProfile />
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
        <div className="border-t border-emerald-50 px-3 py-1.5 md:hidden">
          <HeaderMonthSwitcher />
        </div>
      </header>

      {sidebarOpen ? (
        <AppNavSidebar
          pathname={pathname}
          moreLinks={moreLinks}
          onClose={() => setSidebarOpen(false)}
          onSignOut={handleSignOut}
        />
      ) : null}
    </>
  );
}
