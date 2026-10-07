/**
 * Organisational memory — durable records distinct from chat history.
 * Conversation is never authoritative alone.
 */

import type { EvidenceConfidence } from "./agent-research-contract";

export type MemoryKind =
  | "architecture_decision"
  | "product_decision"
  | "research_finding"
  | "verified_fact"
  | "rejected_hypothesis"
  | "known_risk"
  | "recurring_failure"
  | "provider_performance"
  | "agent_performance"
  | "project_convention"
  | "experiment_result"
  | "unresolved_question"
  | "technical_debt"
  | "operational_lesson"
  | "handoff";

export interface OrgMemoryRecord {
  id: string;
  projectId: string;
  kind: MemoryKind;
  statement: string;
  confidence: EvidenceConfidence;
  evidenceRefs: string[];
  decidedBy?: string;
  createdAt: string;
  tags: string[];
}

export function createMemoryRecord(
  input: Omit<OrgMemoryRecord, "createdAt"> & { createdAt?: string },
): OrgMemoryRecord {
  if (input.confidence === "UNKNOWN" && input.kind === "verified_fact") {
    throw new Error("UNKNOWN cannot be stored as verified_fact");
  }
  return {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function isAuthoritativeMemory(record: OrgMemoryRecord): boolean {
  return (
    record.confidence === "KNOWN" &&
    (record.kind === "architecture_decision" ||
      record.kind === "product_decision" ||
      record.kind === "verified_fact")
  );
}
