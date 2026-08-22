export type AppNavLink = {
  href: string;
  key: string;
  icon: string;
};

/** Daily path: home → expenses → wallets → plan */
export const PRIMARY_NAV_LINKS: AppNavLink[] = [
  { href: "/dashboard", key: "nav.dashboard", icon: "🏠" },
  { href: "/expenses", key: "nav.expenses", icon: "💸" },
  { href: "/wallets", key: "nav.wallets", icon: "👛" },
  { href: "/plan", key: "nav.plan", icon: "📋" },
];

/** Progressive disclosure — still available, not in the main strip */
export const MORE_NAV_LINKS: AppNavLink[] = [
  { href: "/reports", key: "nav.reports", icon: "📊" },
  { href: "/investments", key: "nav.investments", icon: "📈" },
  { href: "/savings", key: "nav.savings", icon: "🎯" },
  { href: "/friends", key: "nav.friends", icon: "👥" },
  { href: "/categories", key: "nav.categories", icon: "🏷️" },
  { href: "/account", key: "nav.account", icon: "⚙️" },
];

export const ADMIN_NAV_LINK: AppNavLink = {
  href: "/admin/settings",
  key: "nav.adminSettings",
  icon: "🛠️",
};

export function isAdminNavActive(pathname: string) {
  return pathname === "/admin/settings" || pathname.startsWith("/admin/settings/");
}

export function isNavLinkActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isMoreNavActive(pathname: string, includeAdmin: boolean) {
  const links = includeAdmin ? [...MORE_NAV_LINKS, ADMIN_NAV_LINK] : MORE_NAV_LINKS;
  return links.some((link) => isNavLinkActive(pathname, link.href)) || (includeAdmin && isAdminNavActive(pathname));
}
