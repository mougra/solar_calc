import type { MetadataRoute } from "next";
import { CITIES } from "@/data/cities";
import { hasCityInsolation } from "@/lib/insolation";
import { CALCULATORS } from "@/data/calculators";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/kalkulyatory`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...CALCULATORS.map((calculator) => ({
      url: `${SITE_URL}${calculator.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/solnechnaya-elektrostanciya`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/metodika`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/o-proekte`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const cityPages: MetadataRoute.Sitemap = CITIES.filter((city) =>
    hasCityInsolation(city.slug),
  ).map((city) => ({
    url: `${SITE_URL}/solnechnaya-elektrostanciya/${city.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...cityPages];
}
