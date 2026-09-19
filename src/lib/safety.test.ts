import { describe, expect, it } from "vitest";
import { otherPerson, REPORT_REASONS } from "./safety";

describe("connection safety", () => {
  const request = { senderId: "sarah", recipientId: "david" };

  it("identifies only the other participant", () => {
    expect(otherPerson(request, "sarah")).toBe("david");
    expect(otherPerson(request, "david")).toBe("sarah");
    expect(otherPerson(request, "stranger")).toBeNull();
  });

  it("keeps report reasons bounded and plain", () => {
    expect(REPORT_REASONS.map((reason) => reason.id)).toEqual([
      "safety",
      "harassment",
      "spam",
      "misleading",
      "other",
    ]);
  });
});