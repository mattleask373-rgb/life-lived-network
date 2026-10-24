/**
 * Needs, behind the server.
 *
 * Public reads use the anonymous reader, so what a visitor can see is exactly
 * what the access rules allow. Anything that belongs to a person goes through
 * the signed-in path.
 */

import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { DataError } from "./data/errors";
import { requireCompleteQueryRows } from "./needs-query-rows";
import { canonicalizeNeedPlace, createNeedInput, needIdInput } from "./server-inputs";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  rowToCapability,
  type AreaRelation,
  type CapabilityRow,
  type ContributionKind,
  type EarningPreference,
  type OpportunityPreference,
  type TravelWillingness,
  type Visibility,
} from "./capability";
import { findOpportunitiesForPerson, type PersonOpportunity } from "./reciprocal";
import { rowToNeed, type Need, type NeedRow } from "./needs";
import { rowToEntry, type ListingRow } from "./listings";
import { findSupply, type PersonCandidate, type SupplyAnswer } from "./supply-engine";
import { freshness } from "./capability-freshness";
import { needGeography } from "./geo-scope";
import {
  boundOpportunityPage,
  chunkOpportunityPlaceIds,
  unresolvedOpportunityPlaceIds,
  mergeNewestNeedRows,
  OPPORTUNITY_CANDIDATES_PER_CHUNK,
  OpportunityScopeTooWideError,
} from "./opportunity-query";
import type { JourneyContext, JourneyVisibility, JourneyStatus } from "./journey-context";

export interface NeedDraft {
  category: string;
  title: string;
  description: string;
  intent: string;
  place_id: string | null;
  place_text: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  starts_at: string | null;
  ends_at: string | null;
  duration_minutes: number | null;
  flexibility: string;
  budget: number | null;
  currency: string;
  payment_type: string;
  required_skills: string[];
  required_qualifications: string[];
  recurring: boolean;
  urgency: string;
  visibility: string;
}

export const createNeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: NeedDraft) => createNeedInput.parse(input))
  .handler(async ({ data, context }) => {
    let canonicalPlace = null;
    if (data.place_id !== null) {
      const { data: placeRow, error: placeError } = await context.supabase
        .from("places")
        .select("id, name, lat, lng, timezone, currency")
        .eq("id", data.place_id)
        .maybeSingle();
      if (placeError) throw placeError;
      if (!placeRow) throw new Error("Choose a valid locality before posting a need.");
      canonicalPlace = {
        id: placeRow.id,
        name: placeRow.name,
        lat: placeRow.lat === null ? null : Number(placeRow.lat),
        lng: placeRow.lng === null ? null : Number(placeRow.lng),
        timezone: placeRow.timezone,
        currency: placeRow.currency,
      };
    }
    const safeData = canonicalizeNeedPlace(data, canonicalPlace);
    const { data: row, error } = await context.supabase
      .from("needs")
      .insert({ ...safeData, creator_id: context.userId })
      .select("id")
      .single();
    if (error) throw error;
    return row as { id: string };
  });

export const getMyNeeds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Need[]> => {
    const { data, error } = await context.supabase
      .from("needs")
      .select("*")
      .eq("creator_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return ((data ?? []) as unknown as NeedRow[]).map(rowToNeed);
  });

export const getOpenNeeds = createServerFn({ method: "GET" })
  .inputValidator((input: { placeId?: string | null } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<Need[]> => {
    const { publicServerClient } = await import("./supabase-public.server");
    const supabase = publicServerClient();
    let query = supabase
      .from("needs")
      .select("*")
      .eq("status", "open")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.placeId) {
      // Asking about a city means asking about everywhere inside it. The
      // hierarchy is expanded here, behind the boundary, so the browser only
      // ever says where it is.
      const { loadPlaceIndex } = await import("./place-index.server");
      const { descendantIdsOf } = await import("./places");
      const index = await loadPlaceIndex(supabase);
      if (!index.byId.has(data.placeId)) throw new DataError("NOT_FOUND");
      const inside = descendantIdsOf(index, data.placeId);
      if (inside.length > 400) {
        throw new DataError(
          "SCOPE_TOO_WIDE",
          `Open-need locality has ${inside.length} descendant places.`,
        );
      }
      query = query.in("place_id", inside);
    }
    const { data: rows, error } = await query;
    if (error) throw error;
    return ((rows ?? []) as unknown as NeedRow[]).map(rowToNeed);
  });

