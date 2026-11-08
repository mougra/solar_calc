import { CITIES } from "@/data/cities";
import { getCityInsolation } from "@/lib/insolation";
import type { CityOption } from "@/components/calculator/types";

/** Города, для которых есть полные данные инсоляции. */
export function getCityOptions(): CityOption[] {
  return CITIES.flatMap((city) => {
    const data = getCityInsolation(city.slug);
    if (!data || data.monthlyKwhM2.length !== 12) return [];
    return [
      {
        slug: city.slug,
        name: city.name,
        region: city.region,
        district: city.district,
        monthly: data.monthlyKwhM2,
        tilt: data.optimalTilt,
        source: data.source ?? "SARAH3",
      },
    ];
  });
}

export function getCityOption(slug: string): CityOption | undefined {
  return getCityOptions().find((city) => city.slug === slug);
}
