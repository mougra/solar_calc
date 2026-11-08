export interface CityOption {
  slug: string;
  name: string;
  region: string;
  district: string;
  /** кВт·ч/м²/мес на наклон под оптимальным углом */
  monthly: number[];
  /** Оптимальный угол, ° */
  tilt: number;
  source: "SARAH3" | "ERA5";
}

export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
