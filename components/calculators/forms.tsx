"use client";

import { useState } from "react";
import {
  CABLE_SECTIONS_MM2,
  CHEMISTRY,
  batterySizing,
  cableSizing,
  inverterSizing,
  mpptCurrent,
  recommendedMpptA,
} from "@/lib/core/calc";
import type { CableMaterial, Chemistry, SystemVoltage } from "@/lib/core/types";
import { fmt1, fmtAh, fmtEnergy, fmtPower } from "@/lib/format";
import { AffiliateBlock } from "@/components/AffiliateBlock";
import { Note, Stat } from "@/components/ui";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// АКБ
// ---------------------------------------------------------------------------

export function BatteryCalculator() {
  const [dailyKwh, setDailyKwh] = useState(3);
  const [days, setDays] = useState(2);
  const [voltage, setVoltage] = useState<SystemVoltage>(24);
  const [chemistry, setChemistry] = useState<Chemistry>("lifepo4");

  const result = batterySizing({
    dailyWh: Math.max(1, dailyKwh * 1000),
    autonomyDays: days,
    voltage,
    chemistry,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <Row
          label="Суточное потребление, кВт·ч"
          hint="Средний расход за сутки. Можно взять из главного калькулятора."
        >
          <input
            type="number"
            min={0.1}
            step={0.1}
            className="input"
            value={dailyKwh}
            onChange={(event) => setDailyKwh(Number(event.target.value) || 0.1)}
          />
        </Row>

        <Row label={`Дни автономии: ${days}`}>
          <input
            type="range"
            min={1}
            max={5}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="w-full accent-emerald-600"
          />
        </Row>

        <Row label="Напряжение системы">
          <select
            className="input"
            value={voltage}
            onChange={(event) => setVoltage(Number(event.target.value) as SystemVoltage)}
          >
            <option value={12}>12 В</option>
            <option value={24}>24 В</option>
            <option value={48}>48 В</option>
          </select>
        </Row>

        <Row label="Тип аккумулятора">
          <select
            className="input"
            value={chemistry}
            onChange={(event) => setChemistry(event.target.value as Chemistry)}
          >
            <option value="lifepo4">LiFePO4 — DoD 80%</option>
            <option value="agm">AGM / гель — DoD 50%</option>
          </select>
        </Row>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Ёмкость"
            value={fmtAh(result.recommendedAh)}
            unit={`${voltage} В`}
            hint={`${fmtEnergy(result.recommendedAh * voltage)} номинала`}
          />
          <Stat
            label="Полезная энергия"
            value={fmt1(result.usableWh / 1000)}
            unit="кВт·ч"
            hint={`DoD ${Math.round(result.dod * 100)}%`}
            tone="blue"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p>
            С учётом КПД, температуры и старения нужно запасти{" "}
            <strong>{fmtEnergy(result.requiredWh)}</strong> — это на{" "}
            {fmt1((result.requiredWh / (dailyKwh * 1000 * days) - 1) * 100)}%
            больше «идеальных» {fmt1(dailyKwh * days)} кВт·ч.
          </p>
        </div>

        {result.warnings.map((warning) => (
          <Note key={warning} tone="amber">
            {warning}
          </Note>
        ))}

        <AffiliateBlock category="battery" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Инвертор
// ---------------------------------------------------------------------------

const INVERTER_PRESETS = [
  { label: "Холодильник + свет + ТВ", continuous: 600, surge: 1500 },
  { label: "Дом с насосом", continuous: 2000, surge: 6000 },
  { label: "Дача с инструментом", continuous: 3000, surge: 6000 },
  { label: "Коттедж с кондиционером", continuous: 5000, surge: 10000 },
];

export function InverterCalculator() {
  const [continuous, setContinuous] = useState(2000);
  const [surge, setSurge] = useState(6000);

  const result = inverterSizing({ continuousW: Math.max(1, continuous), surgeW: surge });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <Row
          label="Длительная мощность нагрузки, Вт"
          hint="Сумма всех приборов, включённых одновременно."
        >
          <input
            type="number"
            min={1}
            step={100}
            className="input"
            value={continuous}
            onChange={(event) => setContinuous(Number(event.target.value) || 1)}
          />
        </Row>

        <Row
          label="Пусковая мощность, Вт"
          hint="Для насоса — 3–5× от рабочей. Если пусков нет — оставьте 0."
        >
          <input
            type="number"
            min={0}
            step={100}
            className="input"
            value={surge}
            onChange={(event) => setSurge(Number(event.target.value) || 0)}
          />
        </Row>

        <div>
          <span className="label">Типовые сценарии</span>
          <div className="flex flex-wrap gap-2">
            {INVERTER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300"
                onClick={() => {
                  setContinuous(preset.continuous);
                  setSurge(preset.surge);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Инвертор"
            value={fmt1(result.recommendedW / 1000)}
            unit="кВт"
            hint="Ближайший стандартный номинал"
            tone="amber"
          />
          <Stat
            label="Требуется по расчёту"
            value={fmtPower(result.requiredW)}
            hint="С запасом 25%"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <p>
            Пиковая нагрузка {fmtPower(Math.max(continuous, surge))}. Инвертор
            должен кратковременно держать{" "}
            <strong>{fmtPower(result.recommendedW)}</strong> и переживать пуск без
            ухода в защиту.
          </p>
        </div>

        <Note tone="blue">
          Для насосов и компрессоров смотрите не только номинал, но и
          перегрузочную способность: дешёвые инверторы заявляют «2 кВт», но
          держат пуск 3 секунды вместо 30.
        </Note>

        <AffiliateBlock category="inverter" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MPPT
// ---------------------------------------------------------------------------

export function MpptCalculator() {
  const [pvW, setPvW] = useState(2000);
  const [batteryV, setBatteryV] = useState<SystemVoltage>(24);

  const current = mpptCurrent({ pvW: Math.max(1, pvW), batteryV });
  const recommended = recommendedMpptA({ pvW: Math.max(1, pvW), batteryV });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <Row
          label="Мощность солнечного массива, Вт"
          hint="Суммарная паспортная мощность панелей."
        >
          <input
            type="number"
            min={1}
            step={100}
            className="input"
            value={pvW}
            onChange={(event) => setPvW(Number(event.target.value) || 1)}
          />
        </Row>

        <Row label="Напряжение аккумуляторной батареи">
          <select
            className="input"
            value={batteryV}
            onChange={(event) =>
              setBatteryV(Number(event.target.value) as SystemVoltage)
            }
          >
            <option value={12}>12 В</option>
            <option value={24}>24 В</option>
            <option value={48}>48 В</option>
          </select>
        </Row>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Ток контроллера"
            value={fmt1(current)}
            unit="А"
            hint="P / U × 1,25"
          />
          <Stat
            label="Рекомендуемый номинал"
            value={`${recommended}`}
            unit="А"
            hint="Стандартный ряд"
            tone="blue"
          />
        </div>

        <Note tone="amber">
          Ток — не единственный параметр. Проверьте напряжение холостого хода
          массива (Voc) при −30 °C: оно на 10–12% выше паспортного и не должно
          превышать максимум контроллера.
        </Note>

        {current > 150 ? (
          <Note tone="amber">
            Расчётный ток {fmt1(current)} А превышает типовые 150 А. Понадобится
            два контроллера или переход на 48 В — на 24 В такой массив одним
            контроллером не обслужить.
          </Note>
        ) : null}

        <AffiliateBlock category="mppt" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Кабель
// ---------------------------------------------------------------------------

export function CableCalculator() {
  const [current, setCurrent] = useState(30);
  const [length, setLength] = useState(10);
  const [voltage, setVoltage] = useState(12);
  const [drop, setDrop] = useState(3);
  const [material, setMaterial] = useState<CableMaterial>("copper");
  const [phases, setPhases] = useState<1 | 3>(1);

  const result = cableSizing({
    currentA: Math.max(0.1, current),
    lengthM: Math.max(0.1, length),
    voltageV: Math.max(1, voltage),
    maxDropPercent: Math.max(0.1, drop),
    material,
    phases,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Ток, А">
            <input
              type="number"
              min={0.1}
              step={0.5}
              className="input"
              value={current}
              onChange={(event) => setCurrent(Number(event.target.value) || 0.1)}
            />
          </Row>
          <Row label="Длина трассы, м" hint="В одну сторону.">
            <input
              type="number"
              min={0.1}
              step={1}
              className="input"
              value={length}
              onChange={(event) => setLength(Number(event.target.value) || 0.1)}
            />
          </Row>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Напряжение, В">
            <input
              type="number"
              min={1}
              step={1}
              className="input"
              value={voltage}
              onChange={(event) => setVoltage(Number(event.target.value) || 1)}
            />
          </Row>
          <Row label="Допустимое падение, %" hint="DC — до 3%, AC — до 5%.">
            <input
              type="number"
              min={0.1}
              max={10}
              step={0.5}
              className="input"
              value={drop}
              onChange={(event) => setDrop(Number(event.target.value) || 0.1)}
            />
          </Row>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Материал">
            <select
              className="input"
              value={material}
              onChange={(event) => setMaterial(event.target.value as CableMaterial)}
            >
              <option value="copper">Медь</option>
              <option value="aluminum">Алюминий</option>
            </select>
          </Row>
          <Row label="Линия">
            <select
              className="input"
              value={phases}
              onChange={(event) => setPhases(Number(event.target.value) as 1 | 3)}
            >
              <option value={1}>Однофазная / DC</option>
              <option value={3}>Трёхфазная 380 В</option>
            </select>
          </Row>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Сечение"
            value={`${result.sectionMm2}`}
            unit="мм²"
            hint={`Расчётное: ${fmt1(result.requiredSectionMm2)} мм²`}
          />
          <Stat
            label="Фактическое падение"
            value={fmt1(result.actualDropPercent)}
            unit="%"
            hint={`при ${result.sectionMm2} мм²`}
            tone="blue"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <p>
            Формула: S = ρ × L × I / ΔU. Для однофазной линии длина удваивается
            (туда и обратно), для трёхфазной — умножается на √3.
          </p>
        </div>

        {result.warnings.map((warning) => (
          <Note key={warning} tone="amber">
            {warning}
          </Note>
        ))}

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Стандартный ряд
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {CABLE_SECTIONS_MM2.join(" · ")} мм². Не забывайте про автоматы и
            предохранители — кабель защищает автомат, а не наоборот.
          </p>
        </div>
      </div>
    </div>
  );
}
