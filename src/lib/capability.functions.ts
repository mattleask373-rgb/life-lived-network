/**
 * A person's own capabilities, service areas, availability and preferences.
 *
 * All owner-scoped. Nothing here is ever inferred from anything else.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type {
  AvailabilityWindow,
  Capability,
  OpportunityPreference,
  ServiceArea,
} from "./capability";

export interface CapabilityProfile {
  capabilities: Capability[];
  serviceAreas: ServiceArea[];
  availability: AvailabilityWindow[];
  preferences: OpportunityPreference[];
}

export const getMyCapabilityProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CapabilityProfile> => {
    const { supabase, userId } = context;
    const [caps, areas, windows, prefs] = await Promise.all([
      supabase.from("person_capabilities").select("*").eq("user_id", userId),
      supabase.from("service_areas").select("*").eq("user_id", userId),
      supabase.from("availability_windows").select("*").eq("user_id", userId),
      supabase.from("opportunity_preferences").select("preference").eq("user_id", userId),
    ]);
    return {
      capabilities: ((caps.data ?? []) as unknown as Capability[]).map((c) => c),
      serviceAreas: (areas.data ?? []).map((a) => ({
        id: a.id,
        userId: a.user_id,
        placeId: a.place_id,
        radiusKm: a.radius_km,
        note: a.note,
      })),
      availability: (windows.data ?? []).map((w) => ({
        id: w.id,
        userId: w.user_id,
        startsAt: w.starts_at,
        endsAt: w.ends_at,
        timezone: w.timezone,
        recurrence: w.recurrence,
        note: w.note,
      })),
      preferences: (prefs.data ?? []).map((p) => p.preference as OpportunityPreference),
    };
  });

export const addCapability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { kind: string; label: string; level: string; evidence: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("person_capabilities").insert({
      ...data,
      user_id: context.userId,
      // Saying it yourself is exactly that, and is labelled as such.
      verification: "self_stated",
    });
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
  .inputValidator((input: { placeIds: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("service_areas").delete().eq("user_id", userId);
    if (data.placeIds.length) {
      const { error } = await supabase
        .from("service_areas")
        .insert(data.placeIds.map((placeId) => ({ user_id: userId, place_id: placeId })));
      if (error) throw error;
    }
    return { ok: true };
  });

export const setPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { preferences: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("opportunity_preferences").delete().eq("user_id", userId);
    if (data.preferences.length) {
      const { error } = await supabase
        .from("opportunity_preferences")
        .insert(data.preferences.map((preference) => ({ user_id: userId, preference })));
      if (error) throw error;
    }
    return { ok: true };
  });

export const addAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { startsAt: string; endsAt: string; timezone: string; note: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("availability_windows").insert({
      user_id: context.userId,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      timezone: data.timezone,
      note: data.note,
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
