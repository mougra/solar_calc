/** Форматирование чисел и величин для русского интерфейса. */

const intFmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

const oneFmt = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const twoFmt = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const fmtInt = (value: number): string => intFmt.format(Math.round(value));

export const fmt1 = (value: number): string => oneFmt.format(value);

export const fmt2 = (value: number): string => twoFmt.format(value);

/** Вт → «1,2 кВт» или «850 Вт» */
export function fmtPower(watt: number): string {
  if (Math.abs(watt) >= 1000) return `${fmt1(watt / 1000)} кВт`;
  return `${fmtInt(watt)} Вт`;
}

/** Вт·ч → «12,4 кВт·ч» или «850 Вт·ч» */
export function fmtEnergy(wh: number): string {
  if (Math.abs(wh) >= 1000) return `${fmt1(wh / 1000)} кВт·ч`;
  return `${fmtInt(wh)} Вт·ч`;
}

export const fmtAh = (ah: number): string => `${fmtInt(ah)} А·ч`;

export const fmtMoney = (rub: number): string => `${fmtInt(rub)} ₽`;

export const fmtPercent = (ratio: number): string => `${fmtInt(ratio * 100)} %`;

const MONTHS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

const MONTHS_FULL = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

export const monthShort = (index: number): string => MONTHS_SHORT[index] ?? "";

export const monthFull = (index: number): string => MONTHS_FULL[index] ?? "";
