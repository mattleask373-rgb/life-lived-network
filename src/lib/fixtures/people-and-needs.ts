/**
 * Deterministic people and needs, for development and tests only.
 *
 * These are not production data and are never mixed into real reads. They
 * exist so the honest cases — the stale profile, the private one, the
 * qualification nobody has checked — are testable rather than hypothetical.
 */

import type { Capability, ContributionKind, OpportunityPreference } from "../capability";
import type { Need } from "../needs";
import type { PersonCandidate } from "../supply-engine";

export const FIXTURE_NOW = "2026-03-05T09:00:00.000Z";

const BRIGHTON = "place-brighton";
const BRISTOL = "place-bristol";
const LISBON = "place-lisbon";
const BIRMINGHAM = "place-birmingham";
const KINGS_HEATH = "place-kings-heath";
const HEREFORDSHIRE = "place-herefordshire";
const HEREFORD = "place-hereford";

function capability(userId: string, label: string, over: Partial<Capability> = {}): Capability {
  return {
    id: `${userId}-${label.toLowerCase().replace(/\s+/g, "-")}`,
    userId,
    kind: "skill",
    label,
    level: "confident",
    evidence: "",
    verification: "self_stated",
    visibility: "local_discovery",
    lastConfirmedAt: "2026-02-20T09:00:00.000Z",
    issuingBody: "",
    obtainedOn: null,
    expiresOn: null,
    organisation: "",
    yearsExperience: null,
    startedOn: null,
    endedOn: null,
    ...over,
  };
}

interface FixturePerson extends PersonCandidate {
  contributions: ContributionKind[];
  earningPreference: "wants_paid" | "not_for_money" | "either" | "unstated";
}

function person(
  id: string,
  displayName: string,
  placeId: string,
  placeName: string,
  over: Partial<FixturePerson> = {},
): FixturePerson {
  return {
    id,
    displayName,
    placeId,
    placeName,
    capabilities: [],
    serviceAreaPlaceIds: [placeId],
    availability: [],
    preferences: [],
    wantsToLearn: [],
    contributions: [],
    earningPreference: "unstated",
    ...over,
  };
}

/** Sarah — cleans, in Brighton, weekends, occasionally wants paying. */
export const SARAH = person("sarah", "Sarah", BRIGHTON, "Brighton", {
  capabilities: [capability("sarah", "cleaning", { kind: "role", level: "years_of_it" })],
  availability: [
    { startsAt: "2026-03-07T09:00:00.000Z", endsAt: "2026-03-07T17:00:00.000Z" },
    { startsAt: "2026-03-08T09:00:00.000Z", endsAt: "2026-03-08T17:00:00.000Z" },
  ],
  preferences: ["paid_work", "one_off_work", "casual_work"] as OpportunityPreference[],
  contributions: ["time", "labour"],
  earningPreference: "wants_paid",
});

/** Alex — gardens, free on Thursday, happy either way. */
export const ALEX = person("alex", "Alex", BRIGHTON, "Brighton", {
  capabilities: [capability("alex", "gardening")],
  availability: [{ startsAt: "2026-03-12T10:00:00.000Z", endsAt: "2026-03-12T16:00:00.000Z" }],
  preferences: ["one_off_work", "community_projects", "helping_people"] as OpportunityPreference[],
  contributions: ["time", "skills", "tools"],
  earningPreference: "either",
});

/** Maria — a therapist. She says she's qualified. Nobody has checked it. */
export const MARIA = person("maria", "Maria", LISBON, "Lisbon", {
  capabilities: [
    capability("maria", "therapy and counselling registration", {
      kind: "qualification",
      level: "professional",
      verification: "self_stated",
      issuingBody: "Ordem dos Psicólogos (stated, not checked)",
      obtainedOn: "2018-06-01",
    }),
  ],
  preferences: ["professional_services"] as OpportunityPreference[],
  contributions: ["knowledge"],
  earningPreference: "wants_paid",
});

