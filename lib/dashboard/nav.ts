export const DESKTOP_NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/create", label: "Studio", exact: false },
  { href: "/dashboard/profile", label: "Reference Profile", exact: false },
  { href: "/dashboard/credits", label: "Buy Credits", exact: false },
  { href: "/dashboard/billing", label: "Billing", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: false },
  { href: "/dashboard/help", label: "Help", exact: false },
] as const;

export const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", exact: true },
  { href: "/dashboard/create", label: "Studio", exact: false },
  { href: "/dashboard/credits", label: "Credits", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: false },
] as const;

export function navItemActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
