import Link from "next/link";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-semibold tracking-wide text-emerald-700 uppercase">
        404
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
        Страница не найдена
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
        Возможно, город ещё не добавлен или ссылка устарела. Начните с главного
        калькулятора — он точно работает.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/kalkulyator-solnechnyh-panelej" className="btn btn-primary">
          Калькулятор системы
        </Link>
        <Link href="/solnechnaya-elektrostanciya" className="btn btn-outline">
          Все города
        </Link>
      </div>
    </Container>
  );
}