/** Daniel — gardens and photographs, travelling, opted into opportunities. */
export const DANIEL = person("daniel", "Daniel", LISBON, "Lisbon", {
  capabilities: [
    capability("daniel", "gardening"),
    capability("daniel", "photography", { kind: "skill" }),
  ],
  serviceAreaPlaceIds: [LISBON],
  travellingThroughPlaceIds: [BRIGHTON],
  preferences: ["travelling_opportunities", "skills_exchange"] as OpportunityPreference[],
  wantsToLearn: ["surfing"],
  contributions: ["skills", "creativity"],
  earningPreference: "either",
});

/** A profile nobody has touched in over a year, with expired availability. */
export const STALE = person("stale", "Tom", BRIGHTON, "Brighton", {
  capabilities: [capability("stale", "gardening", { lastConfirmedAt: "2024-01-05T09:00:00.000Z" })],
  availability: [{ startsAt: "2024-02-01T09:00:00.000Z", endsAt: "2024-02-01T17:00:00.000Z" }],
  preferences: ["paid_work"] as OpportunityPreference[],
});

/** Someone who keeps everything to themselves. */
export const PRIVATE_PERSON = person("private", "Someone", BRIGHTON, "Brighton", {
  capabilities: [capability("private", "cleaning", { visibility: "private" })],
  preferences: ["paid_work"] as OpportunityPreference[],
});

/**
 * Birmingham & Herefordshire — clearly labelled demonstration people.
 *
 * They exist to prove the geography rules across a real hierarchy: a
 * neighbourhood inside a city, and a city inside a county.
 */

/** Priya lives in King's Heath, which is inside Birmingham. */
export const PRIYA = person("priya", "Priya (demonstration)", KINGS_HEATH, "King's Heath", {
  capabilities: [capability("priya", "bicycle repair")],
  availability: [{ startsAt: "2026-03-14T09:00:00.000Z", endsAt: "2026-03-14T17:00:00.000Z" }],
  preferences: ["one_off_work", "helping_people"] as OpportunityPreference[],
  contributions: ["skills", "tools"],
  earningPreference: "either",
});

/** Owen is in Birmingham and says he covers the whole city. */
export const OWEN = person("owen", "Owen (demonstration)", BIRMINGHAM, "Birmingham", {
  capabilities: [capability("owen", "bicycle repair", { kind: "role", level: "years_of_it" })],
  serviceAreaPlaceIds: [BIRMINGHAM],
  availability: [{ startsAt: "2026-03-14T09:00:00.000Z", endsAt: "2026-03-14T17:00:00.000Z" }],
  preferences: ["paid_work", "one_off_work"] as OpportunityPreference[],
  contributions: ["skills"],
  earningPreference: "wants_paid",
});

/** Ruth lives in Herefordshire but has never said she covers Hereford itself. */
export const RUTH = person("ruth", "Ruth (demonstration)", HEREFORDSHIRE, "Herefordshire", {
  capabilities: [capability("ruth", "hedge laying")],
  serviceAreaPlaceIds: [],
  preferences: ["one_off_work"] as OpportunityPreference[],
  contributions: ["labour"],
  earningPreference: "either",
});

/** A bicycle to fix in King's Heath. */
export const KINGS_HEATH_BIKE_NEED = need("need-kings-heath-bike", {
  creatorId: "demo-asker-bham",
  category: "repair",
  title: "A bicycle that needs the gears sorting",
  intent: "help",
  placeId: KINGS_HEATH,
  placeText: "King's Heath, Birmingham",
  requiredSkills: ["bicycle repair"],
  startsAt: "2026-03-14T10:00:00.000Z",
  endsAt: "2026-03-14T12:00:00.000Z",
});

/** A hedge in Hereford, the city inside the county Ruth lives in. */
export const HEREFORD_HEDGE_NEED = need("need-hereford-hedge", {
  creatorId: "demo-asker-hereford",
  category: "gardening",
  title: "An old hedge that wants laying properly",
  intent: "help",
  placeId: HEREFORD,
  placeText: "Hereford",
  requiredSkills: ["hedge laying"],
});

export const FIXTURE_PEOPLE: FixturePerson[] = [
  SARAH,
  ALEX,
  MARIA,
  DANIEL,
  STALE,
  PRIVATE_PERSON,
  PRIYA,
  OWEN,
  RUTH,
];

