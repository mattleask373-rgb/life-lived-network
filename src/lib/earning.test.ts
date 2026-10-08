import { describe, expect, it } from "vitest";
import { describePay, isPaidNeed, skillGaps, toMinorUnits } from "./earning";

describe("earning", () => {
  it("stores money as integer cents, avoiding float drift", () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
    expect(toMinorUnits(null)).toBeNull();
  });

  it("describes a range exactly as stated", () => {
    expect(
      describePay({ budget: 40, budgetMax: 60.5, currency: "GBP", paymentModel: "range" }),
    ).toBe("£40–£60.50");
  });

  it("never invents an amount when none was given", () => {
    expect(
      describePay({ budget: null, budgetMax: null, currency: "GBP", paymentModel: "unknown" }),
    ).toBe("Pay not stated");
  });

  it("does not treat swaps or given time as paid", () => {
    expect(isPaidNeed({ intent: "paid_work", paymentType: "paid", paymentModel: "exchange" })).toBe(
      false,
    );
    expect(
      isPaidNeed({ intent: "volunteering", paymentType: "unsure", paymentModel: "unpaid" }),
    ).toBe(false);
    expect(
      isPaidNeed({ intent: "one_off_work", paymentType: "unsure", paymentModel: "fixed" }),
    ).toBe(true);
  });

  it("counts gaps only from real needs, excluding what the person has", () => {
    const gaps = skillGaps(
      [
        { requiredSkills: ["Gardening", "Driving"], requiredQualifications: ["DBS check"] },
        { requiredSkills: ["driving"], requiredQualifications: [] },
      ],
      ["gardening"],
    );
    expect(gaps).toEqual([
      { label: "Driving", askedBy: 2 },
      { label: "DBS check", askedBy: 1 },
    ]);
    expect(skillGaps([], [])).toEqual([]);
  });
});
