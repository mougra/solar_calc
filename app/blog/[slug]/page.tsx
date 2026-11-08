import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { ArticleBody } from "@/components/ArticleBody";
import { ARTICLES, ARTICLE_BY_SLUG } from "@/data/articles";
import { CALCULATORS } from "@/data/calculators";
import {
  articleJsonLd,
  breadcrumbsJsonLd,
  buildMetadata,
} from "@/lib/seo";

const BASE = "/blog";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLE_BY_SLUG.get(slug);
  if (!article) {
    return buildMetadata({
      title: "Статья не найдена",
      description: "",
      path: BASE,
      noindex: true,
    });
  }

  return buildMetadata({
    title: article.title,
    description: article.description,
    path: `${BASE}/${slug}`,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
  });
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLE_BY_SLUG.get(slug);
  if (!article) notFound();

  const related = CALCULATORS.filter((calculator) =>
    article.related.includes(calculator.href),
  );

  const more = ARTICLES.filter((item) => item.slug !== slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            title: article.title,
            description: article.description,
            path: `${BASE}/${slug}`,
            publishedTime: article.publishedAt,
            modifiedTime: article.updatedAt,
          }),
          breadcrumbsJsonLd([
            { name: "Главная", path: "/" },
            { name: "Статьи", path: BASE },
            { name: article.title, path: `${BASE}/${slug}` },
          ]),
        ]}
      />

      <Container className="py-8 sm:py-10">
        <nav aria-label="Хлебные крошки" className="mb-5 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link href={BASE} className="hover:text-emerald-700">
            Статьи
          </Link>
          <span className="mx-2">/</span>
          <span className="line-clamp-1 text-slate-700">{article.title}</span>
        </nav>

        <article className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">{article.category}</Badge>
            <span className="text-xs text-slate-400">
              {article.readingMinutes} мин чтения
            </span>
            <span className="text-xs text-slate-400">
              Обновлено {formatDate(article.updatedAt)}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {article.title}
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">{article.intro}</p>

          <div className="mt-8">
            <ArticleBody sections={article.sections} />
          </div>

          {article.conclusion ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-[15px] leading-7 text-emerald-950">
              <p className="font-semibold">Итог</p>
              <p className="mt-1.5">{article.conclusion}</p>
            </div>
          ) : null}
        </article>

        <div className="mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">
            Посчитать под свой дом
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((calculator) => (
              <Link
                key={calculator.slug}
                href={calculator.href}
                className="btn btn-outline"
              >
                {calculator.title}
              </Link>
            ))}
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">Читайте также</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {more.map((item) => (
              <Link
                key={item.slug}
                href={`${BASE}/${item.slug}`}
                className="card transition-shadow hover:shadow-md"
              >
                <span className="text-xs font-medium text-emerald-700">
                  {item.category}
                </span>
                <span className="mt-1 block font-semibold text-slate-900">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
