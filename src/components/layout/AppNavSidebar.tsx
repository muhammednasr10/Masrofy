"use client";

import Link from "@/components/router/Link";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { MasrofyLogo } from "@/components/layout/MasrofyLogo";
import SidebarPwaInstallButton from "@/components/layout/SidebarPwaInstallButton";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { isNavLinkActive, PRIMARY_NAV_LINKS, type AppNavLink } from "@/lib/navigation/links";

export default function AppNavSidebar({
  pathname,
  moreLinks,
  onClose,
  onSignOut,
}: {
  pathname: string;
  moreLinks: AppNavLink[];
  onClose: () => void;
  onSignOut: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
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
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("nav.primarySection")}
          </p>
          <ul className="space-y-1">
            {PRIMARY_NAV_LINKS.map((link) => (
              <SidebarLink key={link.href} link={link} pathname={pathname} label={t(link.key)} />
            ))}
          </ul>

          <p className="mt-6 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("nav.more")}
          </p>
          <ul className="space-y-1">
            {moreLinks.map((link) => (
              <SidebarLink key={link.href} link={link} pathname={pathname} label={t(link.key)} />
            ))}
          </ul>
        </nav>

        <div className="space-y-2 border-t border-emerald-50 p-4">
          <div className="rounded-2xl border border-slate-100 px-4 py-3">
            <LanguageSwitcher persistProfile />
          </div>
          <SidebarPwaInstallButton onOpen={onClose} />
          <button
            type="button"
            onClick={onSignOut}
            className="w-full rounded-2xl px-4 py-3 text-start text-sm text-red-600 transition hover:bg-red-50"
          >
            {t("common.signOutFull")}
          </button>
        </div>
      </aside>
    </div>
  );
}

function SidebarLink({
  link,
  pathname,
  label,
}: {
  link: AppNavLink;
  pathname: string;
  label: string;
}) {
  const active = isNavLinkActive(pathname, link.href);

  return (
    <li>
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
        <span>{label}</span>
      </Link>
    </li>
  );
}
