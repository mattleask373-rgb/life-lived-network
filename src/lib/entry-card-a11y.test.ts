import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const entryCard = readFileSync("src/components/entry-card.tsx", "utf8");

describe("EntryCard accessibility contract", () => {
  it("keeps block content outside the native action button", () => {
    expect(entryCard).toContain("<article");
    expect(entryCard).not.toMatch(/<button[\s\S]*?<\/button>/);
  });

  it("uses a named native button only when the card is interactive", () => {
    expect(entryCard).toContain("{interactive ? (");
    expect(entryCard).toContain("<button");
    expect(entryCard).toContain("aria-label={`Open listing: ${entry.title}`}");
    expect(entryCard).toContain("onClick={handleActivate}");
    expect(entryCard).not.toContain('role={interactive ? "button" : undefined}');
    expect(entryCard).not.toContain("onKeyDown=");
  });

  it("retains a visible keyboard focus indicator on the full-card action", () => {
    expect(entryCard).toContain(
      'className="focus-ink absolute inset-0 z-10 appearance-none rounded-2xl border-0 bg-transparent p-0"',
    );
  });
});
