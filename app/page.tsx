import Link from "next/link";
import type { Metadata } from "next";
import { Badge, ButtonLink, Card, Container, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { CALCULATORS } from "@/data/calculators";
import { CITIES_BY_POPULATION } from "@/data/cities";
import {
  buildMetadata,
  faqJsonLd,
  organizationJsonLd,
  webApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Калькулятор солнечных панелей для дома — расчёт по инсоляции",
  description:
    "Бесплатный калькулятор автономной солнечной электростанции: потребление, ёмкость АКБ, мощность панелей, инвертор и кабель. Реальная инсоляция по городам России (PVGIS).",
  path: "/",
});

const FAQ = [
  {
    question: "Хватит ли солнечных панелей зимой?",
    answer:
      "В средней полосе России декабрь даёт в 7–8 раз меньше энергии, чем июнь. В Москве приход на наклонную плоскость падает с 5,65 до 0,69 кВт·ч/м² в сутки. Поэтому калькулятор показывает два размера системы: «летний» и «зимний». Зимняя автономия возможна, но массив получается в разы дороже — часто выгоднее оставить генератор как резерв.",
  },
  {
    question: "Можно ли ставить LiFePO4 в неотапливаемый дом?",
    answer:
      "Эксплуатировать — да, заряжать при отрицательной температуре — нет. Производители запрещают заряд LiFePO4 ниже 0 °C из-за литиевого осаждения. В неотапливаемом помещении нужен подогрев, утеплённый бокс или переход на AGM. Калькулятор предупреждает об этом, если вы выбрали LiFePO4 для зимнего режима.",
  },
  {
    question: "Почему нужен запас мощности инвертора?",
    answer:
      "Скважинный насос на 800 Вт в момент пуска потребляет 2,4–4 кВт. Инвертор должен пережить этот бросок, иначе он уйдёт в защиту. Мы закладываем пусковой ток и 25% запаса по длительной мощности.",
  },
  {
    question: "Насколько точны ваши расчёты?",
    answer:
      "Инсоляция — из PVGIS (JRC) по многолетним данным. Формулы открыты и покрыты тестами. Реальная выработка зависит от угла, затенения, снега и состояния оборудования, поэтому результат — оценка с точностью около ±15%.",
  },
  {
    question: "Вы продаёте оборудование?",
    answer:
      "Нет. SolarCalc — независимый сервис. В результатах мы показываем, где искать комплектующие, и помечаем партнёрские ссылки, но расчёт не зависит от того, купите вы что-то или нет.",
  },
];

export default function HomePage() {
  const topCities = CITIES_BY_POPULATION.slice(0, 12);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(),
          webApplicationJsonLd({
            name: "Калькулятор солнечных панелей SolarCalc",
            description:
              "Расчёт автономной солнечной электростанции по инсоляции города.",
            path: "/",
          }),
          faqJsonLd(FAQ),
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-emerald-50 via-white to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl"
        />
        <Container className="relative py-14 sm:py-20">
          <div className="max-w-3xl">
            <Badge tone="green">Данные PVGIS · без регистрации</Badge>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Калькулятор солнечных панелей для дома —{" "}
              <span className="text-emerald-600">честный расчёт</span>, а не
              продажа комплекта
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Считаем потребление, ёмкость аккумуляторов, мощность панелей и
              инвертора по реальной инсоляции вашего города. Показываем зимний и
              летний сценарии — чтобы вы видели разницу в цене до покупки.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/kalkulyator-solnechnyh-panelej">
                Рассчитать систему →
              </ButtonLink>
              <ButtonLink href="/kalkulyator-secheniya-kabelya" variant="outline">
                Калькулятор кабеля
              </ButtonLink>
            </div>

            <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Городов", value: `${CITIES_BY_POPULATION.length}` },
                { label: "Месяцев данных", value: "12" },
                { label: "Формул в тестах", value: "16" },
                { label: "Стоимость", value: "0 ₽" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* Калькуляторы */}
      <Container className="py-14" as="section">
        <SectionHeading
          eyebrow="Инструменты"
          title="Что можно посчитать"
          description="Пять калькуляторов, которые закрывают путь от «хочу свет в доме» до списка оборудования с сечениями проводов."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((calculator, index) => (
            <Link
              key={calculator.slug}
              href={calculator.href}
              className={`group card transition-shadow hover:shadow-md ${
                index === 0 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {calculator.icon}
                </span>
                {calculator.badge ? (
                  <Badge tone="green">{calculator.badge}</Badge>
                ) : null}
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                {calculator.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{calculator.short}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {calculator.description}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700">
                Открыть →
              </span>
            </Link>
          ))}
        </div>
      </Container>

      {/* Почему верим */}
      <section className="border-y border-slate-200 bg-white py-14">
        <Container>
          <SectionHeading
            eyebrow="Методология"
            title="Почему этим цифрам можно верить"
            description="Мы не берём данные «из головы» и не подгоняем результат под продажу. Каждый шаг проверяем."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Инсоляция из PVGIS",
                text: "Месячные суммы прихода на наклонную плоскость по 85 городам России. База JRC (SARAH3), выше 65° с.ш. — ERA5. Обновление — скриптом, а не вручную.",
              },
              {
                title: "Открытые формулы",
                text: "Энергия, ёмкость, мощность массива, ток MPPT и сечение кабеля — в одном файле lib/core/calc.ts. 16 unit-тестов фиксируют эталонные значения.",
              },
              {
                title: "Два сценария",
                text: "Зимняя автономия и летняя с генератором считаются раздельно. Разница в Москве — почти восьмикратная, и вы видите её до покупки.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Как работает */}
      <Container className="py-14" as="section">
        <SectionHeading
          eyebrow="Процесс"
          title="Четыре шага до списка оборудования"
        />
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { n: "1", t: "Город", d: "Берём инсоляцию и оптимальный угол наклона." },
            { n: "2", t: "Приборы", d: "Отмечаете, что будете питать, и часы работы." },
            { n: "3", t: "Система", d: "Напряжение 12/24/48 В, тип АКБ, дни автономии." },
            { n: "4", t: "Результат", d: "Панели, ёмкость, инвертор, MPPT и кабель." },
          ].map((step) => (
            <li key={step.n} className="card">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {step.n}
              </span>
              <h3 className="mt-3 font-bold text-slate-900">{step.t}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{step.d}</p>
            </li>
          ))}
        </ol>
      </Container>

      {/* Города */}
      <section className="border-y border-slate-200 bg-white py-14">
        <Container>
          <SectionHeading
            eyebrow="География"
            title="Расчёт для вашего города"
            description="У каждого города — своя инсоляция по месяцам, оптимальный угол и рекомендуемая система."
          />
          <div className="mt-7 flex flex-wrap gap-2">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/solnechnaya-elektrostanciya/${city.slug}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {city.name}
              </Link>
            ))}
            <Link
              href="/solnechnaya-elektrostanciya"
              className="rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800"
            >
              Все города →
            </Link>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <Container className="py-14" as="section">
        <SectionHeading eyebrow="Вопросы" title="Частые вопросы" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {FAQ.map((item) => (
            <details
              key={item.question}
              className="card group [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-slate-900">
                {item.question}
                <span className="text-emerald-600 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </>
  );
}
