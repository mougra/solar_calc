"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { AppliancePreset, Chemistry, LoadItem, SystemVoltage } from "@/lib/core/types";
import type { CalcState } from "@/lib/state/query";

interface CalcActions {
  setCity: (city: string) => void;
  setMonth: (month: number) => void;
  setStep: (step: number) => void;
  setVoltage: (voltage: SystemVoltage) => void;
  setChemistry: (chemistry: Chemistry) => void;
  setAutonomyDays: (days: number) => void;
  togglePreset: (preset: AppliancePreset) => void;
  updateItem: (id: string, patch: Partial<LoadItem>) => void;
  removeItem: (id: string) => void;
  addCustom: (name: string, watt: number, hours: number, quantity: number) => void;
  /** Применить состояние из URL целиком (после гидратации). */
  hydrate: (state: CalcState) => void;
}

export type CalcStore = CalcState & CalcActions;

export function createCalculatorStore(initial: CalcState): StoreApi<CalcStore> {
  return createStore<CalcStore>()((set, get) => ({
    ...initial,

    setCity: (city) => set({ city }),
    setMonth: (month) => set({ month }),
    setStep: (step) => set({ step: Math.min(4, Math.max(1, step)) }),
    setVoltage: (voltage) => set({ voltage }),
    setChemistry: (chemistry) => set({ chemistry }),
    setAutonomyDays: (autonomyDays) =>
      set({ autonomyDays: Math.min(5, Math.max(1, autonomyDays)) }),

    togglePreset: (preset) => {
      const items = get().items;
      const exists = items.some((item) => item.id === preset.id);
      if (exists) {
        set({ items: items.filter((item) => item.id !== preset.id) });
        return;
      }
      set({
        items: [
          ...items,
          {
            id: preset.id,
            name: preset.name,
            watt: preset.watt,
            hoursPerDay: preset.hours,
            quantity: 1,
            surgeFactor: preset.surgeFactor,
          },
        ],
      });
    },

    updateItem: (id, patch) =>
      set({
        items: get().items.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      }),

    removeItem: (id) =>
      set({ items: get().items.filter((item) => item.id !== id) }),

    addCustom: (name, watt, hours, quantity) =>
      set({
        items: [
          ...get().items,
          {
            id: `custom-${Date.now().toString(36)}`,
            name: name.trim() || "Свой прибор",
            watt: Math.max(1, watt),
            hoursPerDay: Math.min(24, Math.max(0.01, hours)),
            quantity: Math.max(1, quantity),
          },
        ],
      }),

    hydrate: (next) =>
      set({
        city: next.city,
        month: next.month,
        items: next.items,
        voltage: next.voltage,
        chemistry: next.chemistry,
        autonomyDays: next.autonomyDays,
        step: next.step,
      }),
  }));
}

const StoreContext = createContext<StoreApi<CalcStore> | null>(null);

export function CalculatorStoreProvider({
  initial,
  children,
}: {
  initial: CalcState;
  children: ReactNode;
}) {
  const storeRef = useRef<StoreApi<CalcStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createCalculatorStore(initial);
  }
  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

export function useCalc<T>(selector: (state: CalcStore) => T): T {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useCalc должен использоваться внутри CalculatorStoreProvider");
  }
  return useStore(store, selector);
}
