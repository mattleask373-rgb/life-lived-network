import { describe, expect, it } from "vitest";
import { FLAGSHIP_STREAM_EXAMPLE, validateStreamKit } from "./fleet-stream-kit";

describe("stream kit", () => {
  it("accepts flagship example", () => {
    const v = validateStreamKit(FLAGSHIP_STREAM_EXAMPLE);
    expect(v.ok).toBe(true);
  });

  it("requires kill criteria and human gates", () => {
    const v = validateStreamKit({
      ...FLAGSHIP_STREAM_EXAMPLE,
      killCriteria: "",
      humanGates: ["merge"],
    });
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.errors.some((e) => e.includes("killCriteria"))).toBe(true);
      expect(v.errors.some((e) => e.includes("paid_spend"))).toBe(true);
    }
  });

  it("rejects L3 autonomy ceiling", () => {
    const v = validateStreamKit({
      ...FLAGSHIP_STREAM_EXAMPLE,
      autonomyCeiling: "L3" as "L2",
    });
    expect(v.ok).toBe(false);
  });
});
