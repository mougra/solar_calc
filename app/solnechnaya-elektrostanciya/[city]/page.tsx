import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Card, Stat, Badge, Note } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { MonthlyChart } from "@/components/MonthlyChart";
import { AffiliateBlock } from "@/components/AffiliateBlock";
import { CITIES, CITY_BY_SLUG } from "@/data/cities";
import {
  annualYieldKwhPerKwp,
  getCityInsolation,
  monthlyPsh,
} from "@/lib/insolation";
import {
  breadcrumbsJsonLd,
  buildMetadata,
  faqJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo";
import { DAYS_IN_MONTH, batterySizing, requiredPvW, systemEfficiency } from "@/lib/core/calc";
import { fmt1, fmtAh, fmtEnergy, monthFull } from "@/lib/format";

const BASE = "/solnechnaya-elektrostanciya";
const DAILY_WH = 3000; // эталонный дом: 3 кВт·ч в сутки

export const revalidate = 86400;

export function generateStaticParams() {
  return CITIES.filter((city) => getCityInsolation(city.slug)).map((city) => ({
    city: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = CITY_BY_SLUG.get(slug);
  if (!city) return buildMetadata({ title: "Город не найден", description: "", path: BASE });

  const data = getCityInsolation(slug);
  const annual = data ? annualYieldKwhPerKwp(data) : 0;

  return buildMetadata({
    title: `Солнечная электростанция в ${city.name}: выработка по месяцам`,
    description: `Инсоляция и выработка солнечных панелей в ${city.name}. Сколько нужно панелей и аккумуляторов для дома — расчёт по данным PVGIS. ${fmt1(annual)} кВт·ч/кВт в год.`,
    path: `${BASE}/${slug}`,
    keywords: [
      `солнечные панели ${city.name}`,
      `солнечная электростанция ${city.name}`,
      `инсоляция ${city.name}`,
    ],
  });
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = CITY_BY_SLUG.get(slug);
  const data = getCityInsolation(slug);
  if (!city || !data) notFound();

  const psh = monthlyPsh(data);
  const psh30 = monthlyPsh(data, 30);
  const psh60 = monthlyPsh(data, 60);
  const annual = annualYieldKwhPerKwp(data);

  const eff = systemEfficiency({ batteryRoundTrip: 0.81 });
  const pvWinter = requiredPvW({
    dailyWh: DAILY_WH,
    psh: Math.max(psh[11] ?? 0, 0.05),
    efficiency: eff,
  });
  const pvSummer = requiredPvW({
    dailyWh: DAILY_WH,
    psh: Math.max(...psh),
    efficiency: eff,
  });
  const battery = batterySizing({
    dailyWh: DAILY_WH,
    autonomyDays: 2,
    voltage: 24,
    chemistry: "lifepo4",
  });

  const yields = psh.map((value, index) =>
    (pageYield(value) * (DAYS_IN_MONTH[index] ?? 30)) / 1000,
  );

  const bestIndex = psh.indexOf(Math.max(...psh));
  const worstIndex = psh.indexOf(Math.min(...psh));
  const polarNight = (psh[11] ?? 0) <= 0.02;

  const faq = [
    {
      question: `Сколько солнечных панелей нужно для дома в ${city.name}?`,
      answer: `Для 3 кВт·ч в сутки летом достаточно ${fmt1(Math.round(pvSummer / 10) / 100)} кВт, для автономной работы в декабре — около ${fmt1(Math.round(pvWinter / 10) / 100)} кВт. Разница определяется зимней инсоляцией: ${fmt1(psh[11] ?? 0)} против ${fmt1(Math.max(...psh))} кВт·ч/м² в сутки.`,
    },
    {
      question: `Какой угол наклона панелей оптимален в ${city.name}?`,
      answer: `По расчёту PVGIS — около ${data.optimalTilt}°. Зимой выгоднее ставить круче (55–70°), чтобы снег скатывался и ловить низкое солнце, летом — ближе к 30°. На широте ${city.name} разница между оптимальным и «летним» углом умеренная.`,
    },
    {
      question: `Хватит ли солнца зимой в ${city.name}?`,
      answer: polarNight
        ? `В декабре в ${city.name} полярная ночь — выработки нет. Зимой нужен генератор или очень большой массив и батарея, рассчитанная на месяцы без солнца.`
        : `В декабре приход составляет ${fmt1(psh[11] ?? 0)} кВт·ч/м² в сутки — это ${Math.round(((psh[11] ?? 0) / Math.max(...psh)) * 100)}% от лучшего месяца. Полная автономия зимой возможна, но массив вырастает в ${Math.round(pvWinter / Math.max(pvSummer, 1))} раз.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          webApplicationJsonLd({
            name: `Расчёт солнечной электростанции в ${city.name}`,
            description: `Инсоляция и выработка по месяцам в ${city.name}.`,
            path: `${BASE}/${slug}`,
          }),
          faqJsonLd(faq),
          breadcrumbsJsonLd([
            { name: "Главная", path: "/" },
            { name: "Города", path: BASE },
            { name: city.name, path: `${BASE}/${slug}` },
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
            Города
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{city.name}</span>
        </nav>

        <div className="max-w-3xl">
          <Badge tone="green">PVGIS · {data.source === "ERA5" ? "ERA5" : "SARAH3"}</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Солнечная электростанция в {city.name}: выработка по месяцам
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {city.region}. Оптимальный угол наклона — {data.optimalTilt}°. Годовой
            приход — {fmt1(annual)} кВт·ч/м², это {fmt1(annual)} кВт·ч с каждого
            киловатта панелей.
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Лучший месяц"
            value={monthFull(bestIndex)}
            hint={`${fmt1(psh[bestIndex] ?? 0)} кВт·ч/м² в сутки`}
          />
          <Stat
            label="Худший месяц"
            value={monthFull(worstIndex)}
            hint={`${fmt1(psh[worstIndex] ?? 0)} кВт·ч/м² в сутки`}
            tone="amber"
          />
          <Stat
            label="Для лета (3 кВт·ч/сут)"
            value={fmt1(Math.round(pvSummer / 10) / 100)}
            unit="кВт"
            hint="панелей"
            tone="blue"
          />
          <Stat
            label="Для зимы (3 кВт·ч/сут)"
            value={fmt1(Math.round(pvWinter / 10) / 100)}
            unit="кВт"
            hint="панелей"
            tone="blue"
          />
        </div>

        <Card className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">
            Приход солнечной радиации по месяцам
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Наклон под оптимальным углом {data.optimalTilt}°. Значения — средние
            кВт·ч/м² в сутки.
          </p>
          <div className="mt-4">
            <MonthlyChart
              yieldKwh={yields}
              caption={`Выработка массива для эталонного дома (3 кВт·ч/сут) при ${fmt1(
                Math.round(pvWinter / 10) / 100,
              )} кВт панелей.`}
            />
          </div>
        </Card>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-bold text-slate-900">
              Сколько нужно панелей и АКБ
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Расчёт для дома с потреблением 3 кВт·ч в сутки, напряжением 24 В,
              LiFePO4 и двумя днями автономии.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Панели для лета", `${fmt1(Math.round(pvSummer / 10) / 100)} кВт`],
                ["Панели для зимы", `${fmt1(Math.round(pvWinter / 10) / 100)} кВт`],
                ["Аккумуляторы", fmtAh(battery.recommendedAh)],
                ["Номинальная энергия АКБ", fmtEnergy(battery.recommendedAh * 24)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/kalkulyator-solnechnyh-panelej?city=${slug}&step=1`}
              className="btn btn-primary mt-5 w-full"
            >
              Рассчитать под свой дом →
            </Link>
          </Card>

          <Card>
            <h2 className="font-bold text-slate-900">Углы наклона</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Зимой солнце низко, летом — высоко. Один угол не может быть
              идеальным круглый год.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              {[
                ["Оптимальный", data.optimalTilt],
                ["Летний", 30],
                ["Зимний", 60],
              ].map(([label, tilt]) => (
                <div key={String(label)} className="flex justify-between gap-3">
                  <dt className="text-slate-500">
                    {label} угол, {String(tilt)}°
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {fmt1(
                      (tilt === 30 ? psh30[11] : tilt === 60 ? psh60[11] : psh[11]) ?? 0,
                    )}{" "}
                    кВт·ч/м² в декабре
                  </dd>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Значения приведены для декабря. Крутой зимний угол также помогает
              снегу скатываться с панелей.
            </p>
          </Card>
        </div>

        <div className="mt-6">
          <AffiliateBlock
            category="panels"
            title={`Купить панели в ${city.name} и с доставкой`}
            note="Ссылки ведут в поиск маркетплейсов — сравнивайте цену и отзывы."
          />
        </div>

        {polarNight ? (
          <div className="mt-6">
            <Note tone="amber">
              Выше полярного круга зимой солнца нет. Автономная система здесь
              рассчитывается на месяцы без генерации: нужен либо очень большой
              массив с летним запасом, либо генератор.
            </Note>
          </div>
        ) : null}

        <div className="prose-basic mt-10 max-w-3xl">
          <h2>Что значит инсоляция {fmt1(annual)} кВт·ч/м² в год</h2>
          <p>
            Это сколько энергии падает на квадратный метр под оптимальным углом за
            год. Панель на 550 Вт занимает около 2,3 м² и при КПД системы 20% даёт
            примерно {fmt1(annual * 2.3 * 0.2)} кВт·ч в год.
            Реальная цифра зависит от инвертора, затенения и угла.
          </p>
          <p>
            Для {city.name} самый продуктивный месяц — {monthFull(bestIndex)}, а
            самый слабый — {monthFull(worstIndex)}. Планируя автономную систему,
            ориентируйтесь на худший: именно он определяет, сколько панелей и
            батарей нужно, чтобы пережить зиму.
          </p>

          <h2>Что дальше</h2>
          <ul>
            <li>
              <Link href={`/kalkulyator-solnechnyh-panelej?city=${slug}`}>
                Полный калькулятор системы
              </Link>{" "}
              — по вашим приборам.
            </li>
            <li>
              <Link href="/kalkulyator-secheniya-kabelya">
                Сечение кабеля
              </Link>{" "}
              — чтобы не терять энергию на проводах.
            </li>
            <li>
              <Link href="/metodika">Методика</Link> — откуда данные и формулы.
            </li>
          </ul>
        </div>
      </Container>
    </>
  );
}

/** Выработка 1 кВт массива за сутки, кВт·ч (упрощённо, КПД 0,8). */
function pageYield(psh: number): number {
  return psh * 0.8;
}
