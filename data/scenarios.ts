import type { LoadItem } from "@/lib/core/types";
import { APPLIANCE_BY_ID } from "./appliances";
import { toSearchParams, type CalcState } from "@/lib/state/query";

const CALC_PATH = "/kalkulyator-solnechnyh-panelej";

/** Прибор из пресета: мощность и часы берём из data/appliances.ts. */
function item(id: string, quantity = 1): LoadItem {
  const preset = APPLIANCE_BY_ID.get(id);
  if (!preset) throw new Error(`Нет пресета прибора: ${id}`);
  return {
    id,
    name: preset.name,
    watt: preset.watt,
    hoursPerDay: preset.hours,
    quantity,
    surgeFactor: preset.surgeFactor,
  };
}

function scenarioHref(state: Omit<CalcState, "step">): string {
  return `${CALC_PATH}?${toSearchParams({ ...state, step: 4 })}`;
}

export interface Scenario {
  slug: string;
  title: string;
  hint: string;
  href: string;
}

/**
 * Готовые сценарии для главной: один клик открывает рассчитанный результат.
 * Город потом меняется на шаге 1 — ссылка ведёт сразу на шаг 4.
 */
export const SCENARIOS: Scenario[] = [
  {
    slug: "dacha",
    title: "Дача летом",
    hint: "Свет, холодильник, роутер — июнь, 2 дня автономии",
    href: scenarioHref({
      city: "moskva",
      month: 5,
      items: [item("fridge"), item("led-light", 4), item("router")],
      voltage: 24,
      chemistry: "lifepo4",
      autonomyDays: 2,
    }),
  },
  {
    slug: "dom",
    title: "Дом круглый год",
    hint: "Насос, холодильник, техника — расчётный месяц декабрь",
    href: scenarioHref({
      city: "moskva",
      month: 11,
      items: [
        item("fridge"),
        item("pump"),
        item("led-light", 6),
        item("tv"),
        item("router"),
      ],
      voltage: 48,
      chemistry: "lifepo4",
      autonomyDays: 2,
    }),
  },
  {
    slug: "zima",
    title: "Зимняя автономия",
    hint: "Без генератора, 3 суток без солнца — самый дорогой сценарий",
    href: scenarioHref({
      city: "moskva",
      month: 11,
      items: [
        item("fridge"),
        item("pump"),
        item("led-light", 6),
        item("tv"),
        item("router"),
      ],
      voltage: 48,
      chemistry: "lifepo4",
      autonomyDays: 3,
    }),
  },
];
