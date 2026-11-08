import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_STATE,
  parseCalcState,
  parseItems,
  serializeItems,
  toSearchParams,
} from "./query.ts";

describe("разбор query-строки", () => {
  it("возвращает значения по умолчанию на пустой строке", () => {
    const state = parseCalcState(new URLSearchParams());
    assert.equal(state.city, DEFAULT_STATE.city);
    assert.equal(state.month, DEFAULT_STATE.month);
    assert.equal(state.voltage, DEFAULT_STATE.voltage);
    assert.equal(state.chemistry, DEFAULT_STATE.chemistry);
    assert.equal(state.autonomyDays, DEFAULT_STATE.autonomyDays);
    assert.equal(state.items.length, DEFAULT_STATE.items.length);
  });

  it("читает валидные параметры", () => {
    const state = parseCalcState(
      new URLSearchParams({
        city: "sochi",
        m: "6",
        v: "48",
        b: "agm",
        d: "4",
        step: "4",
      }),
    );
    assert.equal(state.city, "sochi");
    assert.equal(state.month, 6);
    assert.equal(state.voltage, 48);
    assert.equal(state.chemistry, "agm");
    assert.equal(state.autonomyDays, 4);
    assert.equal(state.step, 4);
  });

  it("игнорирует мусор и не выходит за границы", () => {
    const state = parseCalcState(
      new URLSearchParams({
        city: "../../etc/passwd",
        m: "42",
        v: "7",
        b: "lead",
        d: "99",
        step: "-3",
      }),
    );
    assert.equal(state.city, DEFAULT_STATE.city);
    assert.equal(state.month, DEFAULT_STATE.month);
    assert.equal(state.voltage, DEFAULT_STATE.voltage);
    assert.equal(state.chemistry, DEFAULT_STATE.chemistry);
    assert.equal(state.autonomyDays, DEFAULT_STATE.autonomyDays);
    assert.equal(state.step, 1);
  });

  it("принимает searchParams как объект Next.js", () => {
    const state = parseCalcState({ city: "kazan", m: "2" });
    assert.equal(state.city, "kazan");
    assert.equal(state.month, 2);
  });
});

describe("сериализация приборов", () => {
  it("переживает круговой обход", () => {
    const items = [
      { id: "fridge", name: "Холодильник", watt: 120, hoursPerDay: 8, quantity: 1 },
      { id: "led-light", name: "Свет", watt: 10, hoursPerDay: 5, quantity: 4 },
    ];
    const parsed = parseItems(serializeItems(items));
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0]?.watt, 120);
    assert.equal(parsed[0]?.hoursPerDay, 8);
    assert.equal(parsed[1]?.quantity, 4);
    assert.equal(parsed[1]?.name, "Освещение LED");
  });

  it("пропускает битые фрагменты", () => {
    assert.equal(parseItems("~bad~").length, 0);
    assert.equal(parseItems("fridge|x|y|z").length, 0);
  });
});

describe("полный цикл состояния", () => {
  it("state → query → state сохраняет параметры", () => {
    const state = {
      ...DEFAULT_STATE,
      city: "novosibirsk",
      month: 11,
      voltage: 48 as const,
      chemistry: "lifepo4" as const,
      autonomyDays: 3,
      step: 3,
    };
    const query = toSearchParams(state);
    const restored = parseCalcState(new URLSearchParams(query));

    assert.equal(restored.city, state.city);
    assert.equal(restored.month, state.month);
    assert.equal(restored.voltage, state.voltage);
    assert.equal(restored.chemistry, state.chemistry);
    assert.equal(restored.autonomyDays, state.autonomyDays);
    assert.equal(restored.step, state.step);
    assert.equal(restored.items.length, state.items.length);
  });
});
