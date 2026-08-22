import { newId } from "@/lib/id";

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "studio";
}

export function uniqueSlug(name: string): string {
  return `${slugify(name)}-${newId().slice(0, 6)}`;
}
