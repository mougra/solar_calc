import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorWizard } from "@/components/calculator/Wizard";
import { JsonLd } from "@/components/JsonLd";
import { Badge, Container, SectionHeading } from "@/components/ui";
import { CALCULATORS } from "@/data/calculators";
import { getCityOptions } from "@/lib/cities-data";
import { DEFAULT_STATE } from "@/lib/state/query";
import {
  breadcrumbsJsonLd,
  buildMetadata,
  faqJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo";

const PATH = "/kalkulyator-solnechnyh-panelej";

export const metadata: Metadata = buildMetadata({
  title: "Калькулятор солнечных панелей и аккумуляторов для дома",
  description:
    "Рассчитайте мощность солнечных панелей, ёмкость аккумуляторов и инвертор для автономного дома. Пошаговый калькулятор по инсоляции вашего города, без регистрации.",
  path: PATH,
  keywords: [
    "калькулятор солнечных панелей",
    "расчёт солнечной электростанции",
    "калькулятор аккумуляторов",
    "автономная солнечная система",
  ],
});

const FAQ = [
  {
    question: "Сколько солнечных панелей нужно для дома 100 м²?",
    answer:
      "Зависит не от площади дома, а от потребления и региона. Для 3 кВт·ч в сутки в Москве нужно около 0,7 кВт панелей для лета и около 5 кВт для автономной зимы. Калькулятор считает это по вашим приборам и выбранному месяцу.",
  },
  {
    question: "Почему расчёт делается по худшему месяцу?",
    answer:
      "Если система покрывает декабрь, она покроет и остальные месяцы. Обратный подход — считать по июню — приводит к разряду батарей в январе. Для сезонного дома разумнее считать по лету и иметь генератор.",
  },
  {
    question: "Что такое холостой ход инвертора и почему он в расчёте?",
    answer:
      "Инвертор потребляет энергию даже без нагрузки — обычно 10–30 Вт. За сутки это 0,24–0,72 кВт·ч, то есть до 20–30% потребления небольшой системы. Без учёта этого параметра расчёт занижает ёмкость батареи.",
  },
  {
    question: "Можно ли использовать калькулятор для сетевой станции?",
    answer:
      "Да, для оценки выработки: выберите город и мощность массива, а результат по месяцам покажет, сколько энергии даст система. Но окупаемость по тарифу и зелёному тарифу считается отдельно — этого блока пока нет.",
  },
  {
    question: "Как проверить расчёт перед покупкой?",
    answer:
      "Сверьте напряжение холостого хода панелей с диапазоном MPPT, ток контроллера — с номиналом, а пусковой ток насоса — с перегрузочной способностью инвертора. Итоговую схему должен проверить электрик.",
  },
];

export default function CalculatorPage() {
  const cities = getCityOptions();
  const initial = {
    ...DEFAULT_STATE,
    items: DEFAULT_STATE.items.map((item) => ({ ...item })),
  };

  return (
    <>
      <JsonLd
        data={[
          webApplicationJsonLd({
            name: "Калькулятор солнечных панелей и аккумуляторов",
            description:
              "Пошаговый расчёт автономной солнечной системы по инсоляции города.",
            path: PATH,
          }),
          faqJsonLd(FAQ),
          breadcrumbsJsonLd([
            { name: "Главная", path: "/" },
            { name: "Калькулятор солнечных панелей", path: PATH },
          ]),
        ]}
      />

      <Container className="py-8 sm:py-10">
        <nav aria-label="Хлебные крошки" className="mb-5 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-700">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Калькулятор солнечных панелей</span>
        </nav>

        <div className="max-w-3xl">
          <Badge tone="green">Бесплатно · без регистрации</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Калькулятор солнечных панелей и аккумуляторов
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Четыре шага: город, приборы, параметры системы, результат. В конце —
            мощность панелей, ёмкость АКБ, инвертор, ток MPPT и выработка по
            месяцам. Ссылка на расчёт сохраняется в адресной строке.
          </p>
        </div>

        <div className="mt-8">
          <CalculatorWizard initial={initial} cities={cities} />
        </div>
      </Container>

      {/* SEO-текст */}
      <section className="border-t border-slate-200 bg-white py-12">
        <Container>
          <div className="prose-basic max-w-3xl">
            <h2>Как калькулятор считает солнечную систему</h2>
            <p>
              Расчёт идёт от потребления, а не от площади крыши. Сначала
              складываются все приборы с учётом эффективных часов работы и
              добавляется холостой ход инвертора. Затем по выбранному месяцу
              подбирается ёмкость аккумуляторов с учётом глубины разряда, КПД
              цикла, температуры и старения. Мощность панелей считается по
              худшему месяцу: P = E / (PSH × КПД), где PSH — суточный приход
              солнечной радиации на наклонную плоскость.
            </p>
            <p>
              Инсоляция берётся из PVGIS — базы Joint Research Centre. Для
              каждого из 85 городов России хранится 12 месячных значений. Выше 65°
              северной широты PVGIS переключается на ERA5, поэтому Мурманск и
              Норильск считаются корректно, включая полярную ночь.
            </p>

            <h2>Почему зимняя и летняя системы отличаются в разы</h2>
            <p>
              В Москве приход на наклонную плоскость в декабре — около 0,69
              кВт·ч/м² в сутки, а в июне — 5,65 кВт·ч/м². Разница почти
              восьмикратная. Поэтому «солнечная станция для дома» без уточнения
              сезона — бессмысленное понятие: летняя система на 1 кВт и зимняя на
              5–6 кВт решают разные задачи и стоят по-разному.
            </p>
            <p>
              Калькулятор показывает оба числа. Если вы живёте в доме круглый год
              и хотите полную автономию, ориентируйтесь на зимнее значение. Если
              дом дачный или есть генератор — считайте по лету, это в разы
              дешевле.
            </p>

            <h2>Что ещё стоит проверить</h2>
            <ul>
              <li>
                Напряжение холостого хода массива не должно превышать максимум
                MPPT-контроллера даже в мороз — при −30 °C Voc растёт на 10–12%.
              </li>
              <li>
                Сечение DC-кабеля подбирается по току и допустимому падению
                напряжения — есть{" "}
                <Link href="/kalkulyator-secheniya-kabelya">отдельный калькулятор</Link>.
              </li>
              <li>
                LiFePO4 нельзя заряжать при отрицательных температурах — нужен
                подогрев или утеплённый бокс.
              </li>
              <li>
                Инвертор должен переживать пуск насоса: запас по перегрузке
                3–5 крат.
              </li>
            </ul>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <Container className="py-12" as="section">
        <SectionHeading eyebrow="Вопросы" title="Частые вопросы о расчёте" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {FAQ.map((item) => (
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

      {/* Другие калькуляторы */}
      <Container className="pb-16" as="section">
        <SectionHeading eyebrow="Дальше" title="Смежные калькуляторы" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CALCULATORS.filter((calculator) => calculator.href !== PATH).map(
            (calculator) => (
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
            ),
          )}
        </div>
      </Container>
    </>
  );
}
