/**
 * Stable Possibility Contract.
 *
 * This is the only presentation boundary for possibility results.
 * UI code may render this contract, but must not infer matching semantics
 * from raw people, needs, capabilities, journeys, or listings.
 *
 * WHO → WHAT → WHERE → WHEN → WHY → UNKNOWN → ACTION
 *
 * Every field is derived from the canonical deterministic supply engine.
 * Unknown stays unknown; this adapter never upgrades missing facts into yes.
 */

import type { SupplyBand, SupplyResult } from "./supply-engine";

export const POSSIBILITY_CONTRACT_VERSION = "1.0";

export type PossibilitySubjectKind = "person" | "community" | "listing";

export type PossibilityEvidenceState = "known" | "unknown";

export type PossibilityWhereRelation =
  | "service_area"
  | "journey"
  | "listing_place"
  | "community_place"
  | "unknown";

export type PossibilityAction =
  | "contact"
  | "save"
  | "go"
  | "join"
  | "view";

export interface PossibilityWho {
  kind: PossibilitySubjectKind;
  id: string;
  label: string;
}

export interface PossibilityWhat {
  label: string;
  supplyType: SupplyResult["supplyType"];
  band: SupplyBand;
}

export interface PossibilityWhere {
  label: string;
  relation: PossibilityWhereRelation;
  /** Deliberately no live-coordinate or inferred-location field. */
  evidence: PossibilityEvidenceState;
}

export interface PossibilityWhen {
  label: string;
  evidence: PossibilityEvidenceState;
}

export interface PossibilityWhy {
  band: SupplyBand;
  facts: string[];
}

export interface PossibilityActionItem {
  type: PossibilityAction;
  label: string;
}

export interface PossibilityContract {
  contractVersion: typeof POSSIBILITY_CONTRACT_VERSION;
  id: string;
  who: PossibilityWho;
  what: PossibilityWhat;
  where: PossibilityWhere;
  when: PossibilityWhen;
  why: PossibilityWhy;
  unknown: string[];
  actions: PossibilityActionItem[];
  caveat: string;
  status: SupplyResult["status"];
  confidence: SupplyResult["confidence"];
  freshness: SupplyResult["freshness"];
  trust: SupplyResult["trust"];
  provenance: SupplyResult["provenance"];
}

function subjectFor(result: SupplyResult): PossibilityWho {
  if (result.personId) {
    return {
      kind: "person",
      id: result.personId,
      label: result.title,
    };
  }

  if (result.band === "community") {
    return { kind: "community", id: result.id, label: result.title };
  }

  return { kind: "listing", id: result.id, label: result.title };
}

function whereRelationFor(result: SupplyResult): PossibilityWhereRelation {
  if (result.band === "journey") return "journey";
  if (result.band === "community") return "community_place";
  if (result.personId) return "service_area";
  return "listing_place";
}

function whenEvidenceFor(result: SupplyResult): PossibilityEvidenceState {
  return result.evidence?.unknown.some((item) => /availability/i.test(item))
    ? "unknown"
    : "known";
}

/**
 * Convert one canonical engine result into the stable UI contract.
 *
 * No matching occurs here. No raw domain entity is accepted deliberately:
 * the adapter cannot become a second matcher by accident.
 */
export function toPossibilityContract(result: SupplyResult): PossibilityContract {
  const unknown = [...(result.evidence?.unknown ?? [])];

  return {
    contractVersion: POSSIBILITY_CONTRACT_VERSION,
    id: result.id,
    who: subjectFor(result),
    what: {
      label: result.what,
      supplyType: result.supplyType,
      band: result.band,
    },
    where: {
      label: result.where,
      relation: whereRelationFor(result),
      evidence: result.where ? "known" : "unknown",
    },
    when: {
      label: result.when,
      evidence: whenEvidenceFor(result),
    },
    why: {
      band: result.band,
      facts: [...result.why],
    },
    unknown,
    actions: result.actions.map((type) => ({
      type,
      label: actionLabel(type),
    })),
    caveat: result.caveat,
    status: result.status,
    confidence: result.confidence,
    freshness: result.freshness,
    trust: result.trust,
    provenance: result.provenance,
  };
}

function actionLabel(action: PossibilityAction): string {
  switch (action) {
    case "contact":
      return "Contact";
    case "save":
      return "Save";
    case "go":
      return "Go";
    case "join":
      return "Join";
    case "view":
      return "View";
  }
}

export function toPossibilityContracts(results: SupplyResult[]): PossibilityContract[] {
  return results.map(toPossibilityContract);
}
