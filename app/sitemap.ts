import type { MetadataRoute } from "next";
import { CITIES } from "@/data/cities";
import { hasCityInsolation } from "@/lib/insolation";
import { CALCULATORS } from "@/data/calculators";
import { ARTICLES } from "@/data/articles";
import { SITE_URL, sitePath } from "@/lib/seo";

// Нужно для статического экспорта: sitemap генерируется на этапе сборки.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${SITE_URL}${sitePath(path)}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: url("/kalkulyatory"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...CALCULATORS.map((calculator) => ({
      url: url(calculator.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    {
      url: url("/solnechnaya-elektrostanciya"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: url("/metodika"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: url("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: url("/o-proekte"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: url("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const cityPages: MetadataRoute.Sitemap = CITIES.filter((city) =>
    hasCityInsolation(city.slug),
  ).map((city) => ({
    url: url(`/solnechnaya-elektrostanciya/${city.slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: url(`/blog/${article.slug}`),
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...cityPages, ...articlePages];
}