/**
 * Signed-in discovery reads through the request-bound Supabase client, allowing
 * row-level security to enforce exact verified locality membership. The place
 * filter is a bounded UX constraint, not the security boundary.
 */
export const getOpenNeedsForMember = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { placeId?: string | null } | undefined) => input ?? {})
  .handler(async ({ data, context }): Promise<Need[]> => {
    const supabase = context.supabase;
    let query = supabase
      .from("needs")
      .select("*")
      .eq("status", "open")
      .in("visibility", ["public", "local_discovery"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (data.placeId) {
      const { loadPlaceIndex } = await import("./place-index.server");
      const { descendantIdsOf } = await import("./places");
      const index = await loadPlaceIndex(supabase);
      if (!index.byId.has(data.placeId)) throw new DataError("NOT_FOUND");
      const inside = descendantIdsOf(index, data.placeId);
      if (inside.length > 400) {
        throw new DataError(
          "SCOPE_TOO_WIDE",
          "Open-need locality has " + inside.length + " descendant places.",
        );
      }
      query = query.in("place_id", inside);
    }

    const { data: rows, error } = await query;
    if (error) throw error;
    return ((rows ?? []) as unknown as NeedRow[]).map(rowToNeed);
  });

/**
 * The answer to "who or what could meet this?".
 *
 * Candidates are gathered cheaply — place first, then capability — and only
 * then handed to the engine, which does the honest labelling.
 */
/**
 * Shared canonical supply evaluation. The caller supplies either the anonymous
 * reader or current request-bound authenticated client; never pass the admin client.
 */
async function findSupplyForNeedWithClient(
  needId: string,
  supabase: SupabaseClient<Database>,
  publicOnly: boolean,
): Promise<SupplyAnswer | null> {
  let needQuery = supabase.from("needs").select("*").eq("id", needId);
  if (publicOnly) needQuery = needQuery.eq("visibility", "public");
  const { data: needRow, error } = await needQuery.maybeSingle();
  if (error) throw error;
  if (!needRow) return null;
  const need = rowToNeed(needRow as unknown as NeedRow);

  // The real geography of this need: the place itself, everywhere inside it,
  // and the larger places it sits in (which only count for someone who has
  // said they cover that area).
  const { loadPlaceIndex } = await import("./place-index.server");
  const placeIndex = await loadPlaceIndex(supabase);
  const geo = needGeography(placeIndex, need.placeId);
  if (!geo.placeId || !placeIndex.byId.has(geo.placeId) || geo.localPlaceIds.length === 0) {
    throw new DataError("INVALID_CONTEXT", "Need has no resolvable canonical locality.");
  }

  // Never pretend the first 400 IDs represent a complete global locality.
  const candidateCap = 400;
  if (geo.localPlaceIds.length > candidateCap || geo.serviceScopeIds.length > candidateCap) {
    throw new DataError("SCOPE_TOO_WIDE", "Need locality exceeds the safe matching scope.");
  }
  const localIds = geo.localPlaceIds;
  const scopeIds = geo.serviceScopeIds;
  const userIds = new Set<string>();
  if (localIds.length) {
    const [
      { data: locals, error: localsError, count: localsCount },
      { data: areas, error: areasError, count: areasCount },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("discoverable", true)
        .in("place_id", localIds)
        .limit(candidateCap + 1),
      supabase
        .from("service_areas")
        .select("user_id", { count: "exact" })
        .neq("relation", "travelling_through")
        .in("place_id", scopeIds)
        .limit(candidateCap + 1),
    ]);
    const localRows = requireCompleteQueryRows(
      { data: locals, error: localsError, count: localsCount },
      "local profile candidates",
      candidateCap,
    );
    const areaRows = requireCompleteQueryRows(
      { data: areas, error: areasError, count: areasCount },
      "service-area candidates",
      candidateCap,
    );
    for (const p of localRows) userIds.add(p.id);
    for (const a of areaRows) userIds.add(a.user_id);
  }

  // Anyone either side of a block never appears to the other. If the block
  // list can't be read, show no people rather than risk showing a blocked one.
  if (userIds.size) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      data: blocks,
      error: blockError,
      count: blocksCount,
    } = await supabaseAdmin
      .from("user_blocks")
      .select("blocker_id, blocked_id", { count: "exact" })
      .or(`blocker_id.eq.${need.creatorId},blocked_id.eq.${need.creatorId}`)
      .limit(1001);
    const blockRows = requireCompleteQueryRows(
      { data: blocks, error: blockError, count: blocksCount },
      "blocking relationships",
      1000,
    );
    const { excludeBlocked } = await import("./block-filter");
    const kept = excludeBlocked(userIds, need.creatorId, blockRows, false);
    userIds.clear();
    for (const id of kept) userIds.add(id);
  }

  if (userIds.size > 200) {
    throw new DataError(
      "SCOPE_TOO_WIDE",
      "More than 200 unique candidates require a narrower locality.",
    );
  }
  const people: PersonCandidate[] = [];
  if (userIds.size) {
    const ids = [...userIds];
    const [
      { data: profiles, error: profilesError, count: profilesCount },
      { data: caps, error: capsError, count: capsCount },
      { data: areas, error: areasError, count: areasCount },
      { data: windows, error: windowsError, count: windowsCount },
      { data: prefs, error: prefsError, count: prefsCount },
      { data: contributions, error: contributionsError, count: contributionsCount },
      { data: journeys, error: journeysError, count: journeysCount },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, photo_url, location, place_id, wants_to_learn", {
          count: "exact",
        })
        .in("id", ids)
        .eq("discoverable", true)
        .limit(1001),
      supabase
        .from("person_capabilities")
        .select("*", { count: "exact" })
        .in("user_id", ids)
        .limit(1001),
      supabase.from("service_areas").select("*", { count: "exact" }).in("user_id", ids).limit(1001),
      supabase
        .from("availability_windows")
        .select("*", { count: "exact" })
        .in("user_id", ids)
        .limit(1001),
      supabase
        .from("opportunity_preferences")
        .select("user_id, preference, earning_preference", { count: "exact" })
        .in("user_id", ids)
        .limit(1001),
      supabase
        .from("contribution_preferences")
        .select("user_id, contribution, visibility", { count: "exact" })
        .in("user_id", ids)
        .limit(1001),
      supabase
        .from("journeys")
        .select("*, journey_places(*)", { count: "exact" })
        .in("owner_id", ids)
        .eq("visibility", "public")
        .eq("opportunity_opt_in", true)
        .eq("status", "active")
        .order("id", { ascending: true })
        .limit(1001),
    ]);

    const profileRows = requireCompleteQueryRows(
      { data: profiles, error: profilesError, count: profilesCount },
      "candidate profiles",
      1000,
    );
    const capabilityRows = requireCompleteQueryRows(
      { data: caps, error: capsError, count: capsCount },
      "candidate capabilities",
      1000,
    );
    const areaRows = requireCompleteQueryRows(
      { data: areas, error: areasError, count: areasCount },
      "candidate service areas",
      1000,
    );
    const availabilityRows = requireCompleteQueryRows(
      { data: windows, error: windowsError, count: windowsCount },
      "candidate availability",
      1000,
    );
    const preferenceRows = requireCompleteQueryRows(
      { data: prefs, error: prefsError, count: prefsCount },
      "candidate preferences",
      1000,
    );
    const contributionRows = requireCompleteQueryRows(
      { data: contributions, error: contributionsError, count: contributionsCount },
      "candidate contribution preferences",
      1000,
    );
    const journeyRows = requireCompleteQueryRows(
      { data: journeys, error: journeysError, count: journeysCount },
      "candidate journeys",
      1000,
    );

    for (const profile of profileRows) {
      people.push({
        id: profile.id,
        displayName: profile.display_name || "Someone here",
        placeId: profile.place_id,
        placeName: profile.location || "Nearby",
        capabilities: (capabilityRows as unknown as CapabilityRow[])
          .filter((c) => c.user_id === profile.id)
          // A capability marked private is nobody else's business.
          .filter((c) => (c.visibility || "local_discovery") !== "private")
          .map(rowToCapability),
        serviceAreaPlaceIds: areaRows
          .filter((a) => a.user_id === profile.id && a.relation !== "travelling_through")
          .map((a) => a.place_id),
        serviceAreas: areaRows
          .filter((a) => a.user_id === profile.id && a.relation !== "travelling_through")
          .map((a) => ({
            id: a.id,
            userId: a.user_id,
            placeId: a.place_id,
            radiusKm: a.radius_km,
            note: a.note,
            relation: a.relation as AreaRelation,
            travelWillingness: a.travel_willingness as TravelWillingness,
            visibility: a.visibility as Visibility,
          })),
        travellingThroughPlaceIds: areaRows
          .filter((a) => a.user_id === profile.id && a.relation === "travelling_through")
          .map((a) => a.place_id),
        availability: availabilityRows
          .filter((w) => w.user_id === profile.id)
          .map((w) => ({ startsAt: w.starts_at, endsAt: w.ends_at })),
        availabilityDetails: availabilityRows
          .filter((w) => w.user_id === profile.id)
          .map((w) => ({
            id: w.id,
            userId: w.user_id,
            startsAt: w.starts_at,
            endsAt: w.ends_at,
            timezone: w.timezone,
            recurrence: w.recurrence,
            note: w.note,
            visibility: w.visibility as Visibility,
            expiresAt: w.expires_at,
            lastConfirmedAt: w.last_confirmed_at,
          })),
        preferences: preferenceRows
          .filter((p) => p.user_id === profile.id)
          .map((p) => p.preference as OpportunityPreference),
        wantsToLearn: profile.wants_to_learn ?? [],
        contributions: contributionRows
          .filter((item) => item.user_id === profile.id && item.visibility !== "private")
          .map((item) => item.contribution as ContributionKind),
        earningPreference: (preferenceRows.find(
          (item) => item.user_id === profile.id && item.earning_preference !== "unstated",
        )?.earning_preference ?? "unstated") as EarningPreference,
        journeys: journeyRows
          .filter((journey) => journey.owner_id === profile.id)
          .map((journey): JourneyContext => ({
            id: journey.id,
            ownerId: journey.owner_id,
            title: journey.title,
            startsAt: journey.starts_at,
            endsAt: journey.ends_at,
            timezone: journey.timezone,
            visibility: journey.visibility as JourneyVisibility,
            opportunityOptIn: journey.opportunity_opt_in,
            status: journey.status as JourneyStatus,
            lastConfirmedAt: journey.last_confirmed_at,
            expiresAt: journey.expires_at,
            freshness: freshness({
              lastConfirmedAt: journey.last_confirmed_at,
              expiresAt: journey.expires_at,
              kind: "availability",
              now: new Date(),
            }),
            places: (journey.journey_places ?? []).map((place) => ({
              placeId: place.place_id,
              position: place.position,
              arrivesAt: place.arrives_at,
              departsAt: place.departs_at,
            })),
          })),
        ...(profile.photo_url ? { photoUrl: profile.photo_url } : {}),
      });
    }
  }

  // Listings and hour offers both arrive as WorldEntry, so the engine sees
  // one world rather than two competing offer systems.
  let listingQuery = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .neq("data_quality", "expired")
    .order("id", { ascending: true })
    .limit(151);
  if (localIds.length) listingQuery = listingQuery.in("place_id", localIds);
  const listingResult = await listingQuery;
  const listingRows = requireCompleteQueryRows(listingResult, "listing candidates", 150);
  const entries = (listingRows as unknown as ListingRow[]).map((r) => rowToEntry(r));

  let hourQuery = supabase
    .from("hour_offers")
    .select("*", { count: "exact" })
    .eq("status", "open")
    .order("id", { ascending: true })
    .limit(151);
  if (localIds.length) hourQuery = hourQuery.in("place_id", localIds);
  const hourResult = await hourQuery;
  const hourRows = requireCompleteQueryRows(hourResult, "hour-offer candidates", 150);
  for (const h of hourRows) {
    entries.push({
      id: `hour-${h.id}`,
      placeId: h.place_id,
      layer: h.direction === "offering" ? "people" : "community",
      title: h.title,
      place: h.neighbourhood || "Nearby",
      neighbourhood: h.neighbourhood || "Nearby",
      x: 50,
      y: 50,
      when: h.when_text,
      band: "today",
      minutes: h.minutes,
      cost: 0,
      summary: h.detail,
      details: [],
      ...(h.direction === "offering" ? { give: h.title } : {}),
      host: "Someone here",
      verified: false,
      social: "friendly",
      outdoors: false,
      community: true,
      kind: "hour",
      skills: h.skills ?? [],
    });
  }

  // Profile photographs live in private storage, so a short-lived link is
  // made for the few people actually being shown.
  await signPhotos(supabase, people);

  return findSupply({ need, people, entries, geography: geo });
}

