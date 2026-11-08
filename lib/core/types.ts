/** Базовые типы предметной области. Единицы указаны в именах полей и в JSDoc. */

export type Chemistry = "lifepo4" | "agm";

/** Номинальное напряжение системы, В */
export type SystemVoltage = 12 | 24 | 48;

export type CableMaterial = "copper" | "aluminum";

/** Одна нагрузка в суточном балансе. */
export interface LoadItem {
  id: string;
  name: string;
  /** Номинальная мощность, Вт */
  watt: number;
  /** Эффективное время работы в сутки, ч (для компрессора — время под нагрузкой) */
  hoursPerDay: number;
  /** Количество одинаковых приборов, шт */
  quantity: number;
  /** Кратность пускового тока (насос, компрессор). 1 — пуск не учитываем. */
  surgeFactor?: number;
}

export type ApplianceCategory =
  | "cold"
  | "water"
  | "kitchen"
  | "light"
  | "climate"
  | "tech"
  | "other";

export interface AppliancePreset {
  id: string;
  name: string;
  category: ApplianceCategory;
  icon: string;
  /** Вт */
  watt: number;
  /** ч/сут (эффективные) */
  hours: number;
  surgeFactor?: number;
  hint?: string;
}

export interface City {
  id: string;
  slug: string;
  name: string;
  region: string;
  district: string;
  lat: number;
  lon: number;
  populationK: number;
}

/** Месячные значения прихода солнечной радиации, кВт·ч/м²/сут. Индекс 0 = январь. */
export interface InsolationEntry {
  lat: number;
  lon: number;
  /** Оптимальный угол наклона, ° */
  optimalTilt: number;
  psh: number[];
  psh30: number[];
  psh60: number[];
  source: "SARAH3" | "ERA5";
}

export interface InsolationData {
  meta: {
    source: string;
    years: string;
    generated: string;
    tiltNote: string;
  };
  cities: Record<string, InsolationEntry>;
}
