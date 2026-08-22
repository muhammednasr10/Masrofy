"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { isNavLinkActive, PRIMARY_NAV_LINKS } from "@/lib/navigation/links";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden"
      aria-label={t("common.mainNav")}
    >
      <div className="pointer-events-auto border-t border-emerald-100 bg-white/95 backdrop-blur safe-bottom">
        <ul className="mx-auto grid max-w-5xl grid-cols-4 gap-1 px-2 py-1.5">
          {PRIMARY_NAV_LINKS.map((link) => {
            const active = isNavLinkActive(pathname, link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[11px] transition ${
                    active
                      ? "bg-emerald-50 font-semibold text-emerald-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {link.icon}
                  </span>
                  <span className="truncate">{t(link.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
