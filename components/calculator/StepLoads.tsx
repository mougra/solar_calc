"use client";

import { useState } from "react";
import { useCalc } from "./store";
import { APPLIANCES, APPLIANCE_CATEGORIES } from "@/data/appliances";
import { dailyEnergy } from "@/lib/core/calc";
import { fmtEnergy, fmt1 } from "@/lib/format";

export function StepLoads() {
  const items = useCalc((state) => state.items);
  const togglePreset = useCalc((state) => state.togglePreset);
  const updateItem = useCalc((state) => state.updateItem);
  const removeItem = useCalc((state) => state.removeItem);
  const addCustom = useCalc((state) => state.addCustom);

  const [custom, setCustom] = useState({
    name: "",
    watt: 500,
    hours: 2,
    quantity: 1,
  });

  const selectedIds = new Set(items.map((item) => item.id));
  const energy = dailyEnergy({ items, inverterIdleW: 15 });

  return (
    <div className="space-y-7">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="label mb-0">Что будете питать</span>
          <p className="text-sm text-slate-500">
            Итого: <strong className="text-slate-800">{fmtEnergy(energy.totalWh)}/сут</strong>
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {APPLIANCES.map((preset) => {
            const active = selectedIds.has(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => togglePreset(preset)}
                aria-pressed={active}
                title={preset.hint}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-lg" aria-hidden="true">
                  {preset.icon}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-900">
                  {preset.name}
                </span>
                <span className="block text-xs text-slate-500">
                  {preset.watt} Вт · {fmt1(preset.hours)} ч
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Категории: {Object.values(APPLIANCE_CATEGORIES).map((c) => c.label).join(" · ")}.
          Часы — эффективные: холодильник работает не 24 часа, а ~8.
        </p>
      </div>

      {items.length > 0 ? (
        <div>
          <span className="label">Ваш список ({items.length})</span>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-2 items-end gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_88px_88px_72px_40px]"
              >
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-sm font-medium text-slate-900">
                    {item.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {fmt1(item.watt * item.hoursPerDay * item.quantity)} Вт·ч/сут
                  </span>
                </div>
                <label className="text-xs text-slate-500">
                  Мощность, Вт
                  <input
                    type="number"
                    min={1}
                    step={10}
                    className="input mt-1 px-2 py-1.5 text-sm"
                    value={item.watt}
                    onChange={(event) =>
                      updateItem(item.id, {
                        watt: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Часов в сутки
                  <input
                    type="number"
                    min={0.1}
                    max={24}
                    step={0.5}
                    className="input mt-1 px-2 py-1.5 text-sm"
                    value={item.hoursPerDay}
                    onChange={(event) =>
                      updateItem(item.id, {
                        hoursPerDay: Math.min(
                          24,
                          Math.max(0.1, Number(event.target.value) || 0.1),
                        ),
                      })
                    }
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Кол-во
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="input mt-1 px-2 py-1.5 text-sm"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.id, {
                        quantity: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="btn btn-ghost h-9 w-9 justify-self-end p-0 text-lg text-slate-400 hover:text-red-600"
                  aria-label={`Удалить ${item.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Выберите хотя бы один прибор — без нагрузки расчёт не имеет смысла.
        </p>
      )}

      <div>
        <span className="label">Своего прибора нет в списке?</span>
        <div className="grid gap-2 sm:grid-cols-[1fr_90px_90px_80px_auto]">
          <input
            className="input"
            placeholder="Название (например, сварка)"
            value={custom.name}
            onChange={(event) => setCustom({ ...custom, name: event.target.value })}
          />
          <input
            className="input"
            type="number"
            min={1}
            placeholder="Вт"
            value={custom.watt}
            onChange={(event) =>
              setCustom({ ...custom, watt: Number(event.target.value) || 1 })
            }
          />
          <input
            className="input"
            type="number"
            min={0.1}
            step={0.5}
            placeholder="ч/сут"
            value={custom.hours}
            onChange={(event) =>
              setCustom({ ...custom, hours: Number(event.target.value) || 0.1 })
            }
          />
          <input
            className="input"
            type="number"
            min={1}
            placeholder="шт"
            value={custom.quantity}
            onChange={(event) =>
              setCustom({ ...custom, quantity: Number(event.target.value) || 1 })
            }
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              addCustom(custom.name, custom.watt, custom.hours, custom.quantity);
              setCustom({ name: "", watt: 500, hours: 2, quantity: 1 });
            }}
          >
            Добавить
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p>
          В расчёт автоматически добавлен холостой ход инвертора —{" "}
          <strong>15 Вт × 24 ч = 360 Вт·ч/сут</strong>. На малых системах это до
          20% потребления, и об этом обычно забывают.
        </p>
      </div>
    </div>
  );
}
