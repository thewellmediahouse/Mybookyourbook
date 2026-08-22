import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/site/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
