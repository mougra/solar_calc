"use client";

import { useCalc } from "./store";
import { CHEMISTRY, batterySizing, dailyEnergy } from "@/lib/core/calc";
import type { Chemistry, SystemVoltage } from "@/lib/core/types";
import { fmtAh, fmtEnergy } from "@/lib/format";

const VOLTAGES: { value: SystemVoltage; label: string; hint: string }[] = [
  { value: 12, label: "12 В", hint: "до 1 кВт, автодом, дача" },
  { value: 24, label: "24 В", hint: "1–3 кВт, дом" },
  { value: 48, label: "48 В", hint: "3+ кВт, коттедж" },
];

const CHEMISTRIES: { value: Chemistry; title: string; text: string }[] = [
  {
    value: "lifepo4",
    title: "LiFePO4",
    text: "DoD 80%, 4000 циклов. Нельзя заряжать ниже 0 °C.",
  },
  {
    value: "agm",
    title: "AGM / гель",
    text: "DoD 50%, ~500 циклов. Терпит холод, но тяжелее и дешевле.",
  },
];

export function StepSystem() {
  const items = useCalc((state) => state.items);
  const voltage = useCalc((state) => state.voltage);
  const chemistry = useCalc((state) => state.chemistry);
  const autonomyDays = useCalc((state) => state.autonomyDays);
  const setVoltage = useCalc((state) => state.setVoltage);
  const setChemistry = useCalc((state) => state.setChemistry);
  const setAutonomyDays = useCalc((state) => state.setAutonomyDays);

  const energy = dailyEnergy({ items, inverterIdleW: 15 });
  const battery = batterySizing({
    dailyWh: Math.max(energy.totalWh, 1),
    autonomyDays,
    voltage,
    chemistry,
  });

  return (
    <div className="space-y-7">
      <div>
        <span className="label">Напряжение системы</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {VOLTAGES.map((option) => {
            const active = option.value === voltage;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setVoltage(option.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="block text-lg font-bold text-slate-900">
                  {option.label}
                </span>
                <span className="block text-xs text-slate-500">{option.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Чем выше напряжение, тем меньше токи и тоньше кабель. Для дома от 2 кВт
          почти всегда 24 или 48 В.
        </p>
      </div>

      <div>
        <span className="label">Тип аккумулятора</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHEMISTRIES.map((option) => {
            const active = option.value === chemistry;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setChemistry(option.value)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="block font-bold text-slate-900">{option.title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
        {chemistry === "lifepo4" ? (
          <p className="mt-2 text-xs leading-5 text-amber-700">
            Если АКБ стоит в неотапливаемом помещении, зимой заряд запрещён —
            нужен подогрев или утеплённый бокс.
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="label mb-0">Дни автономии</span>
          <strong className="text-emerald-700">{autonomyDays} сут</strong>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={autonomyDays}
          onChange={(event) => setAutonomyDays(Number(event.target.value))}
          className="mt-3 w-full accent-emerald-600"
          aria-label="Дни автономии"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>1 — экономно</span>
          <span>3 — типично</span>
          <span>5 — с запасом</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Сколько дней система должна прожить без солнца. Больше дней — больше
          и дороже батарея.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm text-emerald-900">
          Потребление: <strong>{fmtEnergy(energy.totalWh)}/сут</strong> · Ёмкость
          под ваши параметры:{" "}
          <strong>{fmtAh(battery.recommendedAh)}</strong> при {voltage} В и DoD{" "}
          {Math.round(CHEMISTRY[chemistry].dod * 100)}%.
        </p>
      </div>
    </div>
  );
}
