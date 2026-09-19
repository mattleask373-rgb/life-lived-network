/**
 * Needs, behind the server.
 *
 * Public reads use the anonymous reader, so what a visitor can see is exactly
 * what the access rules allow. Anything that belongs to a person goes through
 * the signed-in path.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type { Capability, OpportunityPreference } from "./capability";
import { rowToNeed, type Need, type NeedRow } from "./needs";
import { rowToEntry, type ListingRow } from "./listings";
import { findSupply, type PersonCandidate, type SupplyAnswer } from "./supply-engine";

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

    // Cheap geographic prefilter: people whose home place or service area
    // touches this need's place.
    const placeIds = need.placeId ? [need.placeId] : [];
    const userIds = new Set<string>();
    if (placeIds.length) {
      const [{ data: locals }, { data: areas }] = await Promise.all([
        supabase.from("profiles").select("id").eq("discoverable", true).in("place_id", placeIds),
        supabase.from("service_areas").select("user_id").in("place_id", placeIds),
      ]);
      for (const p of locals ?? []) userIds.add(p.id);
      for (const a of areas ?? []) userIds.add(a.user_id);
    }

    const people: PersonCandidate[] = [];
    if (userIds.size) {
      const ids = [...userIds].slice(0, 200);
      const [{ data: profiles }, { data: caps }, { data: areas }, { data: windows }, { data: prefs }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, display_name, location, place_id, wants_to_learn")
            .in("id", ids)
            .eq("discoverable", true),
          supabase.from("person_capabilities").select("*").in("user_id", ids),
          supabase.from("service_areas").select("user_id, place_id").in("user_id", ids),
          supabase.from("availability_windows").select("user_id, starts_at, ends_at").in("user_id", ids),
          supabase.from("opportunity_preferences").select("user_id, preference").in("user_id", ids),
        ]);

      for (const profile of profiles ?? []) {
        people.push({
          id: profile.id,
          displayName: profile.display_name || "Someone here",
          placeId: profile.place_id,
          placeName: profile.location || "Nearby",
          capabilities: (caps ?? [])
            .filter((c) => c.user_id === profile.id)
            .map((c) => c as unknown as Capability),
          serviceAreaPlaceIds: (areas ?? [])
            .filter((a) => a.user_id === profile.id)
            .map((a) => a.place_id),
          availability: (windows ?? [])
            .filter((w) => w.user_id === profile.id)
            .map((w) => ({ startsAt: w.starts_at, endsAt: w.ends_at })),
          preferences: (prefs ?? [])
            .filter((p) => p.user_id === profile.id)
            .map((p) => p.preference as OpportunityPreference),
          wantsToLearn: profile.wants_to_learn ?? [],
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
    if (need.placeId) listingQuery = listingQuery.eq("place_id", need.placeId);
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

    return findSupply({ need, people, entries });
  });
