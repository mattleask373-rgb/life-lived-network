import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const entryCard = readFileSync("src/components/entry-card.tsx", "utf8");

describe("EntryCard accessibility contract", () => {
  it("does not wrap block content in a native button", () => {
    expect(entryCard).not.toMatch(/<button[\\s\\S]*aspect-\\[4\\/3\\]/);
    expect(entryCard).toContain("<article");
  });

  it("exposes a named, focusable button role only when the card is interactive", () => {
    expect(entryCard).toContain('role={interactive ? "button" : undefined}');
    expect(entryCard).toContain("tabIndex={interactive ? 0 : undefined}");
    expect(entryCard).toContain('aria-label={interactive ? `Open listing: ${entry.title}` : undefined}');
  });

  it("supports Enter and Space without scrolling the page", () => {
    expect(entryCard).toContain('event.key !== "Enter" && event.key !== " "');
    expect(entryCard).toContain("event.preventDefault()");
    expect(entryCard).toContain("onKeyDown={interactive ? handleKeyDown : undefined}");
  });
});
