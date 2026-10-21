import { describe, expect, it } from "vitest";

import { DataError } from "./data/errors";
import { loadLocalityEntries } from "./locality-page-data";

describe("locality page entry loading", () => {
  it("returns entries normally for a queryable locality", async () => {
    const entries = await loadLocalityEntries(async () => []);
    expect(entries).toEqual({ entries: [], scopeTooWide: false });
  });

  it("distinguishes an oversized locality from a genuinely empty place", async () => {
    await expect(
      loadLocalityEntries(async () => {
        throw new DataError("SCOPE_TOO_WIDE");
      }),
    ).resolves.toEqual({ entries: [], scopeTooWide: true });
  });

  it("recognises a structured server error if the data boundary serialises it", async () => {
    const error = Object.assign(new Error("safe scope error"), { code: "SCOPE_TOO_WIDE" });
    await expect(loadLocalityEntries(async () => { throw error; })).resolves.toEqual({
      entries: [],
      scopeTooWide: true,
    });
  });

  it("continues to surface unrelated data errors", async () => {
    const failure = new DataError("DATA_UNAVAILABLE");
    await expect(loadLocalityEntries(async () => { throw failure; })).rejects.toBe(failure);
  });
});
