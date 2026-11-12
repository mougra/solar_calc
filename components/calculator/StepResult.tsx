"use client";

import { useState } from "react";
import { useCalc } from "./store";
import { MONTH_DAYS, type CityOption } from "./types";
import {
  CHEMISTRY,
  batterySizing,
  dailyEnergy,
  estimateBudget,
  inverterSizing,
  mpptCurrent,
  peakLoadWReal,
  pvMonthlyYieldKwh,
  requiredPvW,
  systemEfficiency,
} from "@/lib/core/calc";
import { fmt1, fmtAh, fmtEnergy, fmtMoney, fmtPercent, fmtPower, monthFull } from "@/lib/format";
import { PRICE_TABLE, PRICES_UPDATED } from "@/data/prices";
import { AffiliateBlock } from "@/components/AffiliateBlock";
import { MonthlyChart } from "@/components/MonthlyChart";
import { Badge, Note, Stat } from "@/components/ui";
import Link from "next/link";

export function StepResult({ cities }: { cities: CityOption[] }) {
  const state = useCalc((store) => store);
  const { items, city, month, voltage, chemistry, autonomyDays } = state;
  const [copied, setCopied] = useState(false);

  const selected = cities.find((entry) => entry.slug === city);
  const monthlyPsh = (selected?.monthly ?? []).map(
    (kwh, index) => kwh / (MONTH_DAYS[index] ?? 30),
  );

  if (items.length === 0 || monthlyPsh.length !== 12) {
    return (
      <Note tone="amber">
        Недостаточно данных для расчёта: выберите приборы и город.
      </Note>
    );
  }

  // Полярная ночь: в декабре PSH может быть 0 — берём худший месяц с солнцем.
  const positive = monthlyPsh
    .map((psh, index) => ({ psh, index }))
    .filter((entry) => entry.psh > 0.02);
  const polarNight = (monthlyPsh[month] ?? 0) <= 0.02;
  const designMonth = polarNight
    ? (positive.reduce((min, entry) => (entry.psh < min.psh ? entry : min), positive[0]!)
        ?.index ?? month)
    : month;

  const pshDesign = monthlyPsh[designMonth] ?? 0;
  const pshBest = Math.max(...monthlyPsh);

  const energy = dailyEnergy({ items, inverterIdleW: 15 });
  const battery = batterySizing({
    dailyWh: energy.totalWh,
    autonomyDays,
    voltage,
    chemistry,
  });
  const roundTrip = CHEMISTRY[chemistry].roundTrip;
  const eff = systemEfficiency({ batteryRoundTrip: roundTrip });

  const pvW = requiredPvW({
    dailyWh: energy.totalWh,
    psh: pshDesign,
    efficiency: eff,
  });
  const pvWBest = requiredPvW({
    dailyWh: energy.totalWh,
    psh: pshBest,
    efficiency: eff,
  });

  const peak = peakLoadWReal(items);
  const inverter = inverterSizing({
    continuousW: peak.sum,
    surgeW: peak.maxSurge,
  });
  const mpptRaw = mpptCurrent({ pvW, batteryV: voltage });
  const mpptA = Math.ceil(mpptRaw);
  const mpptCount = Math.ceil(mpptRaw / 150);
  const pvWRounded = Math.round(pvW / 10) * 10;

  const budget = estimateBudget(
    {
      pvW,
      batteryNominalWh: battery.recommendedAh * voltage,
      inverterW: inverter.recommendedW,
      mpptA,
    },
    PRICE_TABLE,
  );
  const money = (value: number) => fmtMoney(Math.round(value / 1000) * 1000);

  const yields = pvMonthlyYieldKwh({ pvW, pshMonthly: monthlyPsh, efficiency: eff });
  const consumptionMonthly = MONTH_DAYS.map(
    (days) => (energy.totalWh * days) / 1000,
  );
  const annualYield = yields.reduce((sum, value) => sum + value, 0);

  const warnings = [...battery.warnings];
  if (mpptRaw > 150) {
    warnings.push(
      `Расчётный ток MPPT — ${Math.ceil(mpptRaw)} А. Один контроллер столько не держит: нужно ${mpptCount} × 150 А или переход на 48 В.`,
    );
  }
  if (polarNight) {
    warnings.unshift(
      `${monthFull(month)} в этом городе — полярная ночь, солнца нет. Расчёт сделан по худшему месяцу с инсоляцией (${monthFull(designMonth)}).`,
    );
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="green">Расчёт готов</Badge>
          <span className="text-sm text-slate-500">
            {selected?.name ?? city} · {monthFull(designMonth)} · {voltage} В ·{" "}
            {CHEMISTRY[chemistry].label}
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Ваша система: {fmtPower(pvWRounded)} панелей и{" "}
          {fmtAh(battery.recommendedAh)} АКБ
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Солнечные панели"
          value={fmt1(Math.round(pvW / 10) / 100)}
          unit="кВт"
          hint={`Под расчётный месяц (${monthFull(designMonth)})`}
        />
        <Stat
          label="Аккумуляторы"
          value={fmtAh(battery.recommendedAh)}
          unit={`${voltage} В`}
          hint={`${autonomyDays} сут автономии, DoD ${Math.round(battery.dod * 100)}%`}
          tone="blue"
        />
        <Stat
          label="Инвертор"
          value={fmt1(inverter.recommendedW / 1000)}
          unit="кВт"
          hint={`Пик ${fmtPower(peak.sum)}, пуск ${fmtPower(peak.maxSurge)}`}
          tone="amber"
        />
        <Stat
          label="MPPT-контроллер"
          value={mpptCount > 1 ? `≥${mpptA}` : `${mpptA}`}
          unit="А"
          hint={`При ${voltage} В, с запасом 25%`}
        />
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-sky-900">
          Главное, что нужно понять до покупки
        </p>
        <p className="mt-1.5 text-sm leading-6 text-sky-900">
          Для {monthFull(designMonth).toLowerCase()} нужно{" "}
          <strong>{fmt1(Math.round(pvW / 10) / 100)} кВт</strong> панелей, а для
          лучшего месяца ({monthFull(monthlyPsh.indexOf(pshBest))}) хватило бы{" "}
          <strong>{fmt1(Math.round(pvWBest / 10) / 100)} кВт</strong> — разница в{" "}
          <strong>{fmt1(pvW / pvWBest)}×</strong>. Если зимняя автономия не
          обязательна, дешевле собрать летний массив и оставить генератор.
        </p>
      </div>

      {warnings.length > 0 ? (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <Note key={warning} tone="amber">
              {warning}
            </Note>
          ))}
        </div>
      ) : null}

      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Выработка по месяцам при {fmt1(Math.round(pvW / 10) / 100)} кВт
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Столбцы — выработка, пунктир — потребление. Видно, почему зимой нужен
          генератор или запас.
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <MonthlyChart
            yieldKwh={yields}
            consumptionKwh={consumptionMonthly}
            caption={`Годовой прогноз: ${fmtEnergy(annualYield * 1000)}. Удельная выработка: ${fmt1(
              (annualYield * 1000) / Math.max(pvW, 1),
            )} кВт·ч на 1 кВт панелей.`}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900">Из чего сложился расчёт</h3>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Потребление приборов", fmtEnergy(energy.loadWh)],
              ["Холостой ход инвертора", fmtEnergy(energy.idleWh)],
              ["Итого с запасом 10%", fmtEnergy(energy.totalWh)],
              ["Энергия в АКБ с потерями", fmtEnergy(battery.requiredWh)],
              ["КПД тракта панель→нагрузка", fmtPercent(eff)],
              ["Требуемая мощность под зиму", fmtPower(pvWRounded)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            КПД включает потери MPPT, грязь, нагрев, мисматч, кабель и цикл
            батареи. Реальная выработка может отличаться на ±15%.
          </p>
        </div>

        <div className="space-y-3">
          <AffiliateBlock
            category="panels"
            title="Панели под ваш расчёт"
            note={`Ищите массив на ${fmt1(Math.round(pvW / 10) / 10)} кВт — например, ${Math.ceil(
              pvW / 550,
            )} панелей по 550 Вт.`}
          />
          <AffiliateBlock
            category="battery"
            title="Аккумуляторы"
            note={`Нужно ${fmtAh(battery.recommendedAh)} при ${voltage} В — это около ${fmtEnergy(
              battery.recommendedAh * voltage,
            )} номинальной ёмкости.`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-bold text-slate-900">
            Ориентировочный бюджет комплекта
          </h3>
          <span className="text-xs text-slate-400">
            оценка, {PRICES_UPDATED}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-slate-600">
          <strong className="text-slate-900">
            {money(budget.total.min)} — {money(budget.total.max)}
          </strong>{" "}
          за панели, аккумуляторы, инвертор и контроллер. Кабель, крепёж,
          автоматика и монтаж не входят.
        </p>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {budget.lines.map((line) => (
            <div
              key={line.label}
              className="flex items-baseline justify-between gap-3"
            >
              <dt className="text-slate-500">{line.label}</dt>
              <dd className="font-semibold text-slate-900">
                {money(line.min)} — {money(line.max)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Диапазон по розничным ценам РФ, не оферта: цена зависит от бренда,
          партии и региона. Разбор по компонентам — в{" "}
          <Link
            href="/blog/skolko-stoit-avtonomnaya-sistema"
            className="text-emerald-700 underline decoration-emerald-300 underline-offset-2"
          >
            статье о стоимости системы
          </Link>
          .
        </p>
      </div>

      <div className="print:hidden">
        <h3 className="text-lg font-bold text-slate-900">
          Остальное оборудование под ваш расчёт
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <AffiliateBlock
            category="inverter"
            title="Инвертор"
            note={`Номинал от ${fmt1(inverter.recommendedW / 1000)} кВт с перегрузкой под пуск ${fmtPower(peak.maxSurge)}.`}
          />
          <AffiliateBlock
            category="mppt"
            title="MPPT-контроллер"
            note={`Ток ${mpptA} А при ${voltage} В${mpptCount > 1 ? `, потребуется ${mpptCount} шт.` : ""}.`}
          />
          <AffiliateBlock
            category="cable"
            title="Кабель и автоматика"
            note="Сечение считайте по току и длине трассы в отдельном калькуляторе."
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button type="button" onClick={copyLink} className="btn btn-outline">
          {copied ? "Ссылка скопирована" : "Поделиться расчётом"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-outline"
        >
          Скачать смету
        </button>
        <Link href="/kalkulyator-secheniya-kabelya" className="btn btn-ghost">
          Подобрать сечение кабеля →
        </Link>
        <Link href="/metodika" className="btn btn-ghost">
          Как мы считаем
        </Link>
      </div>

      <Note tone="slate">
        Расчёт справочный: не учитывает затенение, реальный профиль облачности
        конкретного года и КПД выбранного оборудования. Перед покупкой проверьте
        совместимость напряжений панелей, контроллера и инвертора.
      </Note>
    </div>
  );
}
