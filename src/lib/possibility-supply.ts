import type { FreshnessState } from "./capability-freshness";
import type { DiscoveryContext } from "./data/contract";
import type { JourneyContext } from "./journey-context";
import type { Need } from "./needs";

export type SupplyType =
  "DIRECT" | "LATENT" | "JOURNEY" | "COMMUNITY" | "SKILLS_EXCHANGE" | "CONTRIBUTION" | "RELATED";
export type SupplyStatus = "ACTIVE" | "STALE" | "EXPIRED" | "REPORTED";
export type MatchSignalKind =
  | "intent"
  | "skill"
  | "category"
  | "locality"
  | "service_area"
  | "time"
  | "availability"
  | "journey"
  | "route"
  | "earning"
  | "contribution"
  | "community"
  | "freshness"
  | "trust";
export type SignalStrength = "required" | "supporting" | "unknown";

export interface MatchSignal {
  kind: MatchSignalKind;
  strength: SignalStrength;
  reason: string;
}
export interface SupplyConstraint {
  kind: string;
  state: "passed" | "unknown" | "blocked";
  reason: string;
}
export interface SupplyProvenance {
  origin: "person" | "community" | "internal_listing" | "fixture";
  label: string;
  sourceId?: string;
}
export interface SupplyTrust {
  verification: string;
  label: string;
  reviewed: boolean;
}
export interface SupplyConfidence {
  level: "strong" | "supported" | "possible";
  basis: string[];
}
export interface SupplyDiagnostic {
  candidateId: string;
  outcome: "included" | "excluded";
  reasonCodes: string[];
}

export interface PossibilitySupply {
  supplyType: SupplyType;
  status: SupplyStatus;
  signals: MatchSignal[];
  reasons: string[];
  confidence: SupplyConfidence;
  freshness: FreshnessState;
  trust: SupplyTrust;
  provenance: SupplyProvenance;
  constraints: SupplyConstraint[];
}

export interface SupplyQuery {
  need: Need;
  context: DiscoveryContext;
  journey?: JourneyContext | null;
  mode?: "DEFAULT" | "WHAT_ELSE" | "WHO_COULD_MAKE_THIS_HAPPEN";
}
