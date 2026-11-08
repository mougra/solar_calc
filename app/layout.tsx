import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BrandMark } from "@/components/ui";
import { MetrikaScript } from "@/components/MetrikaScript";
import { MetrikaHits } from "@/components/MetrikaHits";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "SolarCalc — калькулятор солнечных панелей и аккумуляторов для дома",
    template: "%s — SolarCalc",
  },
  description:
    "Бесплатный расчёт автономной солнечной электростанции: панели, аккумуляторы, инвертор и кабель по реальной инсоляции вашего города. Без регистрации и без продавца.",
  applicationName: "SolarCalc",
  authors: [{ name: "SolarCalc" }],
  creator: "SolarCalc",
  publisher: "SolarCalc",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "SolarCalc",
    url: SITE_URL,
    title: "SolarCalc — калькулятор солнечных панелей для дома",
    description:
      "Честный расчёт автономной солнечной системы по данным PVGIS. Панели, АКБ, инвертор, кабель.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SolarCalc — калькулятор солнечных панелей",
    description: "Расчёт автономной системы по реальной инсоляции вашего города.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  verification: {
    yandex:
      process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? "fc321c3e7e39884b",
  },
};

const NAV = [
  { href: "/kalkulyator-solnechnyh-panelej", label: "Расчёт системы" },
  { href: "/kalkulyatory", label: "Калькуляторы" },
  { href: "/solnechnaya-elektrostanciya", label: "Города" },
  { href: "/blog", label: "Статьи" },
  { href: "/metodika", label: "Методика" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="container-x flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900"
              aria-label="SolarCalc — на главную"
            >
              <BrandMark />
              <span className="text-lg">
                Solar<span className="text-emerald-600">Calc</span>
              </span>
            </Link>

            <nav
              aria-label="Основная навигация"
              className="hidden items-center gap-1 md:flex"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/kalkulyator-solnechnyh-panelej"
              className="btn btn-primary hidden sm:inline-flex"
            >
              Рассчитать
            </Link>
          </div>

          <nav
            aria-label="Навигация по разделам"
            className="container-x flex gap-1 overflow-x-auto pb-2 md:hidden"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <BrandMark size={24} />
                <span>
                  Solar<span className="text-emerald-600">Calc</span>
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Независимый калькулятор автономного электроснабжения для дома и
                дачи.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Калькуляторы</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <Link className="hover:text-emerald-700" href="/kalkulyator-solnechnyh-panelej">
                    Солнечные панели
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-emerald-700" href="/kalkulyator-emkosti-akb">
                    Ёмкость АКБ
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-emerald-700" href="/kalkulyator-invertora">
                    Мощность инвертора
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-emerald-700" href="/kalkulyator-secheniya-kabelya">
                    Сечение кабеля
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Проект</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <Link className="hover:text-emerald-700" href="/blog">
                    Статьи
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-emerald-700" href="/metodika">
                    Методика расчёта
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-emerald-700" href="/o-proekte">
                    О проекте
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-emerald-700" href="/privacy">
                    Конфиденциальность
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Данные</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Инсоляция — PVGIS v5.3 (JRC, SARAH3/ERA5).
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200">
            <div className="container-x flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} SolarCalc. Расчёты носят справочный характер.</p>
              <p>
                Партнёрские ссылки помечены. Расчёт бесплатный и не требует
                регистрации.
              </p>
            </div>
          </div>
        </footer>

        <MetrikaScript />
        <MetrikaHits />
      </body>
    </html>
  );
}