function need(id: string, over: Partial<Need>): Need {
  return {
    id,
    creatorId: "asker",
    category: "help",
    title: "",
    description: "",
    intent: "help",
    placeId: BRIGHTON,
    placeText: "Brighton",
    lat: null,
    lng: null,
    timezone: "Europe/London",
    startsAt: null,
    endsAt: null,
    durationMinutes: 120,
    flexibility: "some",
    budget: null,
    budgetMax: null,
    currency: "GBP",
    paymentType: "unsure",
    paymentModel: "unknown",
    requiredSkills: [],
    requiredRoles: [],
    requiredQualifications: [],
    preferredExperience: "",
    lastConfirmedAt: "2026-03-01T09:00:00.000Z",
    recurring: false,
    urgency: "soon",
    contactPreference: "in_app",
    visibility: "local_discovery",
    status: "open",
    expiresAt: null,
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-01T09:00:00.000Z",
    ...over,
  };
}

/** A community garden needing hands on a Thursday. */
export const COMMUNITY_GARDEN_NEED = need("need-garden", {
  creatorId: "garden",
  category: "gardening",
  title: "Hands needed at the community garden",
  intent: "community_project",
  paymentType: "contribution",
  paymentModel: "unpaid",
  requiredSkills: ["gardening"],
  startsAt: "2026-03-12T10:00:00.000Z",
  endsAt: "2026-03-12T14:00:00.000Z",
});

/** Recurring paid cleaning, in Bristol — not where Sarah works. */
export const BRISTOL_CLEANING_NEED = need("need-bristol-clean", {
  creatorId: "landlord",
  category: "cleaning",
  title: "Weekly clean of a flat",
  intent: "recurring_work",
  placeId: BRISTOL,
  placeText: "Bristol",
  recurring: true,
  paymentType: "paid",
  paymentModel: "fixed",
  budget: 60,
  requiredRoles: ["cleaner"],
  requiredSkills: ["cleaning"],
  startsAt: "2026-03-07T09:00:00.000Z",
  endsAt: "2026-03-07T12:00:00.000Z",
});

/** The changeover clean, in Brighton, on a weekend Sarah said she's free. */
export const BRIGHTON_CHANGEOVER_NEED = need("need-changeover", {
  creatorId: "host",
  category: "cleaning",
  title: "Changeover clean between guests",
  intent: "one_off_work",
  paymentType: "paid",
  paymentModel: "fixed",
  budget: 45,
  requiredSkills: ["cleaning"],
  startsAt: "2026-03-07T11:00:00.000Z",
  endsAt: "2026-03-07T14:00:00.000Z",
});

/** A swap: photography for Portuguese. */
export const SWAP_NEED = need("need-swap", {
  creatorId: "swapper",
  category: "photography",
  title: "Photos of my market stall, in exchange for Portuguese lessons",
  intent: "skills_exchange",
  placeId: LISBON,
  placeText: "Lisbon",
  paymentType: "exchange",
  paymentModel: "exchange",
  requiredSkills: ["photography"],
});

/** Somebody's private note to themselves. Nothing should surface it. */
export const PRIVATE_NEED = need("need-private", {
  creatorId: "quiet",
  category: "cleaning",
  title: "Clean before my mother visits",
  visibility: "private",
  requiredSkills: ["cleaning"],
});

/** Regulated: nobody is implied to be allowed to do this. */
export const THERAPY_NEED = need("need-therapy", {
  creatorId: "asker",
  category: "therapy",
  title: "Looking for counselling",
  intent: "professional_service",
  placeId: LISBON,
  placeText: "Lisbon",
  paymentType: "paid",
  paymentModel: "ask_them",
  requiredSkills: ["therapy"],
  requiredQualifications: ["counselling registration"],
});

export const FIXTURE_NEEDS: Need[] = [
  COMMUNITY_GARDEN_NEED,
  BRISTOL_CLEANING_NEED,
  BRIGHTON_CHANGEOVER_NEED,
  SWAP_NEED,
  PRIVATE_NEED,
  THERAPY_NEED,
  KINGS_HEATH_BIKE_NEED,
  HEREFORD_HEDGE_NEED,
];
