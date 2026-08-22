import type { MetadataRoute } from "next";
import { robotsConfig } from "@/lib/site/seo";

export default function robots(): MetadataRoute.Robots {
  return robotsConfig();
}
