import { describe, expect, it } from "vitest";

import { storedSourcePrice } from "./price-state";

describe("stored source price state", () => {
  it("keeps explicit free distinct from missing price", () => {
    expect(storedSourcePrice({ cost: 0, currency: "GBP" })).toEqual({
      cost: 0,
      currency: "GBP",
      price_known: true,
    });
    expect(storedSourcePrice({ cost: null, currency: "" })).toEqual({
      cost: 0,
      currency: "XXX",
      price_known: false,
    });
  });

  it("preserves a known paid price and a valid non-GBP currency", () => {
    expect(storedSourcePrice({ cost: 15.5, currency: "jpy" })).toEqual({
      cost: 15.5,
      currency: "JPY",
      price_known: true,
    });
    expect(storedSourcePrice({ cost: 125, currency: "AUD" })).toEqual({
      cost: 125,
      currency: "AUD",
      price_known: true,
    });
  });

  it("does not assume GBP if the amount or currency is absent or malformed", () => {
    for (const input of [
      { cost: null, currency: "GBP" },
      { cost: 12, currency: "" },
      { cost: 12, currency: "x" },
      { cost: 12, currency: "XXX" },
      { cost: -1, currency: "USD" },
      { cost: Number.NaN, currency: "USD" },
      { cost: Number.POSITIVE_INFINITY, currency: "USD" },
    ]) {
      expect(storedSourcePrice(input).price_known).toBe(false);
      expect(storedSourcePrice(input).currency).toBe("XXX");
    }
  });
});
