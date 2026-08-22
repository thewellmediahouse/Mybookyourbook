import { normalizeEmail } from "@/lib/auth/password";

export function parseAdminEmails(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(",")
    .map((part) => normalizeEmail(part))
    .filter(Boolean);
}

export function isPlatformAdmin(email: string, adminEmails: string[]): boolean {
  const needle = normalizeEmail(email);
  return adminEmails.includes(needle);
}
