/**
 * Local supply acquisition opportunities.
 *
 * This is a planning boundary, not a provider finder or outreach engine.
 * It converts canonical supply-gap evidence into a reviewable opportunity
 * for legitimate provider acquisition.
 *
 * Invariants:
 * - consumes only classifySupplyGap() output;
 * - ZERO_SUPPLY means zero known canonical Living World supply, not real-world absence;
 * - UNKNOWN_LOCALITY never becomes an acquisition claim;
 * - no person/provider is inferred, ranked, searched or contacted;
 * - external outreach and production onboarding remain human-gated.
 */

import type { Need } from "./needs";
import type { SupplyGapResult, SupplyGapStatus } from "./supply-gap";

export type AcquisitionOpportunityStatus = "OPEN" | "REVIEW_REQUIRED" | "NOT_ACTIONABLE";

export type AcquisitionAction =
  | "provider_claim"
  | "provider_onboarding"
  | "community_invitation"
  | "evidence_review";

export interface AcquisitionOpportunity {
  id: string;
  localityId: string | null;
  localityResolved: boolean;
  category: string;
  needId: string;
  needTitle: string;
  gapStatus: SupplyGapStatus;
  status: AcquisitionOpportunityStatus;
  action: AcquisitionAction;
  reason: string;
  evidence: {
    strongCount: number;
    totalCount: number;
    canonicalAuthority: "findSupply";
  };
  humanGate: "REQUIRED";
}

/**
 * Build a deterministic acquisition opportunity from a need and canonical
 * supply-gap result. This function never discovers a provider.
 */
export function buildAcquisitionOpportunity(
  need: Pick<Need, "id" | "title" | "category" | "placeId">,
  gap: SupplyGapResult,
): AcquisitionOpportunity | null {
  if (gap.status === "SATISFIED") return null;

  const unknownLocality = gap.status === "UNKNOWN_LOCALITY";
  const action: AcquisitionAction = unknownLocality
    ? "evidence_review"
    : gap.status === "WEAK_SUPPLY"
      ? "provider_claim"
      : "provider_onboarding";

  const status: AcquisitionOpportunityStatus = unknownLocality
    ? "NOT_ACTIONABLE"
    : "REVIEW_REQUIRED";

  return {
    id: `acquisition:${need.id}:${gap.status.toLowerCase()}`,
    localityId: need.placeId,
    localityResolved: !unknownLocality,
    category: need.category,
    needId: need.id,
    needTitle: need.title,
    gapStatus: gap.status,
    status,
    action,
    reason: gap.reason,
    evidence: {
      strongCount: gap.strongCount,
      totalCount: gap.totalCount,
      canonicalAuthority: "findSupply",
    },
    humanGate: "REQUIRED",
  };
}
