"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalculatorStoreProvider, useCalc } from "./store";
import { StepCity } from "./StepCity";
import { StepLoads } from "./StepLoads";
import { StepSystem } from "./StepSystem";
import { StepResult } from "./StepResult";
import type { CityOption } from "./types";
import type { CalcState } from "@/lib/state/query";
import { parseCalcState, toSearchParams } from "@/lib/state/query";
import { reachGoal } from "@/lib/analytics";

const STEPS = [
  { n: 1, title: "Город", hint: "инсоляция" },
  { n: 2, title: "Приборы", hint: "потребление" },
  { n: 3, title: "Система", hint: "напряжение, АКБ" },
  { n: 4, title: "Результат", hint: "оборудование" },
];

export function CalculatorWizard({
  initial,
  cities,
}: {
  initial: CalcState;
  cities: CityOption[];
}) {
  return (
    <CalculatorStoreProvider initial={initial}>
      <WizardInner cities={cities} />
    </CalculatorStoreProvider>
  );
}

function WizardInner({ cities }: { cities: CityOption[] }) {
  const state = useCalc((store) => store);
  const query = toSearchParams(state);
  const fired = useRef(new Set<string>());
  const lastWritten = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  // Гидратация из URL до первой отрисовки: состояние из ссылки применяется
  // без видимого мигания, даже когда страница отдана статикой.
  useLayoutEffect(() => {
    lastWritten.current = window.location.search.replace(/^\?/, "");
    const search = window.location.search;
    if (search) {
      state.hydrate(parseCalcState(new URLSearchParams(search)));
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Состояние живёт в URL: расчётом можно поделиться, страница не теряет данные.
  useEffect(() => {
    if (!ready || query === lastWritten.current) return;
    lastWritten.current = query;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${query}`,
    );
  }, [query, ready]);

  // Воронка: старт визарда и дохождение до результата.
  useEffect(() => {
    if (state.step >= 2 && !fired.current.has("start")) {
      fired.current.add("start");
      reachGoal("wizard_start");
    }
    if (state.step === 4 && !fired.current.has("result")) {
      fired.current.add("result");
      reachGoal("wizard_result");
    }
  }, [state.step]);

  const canNext = state.step === 2 ? state.items.length > 0 : true;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start print:hidden">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
          {STEPS.map((step) => {
            const active = step.n === state.step;
            const done = step.n < state.step;
            return (
              <li key={step.n}>
                <button
                  type="button"
                  onClick={() => state.setStep(step.n)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-emerald-600 bg-emerald-50"
                      : done
                        ? "border-emerald-200 bg-white"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      active || done
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {done ? "✓" : step.n}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      {step.title}
                    </span>
                    <span className="block text-xs text-slate-500">{step.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="min-w-0">
        <div className="card">
          {state.step === 1 ? <StepCity cities={cities} /> : null}
          {state.step === 2 ? <StepLoads /> : null}
          {state.step === 3 ? <StepSystem /> : null}
          {state.step === 4 ? <StepResult cities={cities} /> : null}

          {state.step < 4 ? (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5 print:hidden">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => state.setStep(state.step - 1)}
                disabled={state.step === 1}
              >
                ← Назад
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => state.setStep(state.step + 1)}
                disabled={!canNext}
              >
                {state.step === 3 ? "Показать результат →" : "Далее →"}
              </button>
            </div>
          ) : (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5 print:hidden">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => state.setStep(1)}
              >
                ← Изменить параметры
              </button>
              <span className="text-xs text-slate-400">
                Ссылка в адресной строке сохраняет расчёт
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
