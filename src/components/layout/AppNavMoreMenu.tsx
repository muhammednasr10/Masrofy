"use client";

import Link from "@/components/router/Link";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { isNavLinkActive, type AppNavLink } from "@/lib/navigation/links";

export default function AppNavMoreMenu({
  pathname,
  moreLinks,
}: {
  pathname: string;
  moreLinks: AppNavLink[];
}) {
  const t = useTranslations();

  return (
    <div className="absolute start-0 top-[calc(100%+0.5rem)] z-50 min-w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      {moreLinks.map((link) => {
        const active = isNavLinkActive(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              active
                ? "bg-emerald-50 font-medium text-emerald-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span aria-hidden>{link.icon}</span>
            <span>{t(link.key)}</span>
          </Link>
        );
      })}
    </div>
  );
}
