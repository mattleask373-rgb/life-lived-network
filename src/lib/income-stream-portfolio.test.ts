import { describe, expect, it } from "vitest";
import { INCOME_STREAM_PORTFOLIO } from "./income-stream-portfolio";
import { validateIncomeStreamKit } from "./income-stream-kit";

describe("income stream portfolio", () => {
  it("contains multiple independent industry hypotheses without exceeding L2", () => {
    const industries = new Set(INCOME_STREAM_PORTFOLIO.map((stream) => stream.industry));
    expect(INCOME_STREAM_PORTFOLIO.length).toBeGreaterThanOrEqual(5);
    expect(industries.size).toBeGreaterThanOrEqual(4);
    for (const stream of INCOME_STREAM_PORTFOLIO) {
      expect(() => validateIncomeStreamKit(stream)).not.toThrow();
      expect(["L0", "L1", "L2"]).toContain(stream.autonomyCeiling);
    }
  });

  it("requires every stream to declare evidence and kill criteria", () => {
    for (const stream of INCOME_STREAM_PORTFOLIO) {
      expect(stream.evidenceRequired.length).toBeGreaterThan(0);
      expect(stream.killCriteria.length).toBeGreaterThan(0);
      expect(stream.humanGates.length).toBeGreaterThan(0);
    }
  });

  it("does not claim validated revenue", () => {
    expect(INCOME_STREAM_PORTFOLIO.every((stream) => stream.state === "EXPERIMENTAL")).toBe(true);
  });
});
