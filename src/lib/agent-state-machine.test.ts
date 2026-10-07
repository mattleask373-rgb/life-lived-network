import { describe, expect, it } from "vitest";

import {
  allowedDestinations,
  evaluateTransition,
  LEGAL_TRANSITIONS,
  providerOutcomeToTransition,
} from "./agent-state-machine";

describe("authoritative state machine", () => {
  it("happy path CLAIMED → IN_PROGRESS → VERIFYING → REVIEW is owner-driven until review", () => {
    const owner = "grok";
    const base = { actorId: owner, owner, leaseValid: true };

    expect(
      evaluateTransition({ ...base, from: "CLAIMED", to: "IN_PROGRESS" }).allowed,
    ).toBe(true);
    expect(evaluateTransition({ ...base, from: "IN_PROGRESS", to: "VERIFYING" }).allowed).toBe(true);
    expect(evaluateTransition({ ...base, from: "VERIFYING", to: "REVIEW" }).allowed).toBe(true);
  });

  it("forbids implementer from accepting own work (REVIEW → ACCEPTED)", () => {
    const decision = evaluateTransition({
      from: "REVIEW",
      to: "ACCEPTED",
      actorId: "grok",
      owner: "grok",
      leaseValid: false,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/self-approval/);
  });

  it("allows independent reviewer to ACCEPTED", () => {
    const decision = evaluateTransition({
      from: "REVIEW",
      to: "ACCEPTED",
      actorId: "chatgpt",
      owner: "grok",
      leaseValid: false,
      reviewerId: "chatgpt",
    });
    expect(decision.allowed).toBe(true);
  });

  it("INTEGRATED is human-only", () => {
    expect(
      evaluateTransition({
        from: "ACCEPTED",
        to: "INTEGRATED",
        actorId: "grok",
        owner: "grok",
        leaseValid: false,
      }).allowed,
    ).toBe(false);

    expect(
      evaluateTransition({
        from: "ACCEPTED",
        to: "INTEGRATED",
        actorId: "human",
        owner: "grok",
        leaseValid: false,
      }).allowed,
    ).toBe(true);

    expect(
      evaluateTransition({
        from: "ACCEPTED",
        to: "INTEGRATED",
        actorId: "human:matt",
        owner: "grok",
        leaseValid: false,
      }).allowed,
    ).toBe(true);
  });

  it("rejects transitions that skip states or go backwards on the happy path", () => {
    expect(
      evaluateTransition({
        from: "CLAIMED",
        to: "REVIEW",
        actorId: "grok",
        owner: "grok",
        leaseValid: true,
      }).allowed,
    ).toBe(false);

    expect(
      evaluateTransition({
        from: "READY",
        to: "IN_PROGRESS",
        actorId: "grok",
        owner: null,
        leaseValid: false,
      }).allowed,
    ).toBe(false);

    expect(
      evaluateTransition({
        from: "IN_PROGRESS",
        to: "ACCEPTED",
        actorId: "chatgpt",
        owner: "grok",
        leaseValid: true,
      }).allowed,
    ).toBe(false);
  });

  it("requires live lease for owner-driven active transitions", () => {
    const decision = evaluateTransition({
      from: "IN_PROGRESS",
      to: "VERIFYING",
      actorId: "grok",
      owner: "grok",
      leaseValid: false,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/live lease/);
  });

  it("CHANGES_REQUESTED → IN_PROGRESS allowed without prior live lease (lease renews)", () => {
    const decision = evaluateTransition({
      from: "CHANGES_REQUESTED",
      to: "IN_PROGRESS",
      actorId: "grok",
      owner: "grok",
      leaseValid: false,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.rule?.renewsLease).toBe(true);
  });

  it("rejects non-owner attempting owner transitions", () => {
    const decision = evaluateTransition({
      from: "CLAIMED",
      to: "IN_PROGRESS",
      actorId: "chatgpt",
      owner: "grok",
      leaseValid: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not the current owner/);
  });

  it("REVIEW → CHANGES_REQUESTED requires non-owner reviewer", () => {
    expect(
      evaluateTransition({
        from: "REVIEW",
        to: "CHANGES_REQUESTED",
        actorId: "grok",
        owner: "grok",
        leaseValid: false,
      }).allowed,
    ).toBe(false);

    expect(
      evaluateTransition({
        from: "REVIEW",
        to: "CHANGES_REQUESTED",
        actorId: "chatgpt",
        owner: "grok",
        leaseValid: false,
      }).allowed,
    ).toBe(true);
  });

  it("provider outcomes never map to ACCEPTED or INTEGRATED", () => {
    for (const outcome of [
      "VERIFYING",
      "BLOCKED",
      "CHANGES_REQUESTED",
      "FAILED",
      "PARTIAL",
    ] as const) {
      const dest = providerOutcomeToTransition(outcome, "IN_PROGRESS");
      expect(dest).not.toBe("ACCEPTED");
      expect(dest).not.toBe("INTEGRATED");
      expect(dest).not.toBe("DONE");
    }
  });

  it("enumerates destinations consistently with LEGAL_TRANSITIONS", () => {
    const fromReview = allowedDestinations("REVIEW");
    expect(fromReview).toContain("ACCEPTED");
    expect(fromReview).toContain("CHANGES_REQUESTED");
    expect(fromReview).not.toContain("INTEGRATED");

    const keys = LEGAL_TRANSITIONS.map((r) => `${r.from}->${r.to}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("system can mark STALE; agents cannot self-STALE as a shortcut", () => {
    expect(
      evaluateTransition({
        from: "IN_PROGRESS",
        to: "STALE",
        actorId: "grok",
        owner: "grok",
        leaseValid: false,
      }).allowed,
    ).toBe(false);

    expect(
      evaluateTransition({
        from: "IN_PROGRESS",
        to: "STALE",
        actorId: "system",
        owner: "grok",
        leaseValid: false,
      }).allowed,
    ).toBe(true);
  });
});
