import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";

const PATH = "/privacy";

export const metadata: Metadata = buildMetadata({
  title: "Политика конфиденциальности",
  description:
    "Какие данные собирает SolarCalc и как они используются. Мы не требуем регистрацию и не продаём персональные данные.",
  path: PATH,
  noindex: false,
});

export default function Page() {
  return (
    <Container className="py-10">
      <nav aria-label="Хлебные крошки" className="mb-5 text-sm text-slate-500">
        <Link href="/" className="hover:text-emerald-700">
          Главная
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Конфиденциальность</span>
      </nav>

      <SectionHeading
        eyebrow="Документы"
        title="Политика конфиденциальности"
        description="Коротко: мы не просим регистрацию и не собираем персональные данные."
      />

      <div className="prose-basic mt-8 max-w-3xl">
        <h2>Какие данные мы обрабатываем</h2>
        <p>
          Калькулятор работает без регистрации. Введённые параметры (город,
          приборы, напряжение) сохраняются в адресной строке браузера — это нужно,
          чтобы расчётом можно было поделиться. На сервер эти данные не
          отправляются и не сохраняются.
        </p>

        <h2>Аналитика</h2>
        <p>
          Для понимания посещаемости может использоваться Яндекс Метрика. Она
          собирает обезличенную статистику: страницы, источники переходов, тип
          устройства. Мы не связываем эти данные с конкретным человеком.
        </p>

        <h2>Партнёрские ссылки</h2>
        <p>
          Переходы в магазины идут через редирект с UTM-метками. Магазин может
          установить собственные cookie — их обработка регулируется политикой
          магазина, а не нами.
        </p>

        <h2>Ваши права</h2>
        <p>
          Поскольку мы не собираем персональные данные, отзывать нечего. Если у
          вас есть вопросы — напишите на{" "}
          <a href="mailto:hello@solarcalc.ru">hello@solarcalc.ru</a>.
        </p>

        <h2>Изменения</h2>
        <p>
          Актуальная версия всегда на этой странице. Дата последнего обновления —
          ноябрь 2026 года.
        </p>
      </div>
    </Container>
  );
}
