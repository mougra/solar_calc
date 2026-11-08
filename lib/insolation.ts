/** Месячные данные о приходе солнечной радиации. */

import type { InsolationData, InsolationEntry } from "./core/types";

export interface InsolationMeta {
  source: string;
  years: string;
  generated: string;
  fields: string;
}

/** Расширенная запись: помесячные кВт·ч/м², а не дневные PSH. */
export interface CityInsolation {
  lat: number;
  lon: number;
  optimalTilt: number;
  monthlyKwhM2: number[];
  monthlyKwhM2Tilt30: number[];
  monthlyKwhM2Tilt60: number[];
  period: { start: number | null; end: number | null };
  source?: "SARAH3" | "ERA5";
}

export interface CityInsolationData {
  meta: InsolationMeta;
  cities: Record<string, CityInsolation>;
}

import raw from "@/data/insolation.json";

const data = raw as unknown as CityInsolationData;

export const INSOLATION_META = data.meta;

export function getCityInsolation(slug: string): CityInsolation | undefined {
  return data.cities[slug];
}

export function hasCityInsolation(slug: string): boolean {
  return slug in data.cities;
}

export const INSOLATION_CITY_SLUGS = Object.keys(data.cities);

/**
 * Средний дневной приход (PSH, кВт·ч/м²/сут) по месяцам для заданного угла.
 * angle: "optimal" | 30 | 60
 */
export function monthlyPsh(
  entry: CityInsolation,
  angle: "optimal" | 30 | 60 = "optimal",
): number[] {
  const source =
    angle === "optimal"
      ? entry.monthlyKwhM2
      : angle === 30
        ? entry.monthlyKwhM2Tilt30
        : entry.monthlyKwhM2Tilt60;

  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return source.map((kwh, i) => kwh / days[i]!);
}

export function annualYieldKwhPerKwp(entry: CityInsolation): number {
  return entry.monthlyKwhM2.reduce((sum, v) => sum + v, 0);
}

/** Совместимость со старым типом. */
export type { InsolationData, InsolationEntry };
