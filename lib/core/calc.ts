/**
 * Физика расчёта автономной солнечной системы.
 *
 * Все функции чистые, не зависят от React и от данных о городах.
 * Энергия — Вт·ч (Wh), мощность — Вт (W), ёмкость — А·ч (Ah).
 */

import type {
  CableMaterial,
  Chemistry,
  LoadItem,
  SystemVoltage,
} from "./types";

// ---------------------------------------------------------------------------
// Константы
// ---------------------------------------------------------------------------

export const CHEMISTRY: Record<
  Chemistry,
  {
    label: string;
    /** Допустимая глубина разряда, доля */
    dod: number;
    /** КПД полного цикла заряд→разряд */
    roundTrip: number;
    /** Потеря ёмкости при отрицательных температурах */
    tempDerate: number;
    /** Потеря ёмкости к концу срока службы */
    agingDerate: number;
    /** Минимальная температура заряда, °C */
    minChargeTempC: number;
    /** Ресурс циклов при рекомендуемой DoD */
    cycles: number;
  }
> = {
  lifepo4: {
    label: "LiFePO4",
    dod: 0.8,
    roundTrip: 0.81,
    tempDerate: 0.9,
    agingDerate: 0.9,
    minChargeTempC: 0,
    cycles: 4000,
  },
  agm: {
    label: "AGM / гель",
    dod: 0.5,
    roundTrip: 0.66,
    tempDerate: 0.85,
    agingDerate: 0.8,
    minChargeTempC: -5,
    cycles: 500,
  },
};

/** Потери тракта «панель → нагрузка», кроме батареи. */
export const DEFAULT_EFFICIENCY = {
  mppt: 0.96,
  soiling: 0.97,
  mismatch: 0.98,
  dcCable: 0.98,
  temperature: 0.9,
} as const;

export const INVERTER_SIZES_W = [
  300, 500, 800, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000,
] as const;

export const MPPT_SIZES_A = [10, 15, 20, 30, 40, 50, 60, 80, 100, 120, 150] as const;

/** Стандартный ряд сечений кабеля, мм² */
export const CABLE_SECTIONS_MM2 = [
  0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240,
] as const;

/** Ориентировочная длительно допустимая токовая нагрузка, А (медь, 2–3 жилы) */
const AMPACITY_COPPER: Record<number, number> = {
  0.5: 6,
  0.75: 10,
  1: 12,
  1.5: 15,
  2.5: 21,
  4: 27,
  6: 34,
  10: 46,
  16: 62,
  25: 80,
  35: 99,
  50: 118,
  70: 149,
  95: 179,
  120: 206,
  150: 236,
  185: 268,
  240: 315,
};

const RESISTIVITY: Record<CableMaterial, number> = {
  copper: 0.0175, // Ом·мм²/м
  aluminum: 0.028,
};

