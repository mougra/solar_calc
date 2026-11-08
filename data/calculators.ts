export interface CalculatorMeta {
  slug: string;
  href: string;
  title: string;
  short: string;
  description: string;
  icon: string;
  accent: "green" | "blue" | "amber";
  badge?: string;
}

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: "solnechnye-paneli",
    href: "/kalkulyator-solnechnyh-panelej",
    title: "Солнечные панели и АКБ",
    short: "Полный расчёт автономной системы",
    description:
      "Пошаговый расчёт: потребление, ёмкость аккумуляторов, мощность панелей, инвертор и контроллер по инсоляции вашего города.",
    icon: "☀️",
    accent: "green",
    badge: "Главный",
  },
  {
    slug: "emkost-akb",
    href: "/kalkulyator-emkosti-akb",
    title: "Ёмкость аккумуляторов",
    short: "А·ч под ваши сутки и автономию",
    description:
      "Сколько А·ч нужно, чтобы прожить 1–5 дней без солнца. Учитывает глубину разряда, КПД, температуру и старение.",
    icon: "🔋",
    accent: "blue",
  },
  {
    slug: "invertor",
    href: "/kalkulyator-invertora",
    title: "Мощность инвертора",
    short: "С запасом на пуск насоса",
    description:
      "Подбор инвертора по пиковой нагрузке и пусковым токам. Не даст купить слишком слабый или переплатить за лишний.",
    icon: "⚡",
    accent: "amber",
  },
  {
    slug: "mppt",
    href: "/kalkulyator-mppt",
    title: "Контроллер MPPT",
    short: "Ток контроллера в амперах",
    description:
      "Расчёт тока MPPT по мощности массива и напряжению батареи. Проверка, что контроллер не сгорит и не будет простаивать.",
    icon: "🎛️",
    accent: "blue",
  },
  {
    slug: "sechenie-kabelya",
    href: "/kalkulyator-secheniya-kabelya",
    title: "Сечение кабеля",
    short: "Падение напряжения и нагрев",
    description:
      "Сечение меди или алюминия по току, длине и допустимому падению напряжения. Для DC-линий и 220/380 В.",
    icon: "🔌",
    accent: "green",
  },
];

export const CALCULATOR_BY_SLUG = new Map(
  CALCULATORS.map((calculator) => [calculator.slug, calculator]),
);
