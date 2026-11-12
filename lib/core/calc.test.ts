import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  batterySizing,
  cableSizing,
  computeAutonomy,
  dailyEnergy,
  estimateBudget,
  inverterSizing,
  mpptCurrent,
  pickStandard,
  requiredPvW,
  systemEfficiency,
} from "./calc.ts";
import type { LoadItem } from "./types.ts";

const MOSCOW_PSH = [
  0.89, 1.81, 3.25, 4.59, 5.04, 6.02, 5.22, 4.8, 3.17, 2.17, 0.8, 0.77,
];

const items: LoadItem[] = [
  { id: "fridge", name: "Холодильник", watt: 120, hoursPerDay: 8, quantity: 1 },
  { id: "pump", name: "Насос", watt: 800, hoursPerDay: 1, quantity: 1, surgeFactor: 4 },
  { id: "light", name: "Свет", watt: 60, hoursPerDay: 5, quantity: 1 },
];

/** Сравнение с плавающей точкой. */
function close(actual: number, expected: number, eps = 0.01): void {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `ожидалось ${expected} ± ${eps}, получено ${actual}`,
  );
}

describe("суточное потребление", () => {
  it("суммирует приборы и холостой ход инвертора", () => {
    const r = dailyEnergy({ items, inverterIdleW: 20, reserveFactor: 1 });
    close(r.loadWh, 2060, 1e-6);
    close(r.idleWh, 480, 1e-6);
    close(r.totalWh, 2540, 1e-6);
  });

  it("применяет коэффициент запаса", () => {
    const r = dailyEnergy({ items, inverterIdleW: 0, reserveFactor: 1.2 });
    close(r.totalWh, 2472, 1e-6);
  });

  it("игнорирует отрицательные значения", () => {
    const r = dailyEnergy({
      items: [{ id: "x", name: "x", watt: -100, hoursPerDay: 5, quantity: 1 }],
    });
    assert.equal(r.loadWh, 0);
  });
});

describe("аккумулятор", () => {
  it("считает LiFePO4 с потерями и округлением", () => {
    const r = batterySizing({
      dailyWh: 3000,
      autonomyDays: 2,
      voltage: 24,
      chemistry: "lifepo4",
      ambientC: 15,
    });
    close(r.requiredWh, 8398.45, 1);
    close(r.capacityAh, 437.42, 1);
    assert.equal(r.recommendedAh, 440);
    assert.equal(r.warnings.length, 0);
  });

  it("предупреждает о заряде LiFePO4 при отрицательных температурах", () => {
    const r = batterySizing({
      dailyWh: 3000,
      autonomyDays: 2,
      voltage: 24,
      chemistry: "lifepo4",
      ambientC: -15,
    });
    assert.match(r.warnings.join(" "), /нельзя заряжать/i);
  });

  it("AGM требует заметно большую ёмкость при той же энергии", () => {
    const li = batterySizing({
      dailyWh: 3000,
      autonomyDays: 2,
      voltage: 24,
      chemistry: "lifepo4",
      ambientC: 15,
    });
    const agm = batterySizing({
      dailyWh: 3000,
      autonomyDays: 2,
      voltage: 24,
      chemistry: "agm",
      ambientC: 15,
    });
    assert.ok(agm.capacityAh > li.capacityAh * 1.8);
  });
});

describe("солнечные панели", () => {
  it("P = E / (PSH × η)", () => {
    close(requiredPvW({ dailyWh: 3000, psh: 1, efficiency: 0.75 }), 4000, 1e-6);
  });

  it("тракт потерь даёт ~0.65 для автономки на LiFePO4", () => {
    close(systemEfficiency({ batteryRoundTrip: 0.81 }), 0.65196, 1e-4);
  });

  it("бросает ошибку при нулевой инсоляции", () => {
    assert.throws(() =>
      requiredPvW({ dailyWh: 1000, psh: 0, efficiency: 0.7 }),
    );
  });

  it("зимняя и летняя потребность отличаются в разы", () => {
    const r = computeAutonomy({
      items,
      pshMonthly: MOSCOW_PSH,
      optimalTilt: 40,
      voltage: 24,
      chemistry: "lifepo4",
      autonomyDays: 2,
      designMonth: 11,
    });
    assert.ok(r.pvW > 5000, `pvW=${r.pvW}`);
    assert.ok(r.pvWBest < 800, `pvWBest=${r.pvWBest}`);
    assert.ok(r.seasonalRatio > 6, `ratio=${r.seasonalRatio}`);
  });
});

describe("инвертор и MPPT", () => {
  it("добавляет запас 25% и округляет до номинала", () => {
    const r = inverterSizing({ continuousW: 2000 });
    close(r.requiredW, 2500, 1e-6);
    assert.equal(r.recommendedW, 3000);
  });

  it("учитывает пусковой ток насоса", () => {
    const r = inverterSizing({ continuousW: 2000, surgeW: 6000 });
    assert.equal(r.recommendedW, 6000);
  });

  it("ток MPPT = P / U × 1.25", () => {
    close(mpptCurrent({ pvW: 2000, batteryV: 24 }), 104.17, 0.1);
  });
});

describe("кабель", () => {
  it("S = ρ×L×I/ΔU с округлением вверх", () => {
    const r = cableSizing({
      currentA: 30,
      lengthM: 10,
      voltageV: 12,
      maxDropPercent: 3,
    });
    close(r.requiredSectionMm2, 29.17, 0.1);
    assert.equal(r.sectionMm2, 35);
    close(r.actualDropPercent, 2.5, 0.1);
  });

  it("для 220 В хватает тонкого кабеля", () => {
    const r = cableSizing({
      currentA: 10,
      lengthM: 20,
      voltageV: 220,
      maxDropPercent: 5,
    });
    assert.ok(r.sectionMm2 <= 2.5);
  });
});

describe("pickStandard", () => {
  it("возвращает первый номинал не меньше требуемого", () => {
    assert.equal(pickStandard(0.6, [0.5, 1, 1.5]), 1);
    assert.equal(pickStandard(1.5, [0.5, 1, 1.5]), 1.5);
  });
});

describe("бюджет", () => {
  const prices = {
    panelPerW: { min: 20, max: 30 },
    batteryPerKwh: { min: 6000, max: 10000 },
    inverterPerKw: { min: 10000, max: 20000 },
    mpptPerA: { min: 100, max: 200 },
  };

  it("суммирует диапазоны по удельным ценам", () => {
    const r = estimateBudget(
      { pvW: 1000, batteryNominalWh: 5000, inverterW: 3000, mpptA: 60 },
      prices,
    );
    close(r.total.min, 86_000, 1e-6);
    close(r.total.max, 152_000, 1e-6);
    assert.equal(r.lines.length, 4);
  });

  it("не уходит в минус при нулевых параметрах", () => {
    const r = estimateBudget(
      { pvW: 0, batteryNominalWh: 0, inverterW: 0, mpptA: 0 },
      prices,
    );
    assert.equal(r.total.min, 0);
    assert.equal(r.total.max, 0);
  });
});
