import type { Chemistry, LoadItem, SystemVoltage } from "@/lib/core/types";
import { APPLIANCE_BY_ID } from "../../data/appliances.ts";

export interface CalcState {
  city: string;
  /** Расчётный месяц, 0–11 */
  month: number;
  items: LoadItem[];
  voltage: SystemVoltage;
  chemistry: Chemistry;
  autonomyDays: number;
  step: number;
}

export const DEFAULT_STATE: CalcState = {
  city: "moskva",
  month: 11,
  items: [
    { id: "fridge", name: "Холодильник", watt: 120, hoursPerDay: 8, quantity: 1, surgeFactor: 3 },
    { id: "led-light", name: "Освещение LED", watt: 10, hoursPerDay: 5, quantity: 4 },
    { id: "tv", name: "Телевизор", watt: 100, hoursPerDay: 4, quantity: 1 },
    { id: "router", name: "Роутер + модем", watt: 10, hoursPerDay: 24, quantity: 1 },
  ],
  voltage: 24,
  chemistry: "lifepo4",
  autonomyDays: 2,
  step: 1,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Парсит состояние из query-строки. Неизвестные значения игнорируются. */
export function parseCalcState(params: URLSearchParams | Record<string, string | string[] | undefined>): CalcState {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const state: CalcState = {
    ...DEFAULT_STATE,
    items: DEFAULT_STATE.items.map((item) => ({ ...item })),
  };

  const city = get("city");
  if (city && /^[a-z0-9-]+$/.test(city)) state.city = city;

  const month = Number(get("m"));
  if (Number.isInteger(month) && month >= 0 && month <= 11) state.month = month;

  const voltage = Number(get("v"));
  if (voltage === 12 || voltage === 24 || voltage === 48) state.voltage = voltage;

  const chemistry = get("b");
  if (chemistry === "lifepo4" || chemistry === "agm") state.chemistry = chemistry;

  const days = Number(get("d"));
  if (Number.isInteger(days) && days >= 1 && days <= 5) state.autonomyDays = days;

  const step = Number(get("step"));
  if (Number.isInteger(step) && step >= 1 && step <= 4) state.step = step;

  const items = get("items");
  if (items) {
    const parsed = parseItems(items);
    if (parsed.length > 0) state.items = parsed;
  }

  return state;
}

/**
 * Формат: `id|qty|watt|hours` через `~`.
 * Имена берём из пресетов; для кастомных — «Свой прибор».
 */
export function parseItems(raw: string): LoadItem[] {
  const result: LoadItem[] = [];
  for (const chunk of raw.split("~")) {
    const [id, qtyRaw, wattRaw, hoursRaw] = chunk.split("|");
    if (!id) continue;

    const preset = APPLIANCE_BY_ID.get(id);
    const quantity = clamp(Number(qtyRaw), 0.1, 100);
    const watt = clamp(Number(wattRaw), 1, 30000);
    const hours = clamp(Number(hoursRaw), 0.01, 24);

    if (!Number.isFinite(quantity) || !Number.isFinite(watt) || !Number.isFinite(hours)) {
      continue;
    }

    result.push({
      id,
      name: preset?.name ?? "Свой прибор",
      watt: Math.round(watt * 10) / 10,
      hoursPerDay: Math.round(hours * 100) / 100,
      quantity: Math.round(quantity * 10) / 10,
      surgeFactor: preset?.surgeFactor,
    });
  }
  return result;
}

export function serializeItems(items: LoadItem[]): string {
  return items
    .map(
      (item) =>
        `${item.id}|${item.quantity}|${item.watt}|${item.hoursPerDay}`,
    )
    .join("~");
}

export function toSearchParams(state: CalcState): string {
  const params = new URLSearchParams({
    city: state.city,
    m: String(state.month),
    v: String(state.voltage),
    b: state.chemistry,
    d: String(state.autonomyDays),
    step: String(state.step),
    items: serializeItems(state.items),
  });
  return params.toString();
}
