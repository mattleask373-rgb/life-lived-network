/**
 * Bounded growth intelligence vocabulary.
 *
 * A GrowthOpportunity is an observation/proposal, not permission to publish,
 * spend money, contact people, or change production.
 */

export type GrowthOpportunityType =
  | "SEO" | "LOCAL_PAGE" | "CONTENT" | "PARTNERSHIP" | "API"
  | "REFERRAL" | "AFFILIATE" | "INTEGRATION" | "COMMUNITY" | "PRODUCT"
  | "CONVERSION" | "RETENTION" | "LOCALITY_EXPANSION"
  | "SUPPLY_ACQUISITION" | "DEMAND_ACQUISITION";

export type GrowthOpportunityStatus =
  | "PROPOSED" | "READY" | "IN_PROGRESS" | "BLOCKED" | "NEEDS_REVIEW"
  | "VERIFIED" | "HUMAN_GATE" | "REJECTED" | "DONE";

export interface GrowthOpportunity {
  id: string;
  type: GrowthOpportunityType;
  status: GrowthOpportunityStatus;
  title: string;
  evidence: string[];
  localityId?: string | null;
  category?: string | null;
  audience?: string | null;
  estimatedReach?: number | null;
  estimatedValue?: number | null;
  confidence: "high" | "supported" | "unknown";
  effort: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  networkEffectPotential: "low" | "medium" | "high";
  suggestedAction: string;
  autonomyLevel: 0 | 1 | 2 | 3 | 4 | 5;
}

export type GrowthPriority = "P0" | "P1" | "P2" | "P3";

export function growthPriority(opportunity: GrowthOpportunity): GrowthPriority {
  if (opportunity.status === "BLOCKED" || opportunity.status === "REJECTED") return "P3";
  if (opportunity.autonomyLevel >= 4 || opportunity.risk === "high") return "P2";
  if (
    opportunity.confidence === "high" &&
    opportunity.effort === "low" &&
    opportunity.risk === "low" &&
    opportunity.networkEffectPotential === "high"
  ) return "P0";
  if (
    opportunity.confidence !== "unknown" &&
    opportunity.effort !== "high" &&
    opportunity.risk !== "high"
  ) return "P1";
  return "P2";
}
