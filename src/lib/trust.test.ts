import { describe, expect, it } from "vitest";
import { densityOf, trustState } from "./trust";

describe("trustState", () => {
  it("never calls an unchecked entry checked", () => {
    expect(trustState({ verified: false })).toBe("unchecked");
    expect(trustState({ verified: true, quality: "unverified" })).toBe("unchecked");
  });
  it("demonstration wins over everything", () => {
    expect(trustState({ verified: true, quality: "verified", demonstration: true })).toBe(
      "demonstration",
    );
  });
  it("stale beats verified", () => {
    expect(trustState({ verified: true, quality: "may have changed" })).toBe("stale");
  });
  it("confirmed origin reads as confirmed", () => {
    expect(trustState({ verified: false, origin: "confirmed" })).toBe("confirmed");
  });
});

describe("densityOf", () => {
  it("bands real counts", () => {
    expect(densityOf(0)).toBe("quiet");
    expect(densityOf(3)).toBe("sparse");
    expect(densityOf(8)).toBe("busy");
  });
});
