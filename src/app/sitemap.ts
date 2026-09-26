import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/book`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/areas`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/booking-terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [services, areas] = await Promise.all([
      prisma.service.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
      prisma.areaCovered.findMany({ where: { active: true }, select: { slug: true } }),
    ]);

    return [
      ...staticPages,
      ...services.map((service) => ({
        url: `${SITE.url}/services/${service.slug}`,
        lastModified: service.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.85,
      })),
      ...areas.map((area) => ({
        url: `${SITE.url}/areas/${area.slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // The database may be unreachable at build time; the static map is still valid.
    return staticPages;
  }
}