export const findSupplyForNeed = createServerFn({ method: "GET" })
  .inputValidator((input: { needId: string }) => needIdInput.safeParse(input).data ?? null)
  .handler(async ({ data }): Promise<SupplyAnswer | null> => {
    if (!data) return null;
    const { publicServerClient } = await import("./supabase-public.server");
    return findSupplyForNeedWithClient(data.needId, publicServerClient(), true);
  });

export const findSupplyForNeedForMember = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { needId: string }) => needIdInput.safeParse(input).data ?? null)
  .handler(async ({ data, context }): Promise<SupplyAnswer | null> => {
    if (!data) return null;
    return findSupplyForNeedWithClient(data.needId, context.supabase, false);
  });

/** Turn stored photo paths into short-lived links. Full URLs are left alone. */
async function signPhotos(
  _supabase: ReturnType<typeof import("./supabase-public.server").publicServerClient>,
  people: PersonCandidate[],
): Promise<void> {
  const paths = people
    .map((person) => person.photoUrl)
    .filter((value): value is string => Boolean(value) && !value!.startsWith("http"));
  if (!paths.length) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from("profile-photos").createSignedUrls(paths, 3600);
  const signed = new Map((data ?? []).map((item) => [item.path ?? "", item.signedUrl]));
  for (const person of people) {
    if (person.photoUrl && !person.photoUrl.startsWith("http")) {
      person.photoUrl = signed.get(person.photoUrl) ?? null;
    }
  }
}

