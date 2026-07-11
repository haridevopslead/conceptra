import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { PUBLIC_LESSON_SLUGS } from "@/lib/public-lessons";

const BASE_URL = "https://conceptra.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/try`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/lessons`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Only the whitelisted briefs are reachable without an account (see
  // lib/public-lessons.ts) — the other 5 sit behind a login redirect, so
  // they'd be worthless (or actively misleading) to list here. Re-check
  // `published` too, in case a whitelisted slug ever gets unpublished.
  let briefRoutes: MetadataRoute.Sitemap = [];
  try {
    const publicLessons = await db.lesson.findMany({
      where: { slug: { in: [...PUBLIC_LESSON_SLUGS] }, published: true },
      select: { slug: true, updatedAt: true },
    });
    briefRoutes = publicLessons.map((lesson) => ({
      url: `${BASE_URL}/lessons/${lesson.slug}`,
      lastModified: lesson.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    // DB unavailable — still list the known-public slugs (with today's date
    // as a rough stand-in for lastModified) rather than 500ing the sitemap.
    briefRoutes = PUBLIC_LESSON_SLUGS.map((slug) => ({
      url: `${BASE_URL}/lessons/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  }

  return [...staticRoutes, ...briefRoutes];
}
