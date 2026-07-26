"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MasrofyLogo } from "@/components/layout/MasrofyLogo";
import { createClient } from "@/lib/supabase/client";

const primaryLinks = [
  { href: "/dashboard", label: "الرئيسية", icon: "🏠" },
  { href: "/expenses", label: "المصروفات", icon: "💸" },
  { href: "/plan", label: "الخطة", icon: "📋" },
  { href: "/wallets", label: "المحافظ", icon: "👛" },
  { href: "/investments", label: "استثمار", icon: "📈" },
];

const secondaryLinks = [
  { href: "/reports", label: "التقارير" },
  { href: "/savings", label: "الادّخار" },
  { href: "/friends", label: "العلاقات" },
  { href: "/categories", label: "الفئات" },
  { href: "/account", label: "الحساب" },
];

const allLinks = [...primaryLinks, ...secondaryLinks];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <MasrofyLogo href="/dashboard" />

          <nav className="hidden flex-wrap items-center gap-2 md:flex">
            {allLinks.map((link) => {
              const active = pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              خروج
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-expanded={menuOpen}
            aria-label="القائمة"
          >
            ☰
          </button>
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
                className="rounded-2xl px-4 py-3 text-right text-sm text-red-600 transition hover:bg-red-50"
              >
                تسجيل الخروج
              </button>
            </nav>
          </div>
        ) : null}
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 backdrop-blur md:hidden safe-bottom"
        aria-label="التنقل الرئيسي"
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
