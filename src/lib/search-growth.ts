export type SearchIntentFamily =
  | "whats_on"
  | "things_to_do"
  | "local_service"
  | "jobs"
  | "class_experience"
  | "community"
  | "journey"
  | "time_specific"
  | "help"
  | "unknown";

export type SearchDemandEvidence = {
  source: string;
  observedAt: string;
  confidence: number;
  notes?: string;
};

export type SearchOpportunity = {
  localityId: string;
  localitySlug: string;
  intentFamily: SearchIntentFamily;
  normalizedQuery: string;
  evidence: SearchDemandEvidence[];
  realWorldEvidenceCount: number;
  actionability: "high" | "medium" | "low" | "unknown";
  indexability: "indexable_candidate" | "needs_evidence" | "noindex_candidate";
  reason: string;
};

export function searchOpportunity(
  input: Omit<SearchOpportunity, "indexability" | "reason">,
): SearchOpportunity {
  if (!input.localityId || !input.localitySlug) {
    return {
      ...input,
      indexability: "noindex_candidate",
      reason: "A publishable local surface requires a canonical locality.",
    };
  }

  if (input.realWorldEvidenceCount <= 0) {
    return {
      ...input,
      indexability: "needs_evidence",
      reason: "Search demand without real-world evidence must not become a thin or fabricated page.",
    };
  }

  if (input.actionability === "low" || input.actionability === "unknown") {
    return {
      ...input,
      indexability: "needs_evidence",
      reason: "A local discovery surface should provide a meaningful, evidence-backed next action.",
    };
  }

  return {
    ...input,
    indexability: "indexable_candidate",
    reason: "Demand evidence, locality, real-world evidence and actionability are present; final publication still requires the existing local-page quality gate.",
  };
}
