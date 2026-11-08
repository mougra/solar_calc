export type GoalName = "wizard_start" | "wizard_result" | "offer_click" | "calc_result";

type YmFn = (id: number, method: string, ...args: unknown[]) => void;

const FALLBACK_ID = "114135374";

/**
 * Отправка цели в Яндекс Метрику. Безопасна при отсутствии счётчика:
 * в dev-режиме и без NEXT_PUBLIC_YM_ID просто ничего не делает.
 */
export function reachGoal(goal: GoalName, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const id = process.env.NEXT_PUBLIC_YM_ID ?? FALLBACK_ID;
  if (!id) return;

  const ym = (window as unknown as { ym?: YmFn }).ym;
  if (typeof ym !== "function") return;

  ym(Number(id), "reachGoal", goal, params);
}
