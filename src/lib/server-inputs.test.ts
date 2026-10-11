import { describe, expect, it } from "vitest";
import { moveConnectionInput, needIdInput, refreshSourceInput } from "./server-inputs";

const id = "7d1f0b8e-3c1a-4c55-9b0e-2a6f3e1d9c10";

describe("server action inputs", () => {
  it("accepts well-formed requests", () => {
    expect(moveConnectionInput.parse({ id, status: "accepted" }).status).toBe("accepted");
    expect(needIdInput.parse({ needId: id }).needId).toBe(id);
    expect(refreshSourceInput.parse({ sourceId: id, placeSlug: "kings-heath" }).placeSlug).toBe(
      "kings-heath",
    );
  });
  it("rejects unknown statuses and non-uuid ids", () => {
    expect(() => moveConnectionInput.parse({ id, status: "approved" })).toThrow();
    expect(() => moveConnectionInput.parse({ id: "1 or 1=1", status: "sent" })).toThrow();
    expect(() => needIdInput.parse({ needId: "abc" })).toThrow();
  });
  it("rejects odd slugs and out-of-range days", () => {
    expect(() => refreshSourceInput.parse({ sourceId: id, placeSlug: "a,b.eq.x" })).toThrow();
    expect(() => refreshSourceInput.parse({ sourceId: id, placeSlug: "x", days: 999 })).toThrow();
  });
});
