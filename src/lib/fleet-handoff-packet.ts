/**
 * Standard handoff packet between Grok, ChatGPT, Lovable, and humans.
 * Keeps continuity without claiming LIVE or fabricating evidence.
 */

import type { AgentActor, AgentLane, WorkClass } from "./fleet-agent-lanes";

export type CapabilityState =
  | "DESIGN"
  | "IMPLEMENTED"
  | "CI_VERIFIED"
  | "HOSTED_VERIFIED"
  | "REVIEWED"
  | "INTEGRATED"
  | "LIVE";

export type HandoffPacket = Readonly<{
  id: string;
  from: AgentActor;
  to: AgentActor;
  lane: AgentLane;
  workClass: WorkClass;
  title: string;
  whatChanged: string;
  capabilityDelta: string;
  state: CapabilityState;
  branch?: string;
  prUrl?: string;
  tests: string;
  ci: string;
  hosted: string;
  safetyDoesNotGrant: string;
  remainingGates: readonly string[];
  nextSafeMove: string;
  avoidDuplicating: readonly string[];
  producedAt: string;
}>;

export function createHandoffPacket(
  partial: Omit<HandoffPacket, "producedAt" | "id"> & { id?: string },
): HandoffPacket {
  return {
    id: partial.id ?? `handoff-${Date.now()}`,
    from: partial.from,
    to: partial.to,
    lane: partial.lane,
    workClass: partial.workClass,
    title: partial.title,
    whatChanged: partial.whatChanged,
    capabilityDelta: partial.capabilityDelta,
    state: partial.state,
    branch: partial.branch,
    prUrl: partial.prUrl,
    tests: partial.tests,
    ci: partial.ci,
    hosted: partial.hosted,
    safetyDoesNotGrant: partial.safetyDoesNotGrant,
    remainingGates: partial.remainingGates,
    nextSafeMove: partial.nextSafeMove,
    avoidDuplicating: partial.avoidDuplicating,
    producedAt: new Date().toISOString(),
  };
}

export function formatHandoffMarkdown(p: HandoffPacket): string {
  return [
    `## Handoff: ${p.title}`,
    ``,
    `- **From → To:** ${p.from} → ${p.to}`,
    `- **Lane / class:** ${p.lane} / ${p.workClass}`,
    `- **State:** ${p.state} (not collapsed)`,
    p.branch ? `- **Branch:** \`${p.branch}\`` : null,
    p.prUrl ? `- **PR:** ${p.prUrl}` : null,
    ``,
    `### What changed`,
    p.whatChanged,
    ``,
    `### Capability delta`,
    p.capabilityDelta,
    ``,
    `### Evidence`,
    `- Tests: ${p.tests}`,
    `- CI: ${p.ci}`,
    `- Hosted: ${p.hosted}`,
    ``,
    `### Safety (does NOT grant)`,
    p.safetyDoesNotGrant,
    ``,
    `### Remaining gates`,
    ...p.remainingGates.map((g) => `- ${g}`),
    ``,
    `### Avoid duplicating`,
    ...p.avoidDuplicating.map((a) => `- ${a}`),
    ``,
    `### Next safe move`,
    p.nextSafeMove,
    ``,
    `_Produced ${p.producedAt}_`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
