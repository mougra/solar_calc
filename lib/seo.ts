import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://solarcalc.ru"
).replace(/\/$/, "");

export const SITE_NAME = "SolarCalc";

/** На статическом хостинге Apache отдаёт каталоги, поэтому URL со слешем. */
const IS_STATIC = process.env.BUILD_MODE === "export";

export function sitePath(path: string): string {
  if (!IS_STATIC || path === "/" || path.endsWith("/")) return path;
  return `${path}/`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function defaultOgImage(path: string): string {
  if (path.startsWith("/solnechnaya-elektrostanciya/")) return "/og/city.png";
  if (path.startsWith("/kalkulyator")) return "/og/calculator.png";
  if (path.startsWith("/blog")) return "/og/article.png";
  return "/og/home.png";
}

export function buildMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  ogImage?: string;
}): Metadata {
  const {
    title,
    description,
    path,
    keywords,
    noindex = false,
    type = "website",
    publishedTime,
    modifiedTime,
    ogImage = defaultOgImage(path),
  } = input;

  const url = absoluteUrl(sitePath(path));
  const image = absoluteUrl(ogImage);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: sitePath(path) },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type,
      locale: "ru_RU",
      siteName: SITE_NAME,
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    description:
      "Независимый калькулятор автономного солнечного электроснабжения для России.",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/solnechnaya-elektrostanciya?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function webApplicationJsonLd(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: absoluteUrl(sitePath(input.path)),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    inLanguage: "ru-RU",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "RUB",
    },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbsJsonLd(
  crumbs: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(sitePath(crumb.path)),
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedTime: string;
  modifiedTime?: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(sitePath(input.path)),
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime ?? input.publishedTime,
    inLanguage: "ru-RU",
    author: {
      "@type": "Person",
      name: input.authorName ?? "Редакция SolarCalc",
    },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}
