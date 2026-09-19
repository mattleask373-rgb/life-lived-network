/**
 * Needs, behind the server.
 *
 * Public reads use the anonymous reader, so what a visitor can see is exactly
 * what the access rules allow. Anything that belongs to a person goes through
 * the signed-in path.
 */

import { createServerFn } from "@tanstack/react-start";
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
  .inputValidator((input: NeedDraft) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("needs")
      .insert({ ...data, creator_id: context.userId })
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
    let query = publicServerClient()
      .from("needs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.placeId) query = query.eq("place_id", data.placeId);
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
export const findSupplyForNeed = createServerFn({ method: "GET" })
  .inputValidator((input: { needId: string }) => input)
  .handler(async ({ data }): Promise<SupplyAnswer | null> => {
    const { publicServerClient } = await import("./supabase-public.server");
    const supabase = publicServerClient();

    const { data: needRow, error } = await supabase
      .from("needs")
      .select("*")
      .eq("id", data.needId)
      .maybeSingle();
    if (error) throw error;
    if (!needRow) return null;
    const need = rowToNeed(needRow as unknown as NeedRow);

    // The real geography of this need: the place itself, everywhere inside it,
    // and the larger places it sits in (which only count for someone who has
    // said they cover that area).
    const { loadPlaceIndex } = await import("./place-index.server");
    const geo = needGeography(await loadPlaceIndex(supabase), need.placeId);

    // People whose home place is in or under the need's place, or whose stated
    // service area covers it. Bounded on both sides.
    const localIds = geo.localPlaceIds.slice(0, 400);
    const scopeIds = geo.serviceScopeIds.slice(0, 400);
    const userIds = new Set<string>();
    if (localIds.length) {
      const [{ data: locals }, { data: areas }] = await Promise.all([
        supabase.from("profiles").select("id").eq("discoverable", true).in("place_id", localIds),
        supabase
          .from("service_areas")
          .select("user_id")
          .neq("relation", "travelling_through")
          .in("place_id", scopeIds)
          .limit(400),
      ]);
      for (const p of locals ?? []) userIds.add(p.id);
      for (const a of areas ?? []) userIds.add(a.user_id);
    }

    // Anyone either side of a block never appears to the other.
    if (userIds.size) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: blocks } = await supabaseAdmin
        .from("user_blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${need.creatorId},blocked_id.eq.${need.creatorId}`);
      for (const block of blocks ?? []) {
        userIds.delete(block.blocker_id === need.creatorId ? block.blocked_id : block.blocker_id);
      }
    }

    const people: PersonCandidate[] = [];
    if (userIds.size) {
      const ids = [...userIds].slice(0, 200);
      const [
        { data: profiles },
        { data: caps },
        { data: areas },
        { data: windows },
        { data: prefs },
        { data: contributions },
        { data: journeys },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, photo_url, location, place_id, wants_to_learn")
          .in("id", ids)
          .eq("discoverable", true),
        supabase.from("person_capabilities").select("*").in("user_id", ids),
        supabase.from("service_areas").select("*").in("user_id", ids),
        supabase.from("availability_windows").select("*").in("user_id", ids),
        supabase
          .from("opportunity_preferences")
          .select("user_id, preference, earning_preference")
          .in("user_id", ids),
        supabase
          .from("contribution_preferences")
          .select("user_id, contribution, visibility")
          .in("user_id", ids),
        supabase
          .from("journeys")
          .select("*, journey_places(*)")
          .in("owner_id", ids)
          .eq("visibility", "public")
          .eq("opportunity_opt_in", true)
          .eq("status", "active"),
      ]);

      for (const profile of profiles ?? []) {
        people.push({
          id: profile.id,
          displayName: profile.display_name || "Someone here",
          placeId: profile.place_id,
          placeName: profile.location || "Nearby",
          capabilities: ((caps ?? []) as unknown as CapabilityRow[])
            .filter((c) => c.user_id === profile.id)
            // A capability marked private is nobody else's business.
            .filter((c) => (c.visibility || "local_discovery") !== "private")
            .map(rowToCapability),
          serviceAreaPlaceIds: (areas ?? [])
            .filter((a) => a.user_id === profile.id && a.relation !== "travelling_through")
            .map((a) => a.place_id),
          serviceAreas: (areas ?? [])
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
          travellingThroughPlaceIds: (areas ?? [])
            .filter((a) => a.user_id === profile.id && a.relation === "travelling_through")
            .map((a) => a.place_id),
          availability: (windows ?? [])
            .filter((w) => w.user_id === profile.id)
            .map((w) => ({ startsAt: w.starts_at, endsAt: w.ends_at })),
          availabilityDetails: (windows ?? [])
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
          preferences: (prefs ?? [])
            .filter((p) => p.user_id === profile.id)
            .map((p) => p.preference as OpportunityPreference),
          wantsToLearn: profile.wants_to_learn ?? [],
          contributions: (contributions ?? [])
            .filter((item) => item.user_id === profile.id && item.visibility !== "private")
            .map((item) => item.contribution as ContributionKind),
          earningPreference: ((prefs ?? []).find(
            (item) => item.user_id === profile.id && item.earning_preference !== "unstated",
          )?.earning_preference ?? "unstated") as EarningPreference,
          journeys: (journeys ?? [])
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
      .select("*")
      .eq("status", "published")
      .neq("data_quality", "expired")
      .limit(150);
    if (localIds.length) listingQuery = listingQuery.in("place_id", localIds);
    const { data: listingRows } = await listingQuery;
    const entries = ((listingRows ?? []) as unknown as ListingRow[]).map((r) => rowToEntry(r));

    const { data: hourRows } = await supabase
      .from("hour_offers")
      .select("*")
      .eq("status", "open")
      .limit(150);
    for (const h of hourRows ?? []) {
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
  });

/** Turn stored photo paths into short-lived links. Full URLs are left alone. */
async function signPhotos(
  supabase: ReturnType<typeof import("./supabase-public.server").publicServerClient>,
  people: PersonCandidate[],
): Promise<void> {
  const paths = people
    .map((person) => person.photoUrl)
    .filter((value): value is string => Boolean(value) && !value!.startsWith("http"));
  if (!paths.length) return;
  const { data } = await supabase.storage.from("profile-photos").createSignedUrls(paths, 3600);
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
export const getMyOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PersonOpportunity[]> => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: caps }, { data: areas }, { data: windows }, { data: prefs }] =
      await Promise.all([
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
    if (!stated.length) return [];

    // Somewhere you said you are or cover includes everywhere inside it, so a
    // need in a village inside your county is still yours to see.
    const { loadPlaceIndex } = await import("./place-index.server");
    const { descendantIdsOf } = await import("./places");
    const index = await loadPlaceIndex(supabase);
    const placeIds = [...new Set(stated.flatMap((id) => descendantIdsOf(index, id)))].slice(0, 400);
    const geographies = new Map<string, ReturnType<typeof needGeography>>();

    // A block works both ways, whoever set it.
    const { data: blockRows } = await supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const blockedIds = new Set(
      (blockRows ?? []).map((row) => (row.blocker_id === userId ? row.blocked_id : row.blocker_id)),
    );

    const { data: needRows, error } = await supabase
      .from("needs")
      .select("*")
      .eq("status", "open")
      .in("visibility", ["public", "local_discovery"])
      .in("place_id", placeIds)
      .neq("creator_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;

    const { data: journeyRows } = await supabase
      .from("journeys")
      .select("*, journey_places(*)")
      .eq("owner_id", userId)
      .eq("status", "active")
      .limit(20);
    const journeys: JourneyContext[] = (journeyRows ?? []).map((journey) => ({
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

    return findOpportunitiesForPerson({
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
  });
