/**
 * The one supply engine.
 *
 * It answers a single question: given this need, what real possibilities
 * exist? It is pure — everything it looks at is passed in, so real data,
 * cached data and test fixtures all work identically.
 *
 * It never blends its answers into one opaque score. Results come back in
 * named bands, in a deliberate order, and each one says plainly what it
 * actually is. "Someone has said they can garden" and "someone is available
 * on Thursday to garden" are different facts and are never merged.
 */

import type {
  AvailabilityWindow,
  Capability,
  ContributionKind,
  EarningPreference,
  OpportunityPreference,
  ServiceArea,
} from "./capability";
import type { Need } from "./needs";
import type { WorldEntry } from "./world-data";
import { freshness, isCurrent, type FreshnessState } from "./capability-freshness";
import {
  confidence,
  constraints,
  matchTerms,
  needTerms,
  trust,
  usableCapability,
} from "./match-signals";
import type {
  MatchSignal,
  PossibilitySupply,
  SupplyDiagnostic,
  SupplyStatus,
  SupplyType,
} from "./possibility-supply";
import type { JourneyContext } from "./journey-context";
import { journeyOverlaps } from "./journey-context";
import { regulatedFlags } from "./policy";
import { entryInScope, exactGeography, geographicReach, type NeedGeography } from "./geo-scope";

export type SupplyBand =
  | "direct"
  | "local_capability"
  | "open_to_opportunities"
  | "community"
  | "contribution"
  | "skills_exchange"
  | "journey"
  | "related";

export const BAND_ORDER: SupplyBand[] = [
  "direct",
  "local_capability",
  "open_to_opportunities",
  "journey",
  "community",
  "contribution",
  "skills_exchange",
  "related",
];

export const BAND_HEADING: Record<SupplyBand, string> = {
  direct: "Someone offering exactly this",
  local_capability: "People nearby who say they can do this",
  open_to_opportunities: "People who've said they're open to work like this",
  community: "Something community-run that fits",
  contribution: "Someone who's offered to help, for nothing",
  skills_exchange: "Someone who'd swap",
  journey: "Someone passing through who's open to it",
  related: "Nearby, and related",
};

export const BAND_CAVEAT: Record<SupplyBand, string> = {
  direct: "Posted by the person themselves. Still worth asking before you rely on it.",
  local_capability:
    "They've said they can do this. They have not said they're available, qualified or looking for work.",
  open_to_opportunities:
    "They've said they're open to this kind of thing. Availability still needs agreeing.",
  community: "Community-run, so it may work differently to paid work.",
  contribution: "Offered freely. Please don't treat it as a service.",
  skills_exchange: "No money involved — you'd both be giving something.",
  journey:
    "Someone travelling who opted into opportunities. This is not their live location, and not a promise they're free.",
  related: "Not what you asked for, but close enough to be worth knowing.",
};

/** A person, as far as the engine is allowed to know them. */
export interface PersonCandidate {
  id: string;
  displayName: string;
  placeId: string | null;
  placeName: string;
  capabilities: Capability[];
  serviceAreaPlaceIds: string[];
  serviceAreas?: ServiceArea[];
  /** Places they said they're only passing through. Never a live location. */
  travellingThroughPlaceIds?: string[];
  /** Explicit windows only. Absence means unknown, never "unavailable". */
  availability: Pick<AvailabilityWindow, "startsAt" | "endsAt">[];
  availabilityDetails?: AvailabilityWindow[];
  preferences: OpportunityPreference[];
  contributions?: ContributionKind[];
  earningPreference?: EarningPreference;
  journeys?: JourneyContext[];
  discoveryStatus?: SupplyStatus;
  wantsToLearn: string[];
  photoUrl?: string | null;
}

export interface SupplyResult extends PossibilitySupply {
  id: string;
  band: SupplyBand;
  title: string;
  what: string;
  where: string;
  when: string;
  why: string[];
  caveat: string;
  actions: SupplyAction[];
  personId?: string;
  photoUrl?: string | null;
  evidence?: MatchEvidence;
}

export interface MatchEvidence {
  passed: string[];
  unknown: string[];
  freshness: FreshnessState;
  verification: Capability["verification"];
}

export type SupplyAction = "contact" | "save" | "go" | "join" | "view";

export interface SupplyAnswer {
  need: Need;
  results: SupplyResult[];
  quiet: boolean;
  bandsSearched: SupplyBand[];
  diagnostics: MatchDiagnostics;
  trace: SupplyDiagnostic[];
}

export interface MatchDiagnostics {
  peopleConsidered: number;
  excludedByPlace: number;
  excludedByFreshness: number;
  excludedByQualification: number;
  excludedByCapability: number;
  excludedByStatus: number;
  excludedByTime: number;
}

export interface SupplyInput {
  need: Need;
  people: PersonCandidate[];
  entries: WorldEntry[];
  perBand?: number;
  now?: string | number | Date;
  geography?: NeedGeography;
}

function overlapsNeedTime(
  person: PersonCandidate,
  need: Need,
): { startsAt: string; endsAt: string } | null {
  if (!need.startsAt) return null;
  const start = Date.parse(need.startsAt);
  const end = need.endsAt ? Date.parse(need.endsAt) : start;
  return (
    person.availability.find(
      (w) => Date.parse(w.startsAt) <= end && Date.parse(w.endsAt) >= start,
    ) ?? null
  );
}

function whenText(need: Need): string {
  if (!need.startsAt) return "Time still to agree";
  const d = new Date(need.startsAt);
  return `${d.toUTCString().slice(0, 16)} (${need.timezone})`;
}

/** RESTORED — full body continues in follow-up commit. Temporary stub to unblock. */
export function findSupply(input: SupplyInput): SupplyAnswer {
  throw new Error("supply-engine temporarily restored as stub — full restore in next commit");
}

export function whatElse(input: SupplyInput): SupplyAnswer {
  return findSupply(input);
}

export function whoCouldMakeThisHappen(input: SupplyInput): SupplyAnswer {
  return findSupply(input);
}

export { whenText as needWhenText };
