import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Container, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { ARTICLES } from "@/data/articles";
import { breadcrumbsJsonLd, buildMetadata } from "@/lib/seo";

const PATH = "/blog";

export const metadata: Metadata = buildMetadata({
  title: "Статьи о солнечной энергетике и автономном электроснабжении",
  description:
    "Практические статьи: сколько нужно панелей, как пережить зиму, какой аккумулятор выбрать и как не потерять выработку на кабеле.",
  path: PATH,
});

export default function BlogPage() {
  const articles = [...ARTICLES].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbsJsonLd([
          { name: "Главная", path: "/" },
          { name: "Статьи", path: PATH },
        ])}
      />

      <Container className="py-10">
        <nav aria-label="Хлебные крошки" className="mb-5 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Статьи</span>
        </nav>

        <SectionHeading
          eyebrow="База знаний"
          title="Статьи"
          description="Разборы, которые дополняют калькуляторы: почему цифры получаются такими и где обычно ошибаются."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`${PATH}/${article.slug}`}
              className="card group flex flex-col transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Badge tone="green">{article.category}</Badge>
                <span className="text-xs text-slate-400">
                  {article.readingMinutes} мин
                </span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                {article.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {article.description}
              </p>
              <span className="mt-4 text-sm font-semibold text-emerald-700">
                Читать →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
