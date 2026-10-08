import { describe, expect, it } from "vitest";
import { createHandoffPacket, formatHandoffMarkdown } from "./fleet-handoff-packet";

describe("handoff packet", () => {
  it("formats a cross-agent handoff without claiming LIVE", () => {
    const p = createHandoffPacket({
      from: "grok",
      to: "chatgpt",
      lane: "CONTROL_PLANE",
      workClass: "control_plane_identity",
      title: "Run bootstrap pure policy",
      whatChanged: "decideRunBootstrap rejects forged actor",
      capabilityDelta: "Session actor required; unproven project HOLDs",
      state: "IMPLEMENTED",
      branch: "authenticated-run-bootstrap",
      tests: "unit pass locally designed",
      ci: "no green claimed",
      hosted: "PENDING",
      safetyDoesNotGrant: "merge, deploy, LIVE, invented tenants",
      remainingGates: ["project authority", "#72 lockfile"],
      nextSafeMove: "Wire server adapter only after scope proven",
      avoidDuplicating: ["phase10-12 result fencing"],
    });
    const md = formatHandoffMarkdown(p);
    expect(md).toContain("IMPLEMENTED");
    expect(md).not.toContain("production LIVE");
    expect(p.state).not.toBe("LIVE");
  });
});
