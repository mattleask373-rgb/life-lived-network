import { describe, expect, it } from "vitest";

import { isLocale, SUPPORTED_LOCALES, translate } from "./locale";

describe("global locale foundation", () => {
  it("supports the initial release locales without accepting arbitrary values", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "pt", "es", "ja"]);
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it("provides navigation and map labels in each supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(translate(locale, "nav.explore")).not.toBe("");
      expect(translate(locale, "map.everything")).not.toBe("");
      expect(translate(locale, "layer.community")).not.toBe("");
    }
    expect(translate("pt", "map.everything")).toBe("Tudo");
    expect(translate("es", "nav.find")).toBe("Encontrar");
    expect(translate("ja", "layer.nature")).toBe("自然");
  });
});
