import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// No DOM test library is installed, so this guards the source classes that
// give the detail panel's controls a 44px touch target on phones.
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("detail panel touch targets", () => {
  it("dialog close button is 44px", () => {
    const src = read("components/ui/dialog.tsx");
    expect(src).toMatch(/DialogPrimitive\.Close className="[^"]*\bh-11 w-11\b/);
  });
  it("save and go buttons are at least 44px tall", () => {
    const src = read("components/entry-sheet.tsx");
    expect(src).toMatch(/min-h-11 rounded-full px-4 py-2 text-sm transition-colors/);
    expect(src).toMatch(/min-h-11 rounded-full border border-border bg-card px-4 py-2 text-sm/);
  });
});
