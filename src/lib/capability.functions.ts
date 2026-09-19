/**
 * A person's own capabilities, service areas, availability, what they're open
 * to and what they'd give.
 *
 * All owner-scoped. Nothing here is ever inferred from anything else, and
 * nothing is ever shared wider than the person asked for.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  rowToCapability,
  type AreaRelation,
  type AvailabilityWindow,
  type Capability,
  type CapabilityRow,
  type ContributionKind,
  type ContributionPreference,
  type EarningPreference,
  type OpportunityPreference,
  type ServiceArea,
  type TravelWillingness,
  type Visibility,
} from "./capability";

export interface CapabilityProfile {
  capabilities: Capability[];
  serviceAreas: ServiceArea[];
  availability: AvailabilityWindow[];
  preferences: OpportunityPreference[];
  contributions: ContributionPreference[];
  earningPreference: EarningPreference;
}

export const getMyCapabilityProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CapabilityProfile> => {
    const { supabase, userId } = context;
    const [caps, areas, windows, prefs, contributions] = await Promise.all([
      supabase.from("person_capabilities").select("*").eq("user_id", userId),
      supabase.from("service_areas").select("*").eq("user_id", userId),
      supabase.from("availability_windows").select("*").eq("user_id", userId),
      supabase.from("opportunity_preferences").select("*").eq("user_id", userId),
      supabase.from("contribution_preferences").select("*").eq("user_id", userId),
    ]);
    const prefRows = (prefs.data ?? []) as { preference: string; earning_preference?: string }[];
    return {
      capabilities: ((caps.data ?? []) as unknown as CapabilityRow[]).map(rowToCapability),
      serviceAreas: (areas.data ?? []).map((a) => ({
        id: a.id,
        userId: a.user_id,
        placeId: a.place_id,
        radiusKm: a.radius_km,
        note: a.note,
        relation: ((a as { relation?: string }).relation || "serves") as AreaRelation,
        travelWillingness: ((a as { travel_willingness?: string }).travel_willingness ||
          "local") as TravelWillingness,
        visibility: ((a as { visibility?: string }).visibility || "local_discovery") as Visibility,
      })),
      availability: (windows.data ?? []).map((w) => ({
        id: w.id,
        userId: w.user_id,
        startsAt: w.starts_at,
        endsAt: w.ends_at,
        timezone: w.timezone,
        recurrence: w.recurrence,
        note: w.note,
        visibility: ((w as { visibility?: string }).visibility || "local_discovery") as Visibility,
        expiresAt: (w as { expires_at?: string | null }).expires_at ?? null,
        lastConfirmedAt: (w as { last_confirmed_at?: string }).last_confirmed_at ?? w.created_at,
      })),
      preferences: prefRows.map((p) => p.preference as OpportunityPreference),
      contributions: (contributions.data ?? []).map((c) => ({
        id: c.id,
        userId: c.user_id,
        contribution: c.contribution as ContributionKind,
        note: c.note,
        visibility: (c.visibility || "local_discovery") as Visibility,
      })),
      earningPreference: (prefRows.find((p) => p.earning_preference && p.earning_preference !== "unstated")
        ?.earning_preference ?? "unstated") as EarningPreference,
    };
  });

interface CapabilityInput {
  kind: string;
  label: string;
  level: string;
  evidence: string;
  visibility?: string;
  issuingBody?: string;
  obtainedOn?: string | null;
  expiresOn?: string | null;
  organisation?: string;
  yearsExperience?: number | null;
  startedOn?: string | null;
  endedOn?: string | null;
}

export const addCapability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CapabilityInput) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("person_capabilities").insert({
      user_id: context.userId,
      kind: data.kind,
      label: data.label,
      level: data.level,
      evidence: data.evidence,
      visibility: data.visibility ?? "local_discovery",
      // Saying it yourself is exactly that, and is labelled as such.
      verification: "self_stated",
      last_confirmed_at: new Date().toISOString(),
      // Qualification detail only means anything on a qualification.
      issuing_body: data.kind === "qualification" ? data.issuingBody ?? "" : "",
      obtained_on: data.kind === "qualification" ? data.obtainedOn ?? null : null,
      expires_on: data.kind === "qualification" ? data.expiresOn ?? null : null,
      // And experience detail only on experience.
      organisation: data.kind === "experience" ? data.organisation ?? "" : "",
      years_experience: data.kind === "experience" ? data.yearsExperience ?? null : null,
      started_on: data.kind === "experience" ? data.startedOn ?? null : null,
      ended_on: data.kind === "experience" ? data.endedOn ?? null : null,
    });
    if (error) throw error;
    return { ok: true };
  });

export const setCapabilityVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; visibility: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("person_capabilities")
      .update({ visibility: data.visibility })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/** "Yes, this is still true." The only way anything becomes fresh again. */
export const confirmCapability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("person_capabilities")
      .update({ last_confirmed_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const removeCapability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("person_capabilities")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const setServiceAreas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      placeIds: string[];
      relation?: string;
      travelWillingness?: string;
      travellingThroughPlaceIds?: string[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("service_areas").delete().eq("user_id", userId);
    const rows = [
      ...data.placeIds.map((placeId) => ({
        user_id: userId,
        place_id: placeId,
        relation: data.relation ?? "serves",
        travel_willingness: data.travelWillingness ?? "local",
      })),
      // Passing through is stored as its own kind of thing.
      ...(data.travellingThroughPlaceIds ?? []).map((placeId) => ({
        user_id: userId,
        place_id: placeId,
        relation: "travelling_through",
        travel_willingness: "anywhere",
      })),
    ];
    if (rows.length) {
      const { error } = await supabase.from("service_areas").insert(rows);
      if (error) throw error;
    }
    return { ok: true };
  });

export const setPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { preferences: string[]; earningPreference?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("opportunity_preferences").delete().eq("user_id", userId);
    if (data.preferences.length) {
      const { error } = await supabase.from("opportunity_preferences").insert(
        data.preferences.map((preference) => ({
          user_id: userId,
          preference,
          earning_preference: data.earningPreference ?? "unstated",
        })),
      );
      if (error) throw error;
    }
    return { ok: true };
  });

/** What someone will actually give, kept apart from what they're open to. */
export const setContributions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { contributions: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("contribution_preferences").delete().eq("user_id", userId);
    if (data.contributions.length) {
      const { error } = await supabase
        .from("contribution_preferences")
        .insert(data.contributions.map((contribution) => ({ user_id: userId, contribution })));
      if (error) throw error;
    }
    return { ok: true };
  });

export const addAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      startsAt: string;
      endsAt: string;
      timezone: string;
      note: string;
      expiresAt?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("availability_windows").insert({
      user_id: context.userId,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      timezone: data.timezone,
      note: data.note,
      // Availability stops being true. By default, when the window ends.
      expires_at: data.expiresAt ?? data.endsAt,
      last_confirmed_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { ok: true };
  });

export const removeAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("availability_windows")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
