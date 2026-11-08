import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, Container, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CALCULATORS } from "@/data/calculators";
import {
  breadcrumbsJsonLd,
  faqJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo";

export function CalculatorLayout({
  title,
  description,
  path,
  h1,
  intro,
  children,
  seo,
  faq,
}: {
  title: string;
  description: string;
  path: string;
  h1: string;
  intro: string;
  children: ReactNode;
  seo: ReactNode;
  faq: { question: string; answer: string }[];
}) {
  const related = CALCULATORS.filter((calculator) => calculator.href !== path);

  return (
    <>
      <JsonLd
        data={[
          webApplicationJsonLd({ name: title, description, path }),
          faqJsonLd(faq),
          breadcrumbsJsonLd([
            { name: "Главная", path: "/" },
            { name: "Калькуляторы", path: "/kalkulyatory" },
            { name: title, path },
          ]),
        ]}
      />

      <Container className="py-8 sm:py-10">
        <nav aria-label="Хлебные крошки" className="mb-5 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link href="/kalkulyatory" className="hover:text-emerald-700">
            Калькуляторы
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{title}</span>
        </nav>

        <div className="max-w-3xl">
          <Badge tone="green">Бесплатно · без регистрации</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {h1}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{intro}</p>
        </div>

        <div className="card mt-8">{children}</div>
      </Container>

      <section className="border-t border-slate-200 bg-white py-12">
        <Container>
          <div className="prose-basic max-w-3xl">{seo}</div>
        </Container>
      </section>

      <Container className="py-12" as="section">
        <SectionHeading eyebrow="Вопросы" title="Частые вопросы" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {faq.map((item) => (
            <details key={item.question} className="card group">
              <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="text-emerald-600 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>

      <Container className="pb-16" as="section">
        <SectionHeading eyebrow="Дальше" title="Другие калькуляторы" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((calculator) => (
            <Link
              key={calculator.slug}
              href={calculator.href}
              className="card transition-shadow hover:shadow-md"
            >
              <span aria-hidden="true">{calculator.icon}</span>
              <span className="mt-2 block font-semibold text-slate-900">
                {calculator.title}
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {calculator.short}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
