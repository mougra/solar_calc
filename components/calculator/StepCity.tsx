"use client";

import { useCalc } from "./store";
import { MONTH_DAYS, type CityOption } from "./types";
import { monthFull } from "@/lib/format";
import { fmt1 } from "@/lib/format";
import { Badge } from "@/components/ui";

const POPULAR = ["moskva", "sankt-peterburg", "krasnodar", "ekaterinburg", "novosibirsk", "sochi"];

export function StepCity({ cities }: { cities: CityOption[] }) {
  const city = useCalc((state) => state.city);
  const month = useCalc((state) => state.month);
  const setCity = useCalc((state) => state.setCity);
  const setMonth = useCalc((state) => state.setMonth);

  const selected = cities.find((item) => item.slug === city) ?? cities[0];
  const psh = selected
    ? (selected.monthly[month] ?? 0) / (MONTH_DAYS[month] ?? 30)
    : 0;

  const groups = new Map<string, CityOption[]>();
  for (const item of cities) {
    const list = groups.get(item.district) ?? [];
    list.push(item);
    groups.set(item.district, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="city" className="label">
          Город или регион
        </label>
        <select
          id="city"
          className="input"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        >
          {[...groups.entries()].map(([district, items]) => (
            <optgroup key={district} label={district}>
              {items.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} — {item.region}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selected ? (
          <p className="mt-2 text-sm text-slate-500">
            Оптимальный угол наклона: <strong className="text-slate-700">{selected.tilt}°</strong>
            {" · "}
            Данные: {selected.source === "ERA5" ? "ERA5 (выше 65° с.ш.)" : "SARAH3"}
          </p>
        ) : null}
      </div>

      <div>
        <span className="label">Популярные города</span>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((slug) => {
            const item = cities.find((entry) => entry.slug === slug);
            if (!item) return null;
            const active = slug === city;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setCity(slug)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="label">Расчётный месяц</span>
        <p className="mb-3 text-sm text-slate-500">
          Система считается по худшему месяцу. По умолчанию — декабрь: если
          хватает зимой, летом хватит с запасом.
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => {
            const monthPsh = (selected?.monthly[index] ?? 0) / (MONTH_DAYS[index] ?? 30);
            const active = index === month;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setMonth(index)}
                className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                  active
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="block text-sm font-semibold capitalize">
                  {monthFull(index)}
                </span>
                <span className="block text-xs text-slate-500">
                  {fmt1(monthPsh)} кВт·ч/м²
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">Инсоляция</Badge>
          <p className="text-sm text-sky-900">
            {monthFull(month)}: <strong>{fmt1(psh)} кВт·ч/м² в сутки</strong> на
            наклонную плоскость.
          </p>
        </div>
        <p className="mt-2 text-xs leading-5 text-sky-800">
          Это среднемноголетнее значение PVGIS. В отдельные годы бывает на 20–30%
          меньше — поэтому в расчёте есть запас.
        </p>
      </div>
    </div>
  );
}
