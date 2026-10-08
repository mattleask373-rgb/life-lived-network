import { describe, expect, it } from "vitest";
import { isHumanOnly, routeWork } from "./fleet-agent-lanes";

describe("fleet agent lanes", () => {
  it("routes fencing to Grok with ChatGPT collaborator", () => {
    const r = routeWork("control_plane_fencing");
    expect(r.primary).toBe("grok");
    expect(r.collaborators).toContain("chatgpt");
    expect(r.humanGate).toBe(false);
  });

  it("routes product UI to Lovable", () => {
    const r = routeWork("product_ui");
    expect(r.primary).toBe("lovable");
    expect(r.lane).toBe("LOVABLE_SURFACE");
  });

  it("marks merge/deploy/credentials as human-only", () => {
    expect(isHumanOnly("human_merge")).toBe(true);
    expect(isHumanOnly("human_deploy")).toBe(true);
    expect(isHumanOnly("human_credentials")).toBe(true);
    expect(isHumanOnly("product_api")).toBe(false);
  });

  it("keeps growth drafts human-gated for publish", () => {
    const r = routeWork("growth_draft");
    expect(r.humanGate).toBe(true);
    expect(r.autonomyCeiling).toBe("L1");
  });
});
