"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "لوحة التحكم" },
  { href: "/expenses", label: "المصروفات" },
  { href: "/categories", label: "الفئات" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-sm text-emerald-700">Masrofy</p>
          <h1 className="text-lg font-semibold text-slate-900">مصروفي</h1>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
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
      </div>
    </header>
  );
}
