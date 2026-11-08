import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionHeading, Badge } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CITIES } from "@/data/cities";
import { annualYieldKwhPerKwp, hasCityInsolation } from "@/lib/insolation";
import { breadcrumbsJsonLd, buildMetadata } from "@/lib/seo";
import { getCityInsolation } from "@/lib/insolation";
import { fmt1 } from "@/lib/format";

const PATH = "/solnechnaya-elektrostanciya";

export const metadata: Metadata = buildMetadata({
  title: "Солнечная электростанция по городам России: выработка и расчёт",
  description:
    "Инсоляция и выработка солнечных панелей в 85 городах России: Москва, Санкт-Петербург, Краснодар, Новосибирск и другие. Расчёт по данным PVGIS.",
  path: PATH,
});

const DISTRICT_ORDER = ["ЦФО", "СЗФО", "ЮФО", "СКФО", "ПФО", "УФО", "СФО", "ДФО"];

export default function Page() {
  const available = CITIES.filter((city) => hasCityInsolation(city.slug));

  const groups = DISTRICT_ORDER.map((district) => ({
    district,
    cities: available
      .filter((city) => city.district === district)
      .sort((a, b) => b.populationK - a.populationK),
  })).filter((group) => group.cities.length > 0);

  return (
    <>
      <JsonLd
        data={breadcrumbsJsonLd([
          { name: "Главная", path: "/" },
          { name: "Солнечная электростанция по городам", path: PATH },
        ])}
      />

      <Container className="py-10">
        <nav aria-label="Хлебные крошки" className="mb-5 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Города</span>
        </nav>

        <SectionHeading
          eyebrow="География"
          title="Солнечная электростанция в вашем городе"
          description="Среднемноголетний приход солнечной радиации по данным PVGIS. Число справа — сколько кВт·ч в год даст 1 кВт установленной мощности при оптимальном угле."
        />

        <div className="mt-8 space-y-8">
          {groups.map((group) => (
            <section key={group.district}>
              <h2 className="text-lg font-bold text-slate-900">
                {group.district}
                <span className="ml-2 text-sm font-normal text-slate-400">
                  {group.cities.length} городов
                </span>
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.cities.map((city) => {
                  const data = getCityInsolation(city.slug);
                  const yieldKwh = data ? annualYieldKwhPerKwp(data) : 0;
                  return (
                    <Link
                      key={city.slug}
                      href={`${PATH}/${city.slug}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
                    >
                      <span>
                        <span className="block font-semibold text-slate-900">
                          {city.name}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {city.region}
                        </span>
                      </span>
                      <Badge tone="green">{fmt1(yieldKwh)} кВт·ч/кВт</Badge>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-sm leading-6 text-slate-500">
          Данные: PVGIS v5.3 (SARAH3, выше 65° с.ш. — ERA5). Приход на наклонную
          плоскость под оптимальным углом, среднее за доступный период базы.
          Реальная выработка зависит от угла, затенения и оборудования.
        </p>
      </Container>
    </>
  );
}
