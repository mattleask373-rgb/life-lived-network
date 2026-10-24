import { describe, expect, it } from "vitest";

import {
  formatLocalizedCurrency,
  formatLocalizedDuration,
  formatLocalizedEventDate,
  isLocale,
  LOCALE_TAGS,
  SUPPORTED_LOCALES,
  translate,
} from "./locale";

describe("global locale foundation", () => {
  it("supports the initial release locales without accepting arbitrary values", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "pt", "es", "ja"]);
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(LOCALE_TAGS).toEqual({ en: "en-GB", pt: "pt-PT", es: "es-ES", ja: "ja-JP" });
  });

  it("provides navigation and map labels in each supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(translate(locale, "nav.explore")).not.toBe("");
      expect(translate(locale, "map.everything")).not.toBe("");
      expect(translate(locale, "layer.community")).not.toBe("");
      expect(translate(locale, "detail.money")).not.toBe("");
      expect(translate(locale, "money.unknown")).not.toBe("");
      expect(translate(locale, "money.unknown")).not.toBe("");
    }
    expect(translate("pt", "map.everything")).toBe("Tudo");
    expect(translate("es", "nav.find")).toBe("Encontrar");
    expect(translate("ja", "layer.nature")).toBe("自然");
  });

  it("localizes currency, duration and event times without inventing the currency or place time zone", () => {
    expect(formatLocalizedCurrency(1250, "GBP", "en")).toBe("£1,250");
    expect(formatLocalizedCurrency(12.5, "EUR", "en")).toBe("€12.50");
    expect(formatLocalizedCurrency(0, "GBP", "pt")).toBe("Grátis");
    expect(formatLocalizedCurrency(0, "GBP", "en", false)).toBe("Price not provided");
    expect(formatLocalizedCurrency(0, "XXX", "en")).toBe("Price not provided");
    expect(formatLocalizedCurrency(25, "XXX", "pt", false)).toBe("Preço não indicado");
    expect(formatLocalizedCurrency(0, "XXX", "es", false)).toBe("Precio no indicado");
    expect(formatLocalizedCurrency(0, "XXX", "ja", false)).toBe("価格情報なし");
    expect(formatLocalizedCurrency(12.5, "INVALID", "en")).toBe("INVALID 12.50");
    expect(formatLocalizedCurrency(-40, "GBP", "es")).toContain("Paga");
    expect(formatLocalizedDuration(45, "en")).toBe("45 min");
    expect(formatLocalizedDuration(90, "pt")).toBe("1,5 h");
    expect(formatLocalizedDuration(0, "ja")).toBe("時間指定なし");
    expect(formatLocalizedEventDate("2026-09-19T18:00:00Z", "Europe/London", "en")).toContain(
      "19:00",
    );
    expect(formatLocalizedEventDate("not-a-date", "Europe/London", "en")).toBe("");
    expect(formatLocalizedEventDate("2026-09-19T18:00:00Z", "Invalid/Zone", "en")).toBe("");
  });
});
