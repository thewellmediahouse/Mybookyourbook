export const DESKTOP_NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/create", label: "Ad Studio", exact: false },
  { href: "/dashboard/commercials", label: "Commercials", exact: false },
  { href: "/dashboard/brands", label: "Brands", exact: false },
  { href: "/dashboard/identity", label: "AI Identity", exact: false },
  { href: "/dashboard/media", label: "Media Library", exact: false },
  { href: "/dashboard/credits", label: "Credits", exact: false },
  { href: "/dashboard/billing", label: "Billing", exact: false },
  { href: "/dashboard/notifications", label: "Notifications", exact: false },
  { href: "/dashboard/team", label: "Team", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: false },
  { href: "/dashboard/help", label: "Help", exact: false },
] as const;

export const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", exact: true },
  { href: "/dashboard/commercials", label: "Commercials", exact: false },
  { href: "/dashboard/create", label: "Create", exact: false },
  { href: "/dashboard/credits", label: "Credits", exact: false },
  { href: "/dashboard/settings", label: "Account", exact: false },
] as const;

export function navItemActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
