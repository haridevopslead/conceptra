import type { MetadataRoute } from "next";

const BASE_URL = "https://conceptra.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything under these paths requires a session — no public content
      // to index, and /api is never meant to be crawled.
      disallow: ["/dashboard", "/interview", "/settings", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