/**
 * The same evidence, read the other way round: what could I help with?
 *
 * Owner-scoped, because it is built entirely out of what this person has said
 * about themselves. It is deliberately short, and it is not a feed.
 */
export interface MyOpportunitiesResult {
  status: "needs_places" | "complete" | "partial";
  opportunities: PersonOpportunity[];
  /** Number of locality chunks where at least one older ask may be outside the checked window. */
  cappedChunks: number;
}

export const getMyOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyOpportunitiesResult> => {
    const { supabase, userId } = context;
    const [profileResult, capsResult, areasResult, windowsResult, prefsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, photo_url, location, place_id, wants_to_learn")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("person_capabilities").select("*").eq("user_id", userId),
      supabase.from("service_areas").select("place_id, relation").eq("user_id", userId),
      supabase.from("availability_windows").select("starts_at, ends_at").eq("user_id", userId),
      supabase.from("opportunity_preferences").select("preference").eq("user_id", userId),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (capsResult.error) throw capsResult.error;
    if (areasResult.error) throw areasResult.error;
    if (windowsResult.error) throw windowsResult.error;
    if (prefsResult.error) throw prefsResult.error;

    const profile = profileResult.data;
    const caps = capsResult.data;
    const areas = areasResult.data;
    const windows = windowsResult.data;
    const prefs = prefsResult.data;
    // A successful query must return a collection. Missing payloads are not
    // evidence that the person has no capabilities, areas or availability.
    if (
      !Array.isArray(caps) ||
      !Array.isArray(areas) ||
      !Array.isArray(windows) ||
      !Array.isArray(prefs)
    ) {
      throw new DataError("DATA_UNAVAILABLE", "A required profile collection was missing.");
    }

    const serviceAreaPlaceIds = (areas ?? [])
      .filter((a) => a.relation !== "travelling_through")
      .map((a) => a.place_id);
    const travellingThroughPlaceIds = (areas ?? [])
      .filter((a) => a.relation === "travelling_through")
      .map((a) => a.place_id);

    const stated = [
      ...new Set(
        [profile?.place_id, ...serviceAreaPlaceIds, ...travellingThroughPlaceIds].filter(Boolean),
      ),
    ] as string[];
    if (!stated.length) {
      return { status: "needs_places", opportunities: [], cappedChunks: 0 };
    }

    // Somewhere you said you are or cover includes everywhere inside it, so a
    // need in a village inside your county is still yours to see.
    const { loadPlaceIndex } = await import("./place-index.server");
    const { descendantIdsOf } = await import("./places");
    const index = await loadPlaceIndex(supabase);
    const unresolvedPlaceIds = unresolvedOpportunityPlaceIds(stated, index.byId);
    if (unresolvedPlaceIds.length) {
      throw new DataError(
        "DATA_UNAVAILABLE",
        "One or more saved localities could not be resolved. Update your home or service areas and retry.",
      );
    }
    const placeIds = [...new Set(stated.flatMap((id) => descendantIdsOf(index, id)))];
    let placeChunks: string[][];
    try {
      placeChunks = chunkOpportunityPlaceIds(placeIds);
    } catch (error) {
      if (error instanceof OpportunityScopeTooWideError) {
        throw new DataError("SCOPE_TOO_WIDE", error.message);
      }
      throw error;
    }

    const geographies = new Map<string, ReturnType<typeof needGeography>>();

    // A block works both ways, whoever set it.
    const { data: blockRows, error: blocksError } = await supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (blocksError) throw blocksError;
    if (!Array.isArray(blockRows)) throw new DataError("DATA_UNAVAILABLE");
    const blockedIds = new Set(
      blockRows.map((row) => (row.blocker_id === userId ? row.blocked_id : row.blocker_id)),
    );

    // Keep every query locality-scoped. Broad areas use one bounded newest-first
    // window per chunk, which is merged before the canonical evaluator runs.
    const needPages = await Promise.all(
      placeChunks.map(async (chunk) => {
        const {
          data: rows,
          error: needsError,
          count: exactCount,
        } = await supabase
          .from("needs")
          .select("*", { count: "exact" })
          .eq("status", "open")
          .in("visibility", ["public", "local_discovery"])
          .neq("creator_id", userId)
          .in("place_id", chunk)
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
          // Keep the sentinel, but do not trust it alone: exactCount below
          // detects an upstream response cap that hides the sentinel itself.
          .limit(OPPORTUNITY_CANDIDATES_PER_CHUNK + 1);
        if (needsError) throw needsError;
        if (!Array.isArray(rows)) throw new DataError("DATA_UNAVAILABLE");
        return boundOpportunityPage(rows, exactCount, OPPORTUNITY_CANDIDATES_PER_CHUNK);
      }),
    );
    // Do not truncate candidates to a single global window: that would let
    // high-volume places crowd out smaller places before matching. Preserve
    // the per-chunk cap, but tell the UI when any chunk exceeded its safe window.
    const cappedChunks = needPages.filter((page) => page.truncated).length;
    const needRows = mergeNewestNeedRows(
      needPages.map((page) => page.rows),
      placeChunks.length * OPPORTUNITY_CANDIDATES_PER_CHUNK,
    );

    const { data: journeyRows, error: journeysError } = await supabase
      .from("journeys")
      .select("*, journey_places(*)")
      .eq("owner_id", userId)
      .eq("status", "active")
      .limit(20);
    if (journeysError) throw journeysError;
    if (!Array.isArray(journeyRows)) throw new DataError("DATA_UNAVAILABLE");
    const journeys: JourneyContext[] = journeyRows.map((journey) => ({
      id: journey.id,
      ownerId: journey.owner_id,
      title: journey.title,
      startsAt: journey.starts_at,
      endsAt: journey.ends_at,
      timezone: journey.timezone,
      visibility: journey.visibility as JourneyVisibility,
      opportunityOptIn: journey.opportunity_opt_in,
      status: journey.status as JourneyStatus,
      lastConfirmedAt: journey.last_confirmed_at,
      expiresAt: journey.expires_at,
      freshness: freshness({
        lastConfirmedAt: journey.last_confirmed_at,
        expiresAt: journey.expires_at,
        kind: "availability",
        now: new Date(),
      }),
      places: (journey.journey_places ?? []).map((place) => ({
        placeId: place.place_id,
        position: place.position,
        arrivesAt: place.arrives_at,
        departsAt: place.departs_at,
      })),
    }));

    const opportunities = findOpportunitiesForPerson({
      geographyFor: (need) => {
        const key = need.placeId ?? "";
        const existing = geographies.get(key);
        if (existing) return existing;
        const built = needGeography(index, need.placeId);
        geographies.set(key, built);
        return built;
      },
      person: {
        id: userId,
        displayName: profile?.display_name || "You",
        placeId: profile?.place_id ?? null,
        placeName: profile?.location || "Nearby",
        capabilities: ((caps ?? []) as unknown as CapabilityRow[]).map(rowToCapability),
        serviceAreaPlaceIds,
        travellingThroughPlaceIds,
        availability: (windows ?? []).map((w) => ({ startsAt: w.starts_at, endsAt: w.ends_at })),
        preferences: (prefs ?? []).map((p) => p.preference as OpportunityPreference),
        journeys,
        wantsToLearn: profile?.wants_to_learn ?? [],
        ...(profile?.photo_url ? { photoUrl: profile.photo_url } : {}),
      },
      needs: ((needRows ?? []) as unknown as NeedRow[])
        .map(rowToNeed)
        .filter((need) => !blockedIds.has(need.creatorId)),
      now: new Date().toISOString(),
    });
    return {
      status: cappedChunks > 0 ? "partial" : "complete",
      opportunities,
      cappedChunks,
    };
  });
