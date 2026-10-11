import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildExport,
  memoryInput,
  memoryWhen,
  rowToMemory,
  sortMemories,
  type PlaceMemory,
} from "./memories";
import { PRIVATE_PATHS, PUBLIC_PATHS } from "./seo";

const PLACE = "11111111-1111-4111-8111-111111111111";

function m(partial: Partial<PlaceMemory>): PlaceMemory {
  return {
    id: crypto.randomUUID(),
    placeId: PLACE,
    startedOn: null,
    endedOn: null,
    note: "",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    place: null,
    ...partial,
  };
}

describe("memory input", () => {
  it("accepts a place with no dates and turns blanks into unknown", () => {
    const parsed = memoryInput.parse({ placeId: PLACE, startedOn: "", endedOn: "" });
    expect(parsed.startedOn).toBeNull();
    expect(parsed.endedOn).toBeNull();
    expect(parsed.note).toBe("");
  });
  it("rejects an end before the start", () => {
    expect(
      memoryInput.safeParse({ placeId: PLACE, startedOn: "2020-05-01", endedOn: "2019-01-01" })
        .success,
    ).toBe(false);
  });
  it("rejects a non-uuid place and an over-long note", () => {
    expect(memoryInput.safeParse({ placeId: "kings-heath" }).success).toBe(false);
    expect(memoryInput.safeParse({ placeId: PLACE, note: "x".repeat(2001) }).success).toBe(false);
  });
  it("has no field for visibility or owner, so a caller can't widen either", () => {
    const parsed = memoryInput.parse({
      placeId: PLACE,
      visibility: "public",
      userId: "someone-else",
    } as never);
    expect(parsed).not.toHaveProperty("visibility");
    expect(parsed).not.toHaveProperty("userId");
  });
});

describe("memory display", () => {
  it("says plainly when no dates were given", () => {
    expect(memoryWhen({ startedOn: null, endedOn: null })).toBe("No dates given");
    expect(memoryWhen({ startedOn: "2001-01-01", endedOn: null })).toBe("From 2001-01-01");
  });
  it("sorts newest first with undated last", () => {
    const out = sortMemories([
      m({ id: "a" }),
      m({ id: "b", startedOn: "1999-01-01" }),
      m({ id: "c", startedOn: "2010-01-01" }),
    ]);
    expect(out.map((x) => x.id)).toEqual(["c", "b", "a"]);
  });
  it("keeps a memory whose place vanished, without inventing one", () => {
    const row = rowToMemory({
      id: "x",
      place_id: PLACE,
      started_on: null,
      ended_on: null,
      note: "",
      created_at: "",
      updated_at: "",
      places: null,
    });
    expect(row.place).toBeNull();
  });
});

describe("export", () => {
  it("is labelled partial and lists only the sections it contains", () => {
    const out = buildExport("me", [{ name: "place_memories", rows: [{ id: 1 }] }]);
    expect(out.complete).toBe(false);
    expect(out.included).toEqual(["place_memories"]);
    expect(out.scopeNote).toMatch(/not a complete account export/);
  });
  it("reflects deletion: a deleted memory isn't in a later export", () => {
    const before = buildExport("me", [{ name: "place_memories", rows: [{ id: "a" }, { id: "b" }] }]);
    const after = buildExport("me", [{ name: "place_memories", rows: [{ id: "b" }] }]);
    expect(before.data["place_memories"]).toHaveLength(2);
    expect(after.data["place_memories"]).toEqual([{ id: "b" }]);
  });
});

describe("privacy boundaries", () => {
  it("never lists the memories page publicly", () => {
    expect(PRIVATE_PATHS).toContain("/memories");
    expect(PUBLIC_PATHS).not.toContain("/memories");
  });

  it("server actions all require sign-in and filter by the caller", () => {
    const src = readFileSync(join(__dirname, "memories.functions.ts"), "utf8");
    const fns = src.match(/createServerFn\(/g) ?? [];
    const auth = src.match(/middleware\(\[requireSupabaseAuth\]\)/g) ?? [];
    expect(fns.length).toBe(4);
    expect(auth.length).toBe(fns.length);
    expect(src).not.toMatch(/client\.server|supabaseAdmin/);
  });

  it("the database migration is owner-only with no anonymous access", () => {
    const dir = join(__dirname, "../../drizzle/migrations");
    const file = readdirSync(dir).find((f) => f.includes("place_memories"));
    expect(file).toBeTruthy();
    const sql = readFileSync(join(dir, file!), "utf8");
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/REVOKE ALL ON public\.place_memories FROM anon/);
    expect(sql).not.toMatch(/TO anon/);
    expect(sql).toMatch(/CHECK \(visibility = 'private'\)/);
    for (const op of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      expect(sql).toMatch(new RegExp(`FOR ${op} TO authenticated[\\s\\S]*?auth\\.uid\\(\\) = user_id`));
    }
  });
});