// ---------------------------------------------------------------------------
// Вспомогательное
// ---------------------------------------------------------------------------

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} должно быть положительным числом, получено: ${value}`);
  }
}

/** Ближайший стандартный номинал, не меньше требуемого. */
export function pickStandard(
  required: number,
  sizes: readonly number[],
): number {
  for (const size of sizes) {
    if (size >= required - 1e-9) return size;
  }
  return sizes[sizes.length - 1] as number;
}

/** Число дней в месяце (индекс 0 = январь), без учёта високосности. */
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ---------------------------------------------------------------------------
// 1. Суточное потребление
// ---------------------------------------------------------------------------

export interface EnergyBreakdown {
  /** Сумма по приборам, Вт·ч/сут */
  loadWh: number;
  /** Холостой ход инвертора, Вт·ч/сут */
  idleWh: number;
  /** Итого с учётом запаса, Вт·ч/сут */
  totalWh: number;
}

/**
 * E = Σ(P × t × n) + P_idle × 24, затем × коэффициент запаса.
 */
export function dailyEnergy(input: {
  items: LoadItem[];
  inverterIdleW?: number;
  reserveFactor?: number;
}): EnergyBreakdown {
  const { items, inverterIdleW = 0, reserveFactor = 1.1 } = input;

  const loadWh = items.reduce((sum, item) => {
    const watt = Math.max(0, item.watt);
    const hours = Math.max(0, item.hoursPerDay);
    const qty = Math.max(0, item.quantity);
    return sum + watt * hours * qty;
  }, 0);

  const idleWh = Math.max(0, inverterIdleW) * 24;
  const totalWh = (loadWh + idleWh) * reserveFactor;

  return { loadWh, idleWh, totalWh };
}

// ---------------------------------------------------------------------------
// 2. Аккумулятор
// ---------------------------------------------------------------------------

export interface BatteryInput {
  dailyWh: number;
  autonomyDays: number;
  voltage: SystemVoltage;
  chemistry: Chemistry;
  inverterEfficiency?: number;
  wiringEfficiency?: number;
  /** Температура эксплуатации, °C. Влияет на предупреждения. */
  ambientC?: number;
}

export interface BatteryResult {
  /** Энергия, которую нужно запасти с учётом потерь, Вт·ч */
  requiredWh: number;
  /** Расчётная ёмкость, А·ч */
  capacityAh: number;
  /** Рекомендуемая ёмкость (округление до 5 А·ч), А·ч */
  recommendedAh: number;
  /** Полезная энергия при данной DoD, Вт·ч */
  usableWh: number;
  dod: number;
  warnings: string[];
}

export function batterySizing(input: BatteryInput): BatteryResult {
  const {
    dailyWh,
    autonomyDays,
    voltage,
    chemistry,
    inverterEfficiency = 0.9,
    wiringEfficiency = 0.98,
    ambientC = -10,
  } = input;

  assertPositive(dailyWh, "dailyWh");
  assertPositive(autonomyDays, "autonomyDays");
  assertPositive(voltage, "voltage");
  assertPositive(inverterEfficiency, "inverterEfficiency");
  assertPositive(wiringEfficiency, "wiringEfficiency");

  const c = CHEMISTRY[chemistry];
  const chain =
    inverterEfficiency * wiringEfficiency * c.tempDerate * c.agingDerate;

  const requiredWh = (dailyWh * autonomyDays) / chain;
  const capacityAh = requiredWh / (voltage * c.dod);
  const recommendedAh = Math.ceil(capacityAh / 5) * 5;

  const warnings: string[] = [];
  if (chemistry === "lifepo4" && ambientC < c.minChargeTempC) {
    warnings.push(
      "LiFePO4 нельзя заряжать при отрицательных температурах. Для неотапливаемого помещения нужен подогрев АКБ, утеплённый бокс или переход на AGM.",
    );
  }
  if (chemistry === "agm" && autonomyDays > 2) {
    warnings.push(
      "AGM при глубоком ежедневном разряде живёт 2–3 года. Для 3+ дней автономии выгоднее LiFePO4.",
    );
  }

  return {
    requiredWh,
    capacityAh,
    recommendedAh,
    usableWh: recommendedAh * voltage * c.dod,
    dod: c.dod,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// 3. Солнечные панели
// ---------------------------------------------------------------------------

export interface EfficiencyInput {
  mppt?: number;
  soiling?: number;
  mismatch?: number;
  dcCable?: number;
  temperature?: number;
  snow?: number;
  /** КПД цикла батареи — только для автономных систем */
  batteryRoundTrip?: number;
}

/** Произведение всех потерь тракта. */
export function systemEfficiency(input: EfficiencyInput = {}): number {
  const {
    mppt = DEFAULT_EFFICIENCY.mppt,
    soiling = DEFAULT_EFFICIENCY.soiling,
    mismatch = DEFAULT_EFFICIENCY.mismatch,
    dcCable = DEFAULT_EFFICIENCY.dcCable,
    temperature = DEFAULT_EFFICIENCY.temperature,
    snow = 1,
    batteryRoundTrip = 1,
  } = input;

  return (
    mppt * soiling * mismatch * dcCable * temperature * snow * batteryRoundTrip
  );
}

/**
 * P = E / (PSH × η) — требуемая мощность массива, Вт.
 * PSH берётся для расчётного (худшего) месяца.
 */
export function requiredPvW(input: {
  dailyWh: number;
  psh: number;
  efficiency: number;
}): number {
  assertPositive(input.dailyWh, "dailyWh");
  assertPositive(input.psh, "psh");
  assertPositive(input.efficiency, "efficiency");
  return input.dailyWh / (input.psh * input.efficiency);
}

/** Ожидаемая выработка массива за сутки в конкретном месяце, Вт·ч. */
export function pvDailyYieldWh(input: {
  pvW: number;
  psh: number;
  efficiency: number;
}): number {
  return Math.max(0, input.pvW) * Math.max(0, input.psh) * input.efficiency;
}

/** Выработка по месяцам, кВт·ч. */
export function pvMonthlyYieldKwh(input: {
  pvW: number;
  pshMonthly: number[];
  efficiency: number;
}): number[] {
  return input.pshMonthly.map(
    (psh, i) => (pvDailyYieldWh({ pvW: input.pvW, psh, efficiency: input.efficiency }) * DAYS_IN_MONTH[i]!) / 1000,
  );
}

// ---------------------------------------------------------------------------
// 4. Инвертор
// ---------------------------------------------------------------------------

export interface InverterResult {
  /** Требуемая длительная мощность, Вт */
  requiredW: number;
  /** Требуемая перегрузочная (пусковая) мощность, Вт */
  surgeW: number;
  /** Рекомендуемый номинал, Вт */
  recommendedW: number;
}

export function inverterSizing(input: {
  continuousW: number;
  surgeW?: number;
  safetyFactor?: number;
}): InverterResult {
  const { continuousW, surgeW = 0, safetyFactor = 1.25 } = input;
  assertPositive(continuousW, "continuousW");

  const requiredW = continuousW * safetyFactor;
  const effectiveSurge = Math.max(surgeW, requiredW);
  return {
    requiredW,
    surgeW: effectiveSurge,
    recommendedW: pickStandard(effectiveSurge, INVERTER_SIZES_W),
  };
}

// ---------------------------------------------------------------------------
// 5. MPPT-контроллер
// ---------------------------------------------------------------------------

/** Ток контроллера: I = P / U × запас, А. */
export function mpptCurrent(input: {
  pvW: number;
  batteryV: number;
  safetyFactor?: number;
}): number {
  assertPositive(input.pvW, "pvW");
  assertPositive(input.batteryV, "batteryV");
  const { safetyFactor = 1.25 } = input;
  return (input.pvW / input.batteryV) * safetyFactor;
}

export function recommendedMpptA(input: {
  pvW: number;
  batteryV: number;
  safetyFactor?: number;
}): number {
  return pickStandard(mpptCurrent(input), MPPT_SIZES_A);
}

// ---------------------------------------------------------------------------
// 6. Кабель
// ---------------------------------------------------------------------------

export interface CableInput {
  currentA: number;
  /** Длина трассы в одну сторону, м */
  lengthM: number;
  voltageV: number;
  /** Допустимое падение, % */
  maxDropPercent?: number;
  material?: CableMaterial;
  phases?: 1 | 3;
}

export interface CableResult {
  requiredSectionMm2: number;
  /** Ближайшее стандартное сечение, мм² */
  sectionMm2: number;
  /** Фактическое падение при выбранном сечении, % */
  actualDropPercent: number;
  warnings: string[];
}

/**
 * S = ρ × L × I / ΔU, где L — удвоенная длина для однофазной линии.
 */
export function cableSizing(input: CableInput): CableResult {
  const {
    currentA,
    lengthM,
    voltageV,
    maxDropPercent = 3,
    material = "copper",
    phases = 1,
  } = input;

  assertPositive(currentA, "currentA");
  assertPositive(lengthM, "lengthM");
  assertPositive(voltageV, "voltageV");
  assertPositive(maxDropPercent, "maxDropPercent");

  const rho = RESISTIVITY[material];
  const pathLength = lengthM * (phases === 3 ? Math.sqrt(3) : 2);
  const allowedDropV = (voltageV * maxDropPercent) / 100;
  const requiredSectionMm2 = (rho * pathLength * currentA) / allowedDropV;

  const sectionMm2 = pickStandard(requiredSectionMm2, CABLE_SECTIONS_MM2);
  const actualDropPercent =
    ((rho * pathLength * currentA) / sectionMm2 / voltageV) * 100;

  const warnings: string[] = [];
  const ampacity = AMPACITY_COPPER[sectionMm2];
  if (material === "copper" && ampacity !== undefined && currentA > ampacity) {
    warnings.push(
      `Сечение ${sectionMm2} мм² не выдержит ${Math.round(currentA)} А по нагреву — нужен кабель толще либо медные шины.`,
    );
  }

  return { requiredSectionMm2, sectionMm2, actualDropPercent, warnings };
}

// ---------------------------------------------------------------------------
// 7. Сводный расчёт автономной системы
// ---------------------------------------------------------------------------

export interface AutonomyInput {
  items: LoadItem[];
  pshMonthly: number[];
  optimalTilt: number;
  voltage: SystemVoltage;
  chemistry: Chemistry;
  autonomyDays: number;
  /** Месяц расчёта, 0–11. По умолчанию — декабрь. */
  designMonth?: number;
  inverterIdleW?: number;
  maxVoltageDropDc?: number;
}

export interface AutonomyResult {
  energy: EnergyBreakdown;
  battery: BatteryResult;
  /** Требуемая мощность массива для расчётного месяца, Вт */
  pvW: number;
  /** Требуемая мощность массива для лучшего месяца, Вт */
  pvWBest: number;
  /** Отношение зимней и летней потребности */
  seasonalRatio: number;
  inverter: InverterResult;
  mpptA: number;
  warnings: string[];
}

export function computeAutonomy(input: AutonomyInput): AutonomyResult {
  const { items, pshMonthly, autonomyDays, voltage, chemistry } = input;
  const designMonth = input.designMonth ?? 11;

  const energy = dailyEnergy({
    items,
    inverterIdleW: input.inverterIdleW ?? 15,
  });

  const isWinterMonth = designMonth === 11 || designMonth <= 1;
  const battery = batterySizing({
    dailyWh: energy.totalWh,
    autonomyDays,
    voltage,
    chemistry,
    ambientC: isWinterMonth ? -10 : 15,
  });

  const c = CHEMISTRY[chemistry];
  const eff = systemEfficiency({ batteryRoundTrip: c.roundTrip });

  const pshDesign = pshMonthly[designMonth] ?? Math.min(...pshMonthly);
  const pshBest = Math.max(...pshMonthly);

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

  const warnings = [...battery.warnings];

  return {
    energy,
    battery,
    pvW,
    pvWBest,
    seasonalRatio: pvW / pvWBest,
    inverter,
    mpptA: mpptCurrent({ pvW, batteryV: voltage }),
    warnings,
  };
}

/** Пиковая мощность: сумма номиналов и максимальный пусковой ток. */
export function peakLoadWReal(items: LoadItem[]): { sum: number; maxSurge: number } {
  let sum = 0;
  let maxSurge = 0;
  for (const item of items) {
    const p = Math.max(0, item.watt) * Math.max(0, item.quantity);
    sum += p;
    maxSurge = Math.max(maxSurge, p * (item.surgeFactor ?? 1));
  }
  return { sum, maxSurge };
}

// ---------------------------------------------------------------------------
// 8. Ориентировочный бюджет
// ---------------------------------------------------------------------------

/** Диапазон цены, ₽. */
export interface PriceRange {
  min: number;
  max: number;
}

/** Удельные розничные цены. Задаются данными, а не расчётом. */
export interface PriceTable {
  /** ₽ за 1 Вт установленной мощности панелей */
  panelPerW: PriceRange;
  /** ₽ за 1 кВт·ч номинальной ёмкости АКБ */
  batteryPerKwh: PriceRange;
  /** ₽ за 1 кВт номинала инвертора */
  inverterPerKw: PriceRange;
  /** ₽ за 1 А тока MPPT-контроллера */
  mpptPerA: PriceRange;
}

export interface BudgetInput {
  pvW: number;
  /** Номинальная энергия АКБ: recommendedAh × напряжение, Вт·ч */
  batteryNominalWh: number;
  inverterW: number;
  mpptA: number;
}

export interface BudgetLine {
  label: string;
  min: number;
  max: number;
}

export interface BudgetResult {
  lines: BudgetLine[];
  total: PriceRange;
}

/**
 * Оценка бюджета комплекта по удельным ценам.
 * Кабель, крепёж, автоматику и монтаж не считает: они зависят от объекта.
 */
export function estimateBudget(
  input: BudgetInput,
  prices: PriceTable,
): BudgetResult {
  const lines: BudgetLine[] = [
    {
      label: "Солнечные панели",
      min: Math.max(0, input.pvW) * prices.panelPerW.min,
      max: Math.max(0, input.pvW) * prices.panelPerW.max,
    },
    {
      label: "Аккумуляторы",
      min: (Math.max(0, input.batteryNominalWh) / 1000) * prices.batteryPerKwh.min,
      max: (Math.max(0, input.batteryNominalWh) / 1000) * prices.batteryPerKwh.max,
    },
    {
      label: "Инвертор",
      min: (Math.max(0, input.inverterW) / 1000) * prices.inverterPerKw.min,
      max: (Math.max(0, input.inverterW) / 1000) * prices.inverterPerKw.max,
    },
    {
      label: "MPPT-контроллер",
      min: Math.max(0, input.mpptA) * prices.mpptPerA.min,
      max: Math.max(0, input.mpptA) * prices.mpptPerA.max,
    },
  ];

  const total = lines.reduce(
    (acc, line) => ({ min: acc.min + line.min, max: acc.max + line.max }),
    { min: 0, max: 0 },
  );

  return { lines, total };
}
