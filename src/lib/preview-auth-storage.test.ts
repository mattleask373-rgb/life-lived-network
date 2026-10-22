import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  readBrokerReply,
  safeReadStorage,
  safeRemoveStorage,
  safeWriteStorage,
} from "../integrations/supabase/previewAuthStorage";

const source = readFileSync(
  new URL("../integrations/supabase/previewAuthStorage.ts", import.meta.url),
  "utf8",
);

describe("preview auth broker reply validation", () => {
  it("accepts a well-formed reply for the exact request ID", () => {
    expect(
      readBrokerReply(
        { type: "lovable-preview-auth:result", requestId: "r-1", ok: true, value: "session" },
        "r-1",
      ),
    ).toEqual({ ok: true, value: "session" });
  });

  it("rejects truthy non-boolean success, wrong IDs, wrong types and malformed values", () => {
    const malformed = [
      { type: "lovable-preview-auth:result", requestId: "r-1", ok: "false", value: "session" },
      { type: "lovable-preview-auth:result", requestId: "other", ok: true, value: "session" },
      { type: "lovable-preview-auth:set", requestId: "r-1", ok: true, value: "session" },
      { type: "lovable-preview-auth:result", requestId: "r-1", ok: 1, value: "session" },
      { type: "lovable-preview-auth:result", requestId: "r-1", ok: true, value: 1 },
      { type: "lovable-preview-auth:result", requestId: "r-1", ok: true },
      null,
      "not an object",
    ];
    for (const value of malformed) expect(readBrokerReply(value, "r-1")).toBeNull();
  });

  it("accepts null as an explicit empty broker value", () => {
    expect(
      readBrokerReply(
        { type: "lovable-preview-auth:result", requestId: "r-1", ok: true, value: null },
        "r-1",
      ),
    ).toEqual({ ok: true, value: null });
  });
});

describe("exception-safe local auth storage primitives", () => {
  it("contains storage method exceptions without leaking them into auth initialization", () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error("storage blocked");
      },
      setItem: () => {
        throw new Error("storage blocked");
      },
      removeItem: () => {
        throw new Error("storage blocked");
      },
    };
    expect(safeReadStorage(() => throwingStorage, "session")).toBeUndefined();
    expect(safeWriteStorage(() => throwingStorage, "session", "secret")).toBe(false);
    expect(safeRemoveStorage(() => throwingStorage, "session")).toBe(false);
  });

  it("also contains a throwing storage getter", () => {
    const unavailable = () => {
      throw new Error("localStorage getter blocked");
    };
    expect(safeReadStorage(unavailable, "session")).toBeUndefined();
    expect(safeWriteStorage(unavailable, "session", "secret")).toBe(false);
    expect(safeRemoveStorage(unavailable, "session")).toBe(false);
  });

  it("never accepts a same-origin response from a different WindowProxy", () => {
    expect(source).toContain("if (event.source !== parentWindow) return;");
    expect(source).toContain("if (!editorOrigins.includes(event.origin)) return;");
  });
});
