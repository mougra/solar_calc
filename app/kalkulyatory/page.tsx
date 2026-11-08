import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Container, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CALCULATORS } from "@/data/calculators";
import { breadcrumbsJsonLd, buildMetadata } from "@/lib/seo";

const PATH = "/kalkulyatory";

export const metadata: Metadata = buildMetadata({
  title: "Все калькуляторы солнечной системы и электрики",
  description:
    "Пять бесплатных калькуляторов: солнечные панели, ёмкость АКБ, инвертор, MPPT-контроллер и сечение кабеля. Без регистрации и рекламы в расчётах.",
  path: PATH,
});

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumbsJsonLd([
          { name: "Главная", path: "/" },
          { name: "Калькуляторы", path: PATH },
        ])}
      />

      <Container className="py-10">
        <nav aria-label="Хлебные крошки" className="mb-5 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Калькуляторы</span>
        </nav>

        <SectionHeading
          eyebrow="Инструменты"
          title="Калькуляторы SolarCalc"
          description="Полный набор для проектирования автономной системы: от потребления до сечения кабеля."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((calculator) => (
            <Link
              key={calculator.slug}
              href={calculator.href}
              className="card transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden="true">
                  {calculator.icon}
                </span>
                {calculator.badge ? (
                  <Badge tone="green">{calculator.badge}</Badge>
                ) : null}
              </div>
              <h2 className="mt-3 text-lg font-bold text-slate-900">
                {calculator.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {calculator.description}
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-emerald-700">
                Открыть →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
