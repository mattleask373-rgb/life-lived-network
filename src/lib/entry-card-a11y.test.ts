import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const entryCard = readFileSync("src/components/entry-card.tsx", "utf8");

describe("EntryCard accessibility contract", () => {
  it("keeps semantic card content and a separately named native action", () => {
    expect(entryCard).toContain("<article");
    expect(entryCard).toContain("<h3 id={titleId}");
    expect(entryCard).toContain("aria-labelledby={titleId}");
    expect(entryCard).toContain("aria-describedby={descriptionId}");
    expect(entryCard).toContain("onClick={handleActivate}");
  });

  it("has an inset visible focus treatment for the stretched action", () => {
    expect(entryCard).toContain(
      "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    );
  });
});
