/**
 * Deterministic fixtures. No live API ever touches a test.
 */

import type { Need } from "../needs";
import type { PersonCandidate } from "../supply-engine";
import type { WorldEntry } from "../world-data";

export const PLACE_KINGS_HEATH = "11111111-1111-1111-1111-111111111111";
export const PLACE_ELSEWHERE = "22222222-2222-2222-2222-222222222222";

export const gardenerNeed: Need = {
  id: "need-1",
  creatorId: "matt",
  category: "gardening",
  title: "Gardener for an overgrown back garden",
  description: "Hedge and brambles, two hours' work.",
  intent: "paid_work",
  placeId: PLACE_KINGS_HEATH,
  placeText: "Kings Heath",
  lat: 52.43,
  lng: -1.89,
  timezone: "Europe/London",
  startsAt: "2026-09-24T09:00:00.000Z",
  endsAt: "2026-09-24T12:00:00.000Z",
  durationMinutes: 120,
  flexibility: "some",
  budget: 60,
  currency: "GBP",
  paymentType: "paid",
  paymentModel: "fixed",
  budgetMax: null,
  requiredSkills: ["gardening"],
  requiredRoles: ["gardener"],
  requiredQualifications: [],
  preferredExperience: "",
  lastConfirmedAt: "2026-09-19T09:00:00.000Z",
  recurring: false,
  urgency: "soon",
  contactPreference: "in_app",
  visibility: "local_discovery",
  status: "open",
  expiresAt: null,
  createdAt: "2026-09-19T09:00:00.000Z",
  updatedAt: "2026-09-19T09:00:00.000Z",
};

export const cleanerNeed: Need = {
  ...gardenerNeed,
  id: "need-2",
  category: "cleaning",
  title: "Cleaner for a holiday let changeover",
  requiredSkills: ["cleaning"],
  placeText: "Bristol",
};

export const contributionNeed: Need = {
  ...gardenerNeed,
  id: "need-3",
  intent: "community_project",
  paymentType: "contribution",
  budget: null,
};

function person(over: Partial<PersonCandidate> & { id: string }): PersonCandidate {
  return {
    displayName: over.id,
    placeId: PLACE_KINGS_HEATH,
    placeName: "Kings Heath",
    capabilities: [],
    serviceAreaPlaceIds: [PLACE_KINGS_HEATH],
    availability: [],
    preferences: [],
    wantsToLearn: [],
    ...over,
  };
}

function capability(label: string, over: Partial<PersonCandidate["capabilities"][number]> = {}) {
  return {
    id: `cap-${label}`,
    userId: "x",
    kind: "skill" as const,
    label,
    level: "confident" as const,
    evidence: "",
    verification: "self_stated" as const,
    visibility: "local_discovery" as const,
    lastConfirmedAt: "2026-09-19T09:00:00.000Z",
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

/** Says they garden. Has claimed nothing else. */
export const latentGardener = person({
  id: "latent-gardener",
  displayName: "Ana",
  capabilities: [capability("gardening")],
});

/** Says they garden, and has opted into paid work, and is free that morning. */
export const openGardener = person({
  id: "open-gardener",
  displayName: "Beto",
  capabilities: [capability("gardening", { kind: "role", level: "professional" })],
  preferences: ["paid_work", "one_off_work"],
  availability: [{ startsAt: "2026-09-24T08:00:00.000Z", endsAt: "2026-09-24T18:00:00.000Z" }],
});

/** Travelling through, explicitly open to opportunities on the way. */
export const travellingGardener = person({
  id: "travelling-gardener",
  displayName: "Cass",
  placeId: PLACE_ELSEWHERE,
  placeName: "Somewhere else",
  capabilities: [capability("gardening")],
  serviceAreaPlaceIds: [],
  travellingThroughPlaceIds: [PLACE_KINGS_HEATH],
  preferences: ["travelling_opportunities"],
});

/** Would swap gardening for something else. */
export const swappingGardener = person({
  id: "swapping-gardener",
  displayName: "Dee",
  capabilities: [capability("gardening")],
  preferences: ["skills_exchange"],
  wantsToLearn: ["Portuguese"],
});

/** Right skill, wrong place entirely. */
export const farAwayGardener = person({
  id: "far-gardener",
  displayName: "Eli",
  placeId: PLACE_ELSEWHERE,
  placeName: "Somewhere else",
  serviceAreaPlaceIds: [PLACE_ELSEWHERE],
  capabilities: [capability("gardening")],
  preferences: ["paid_work"],
});

function entry(over: Partial<WorldEntry> & { id: string; title: string }): WorldEntry {
  return {
    layer: "work",
    place: "Kings Heath",
    neighbourhood: "Kings Heath",
    x: 50,
    y: 50,
    when: "Thursday morning",
    band: "tomorrow",
    minutes: 120,
    cost: 0,
    summary: "",
    details: [],
    host: "Someone here",
    verified: false,
    social: "friendly",
    outdoors: true,
    community: true,
    ...over,
  };
}

export const gardenerOfferEntry = entry({
  id: "entry-offer",
  title: "Two hours of gardening",
  summary: "I do gardening, hedges, clearing.",
  kind: "skill",
  skills: ["gardening"],
  cost: -30,
});

export const communityGardenEntry = entry({
  id: "entry-community",
  title: "Community garden needs hands",
  layer: "community",
  summary: "Our gardening group meets on Saturdays.",
  give: "Gardening help welcome",
});

export const freeHelpEntry = entry({
  id: "entry-contribution",
  title: "An hour of gardening, free",
  layer: "people",
  summary: "Happy to help someone with gardening.",
  give: "An hour of gardening, for nothing",
  cost: 0,
});

export const unrelatedEntry = entry({
  id: "entry-unrelated",
  title: "Accordion repair workshop",
  summary: "Bring a broken instrument.",
  layer: "music",
});
