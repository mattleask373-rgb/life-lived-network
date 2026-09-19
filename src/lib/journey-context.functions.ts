import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const journeyDraft = z.object({
  title: z.string().trim().min(1).max(120),
  startsAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
  timezone: z.string().trim().min(1).max(80),
  visibility: z.enum(["private", "friends", "journey_network", "public"]),
  opportunityOptIn: z.boolean(),
  status: z.enum(["draft", "active", "completed", "cancelled"]),
  expiresAt: z.string().datetime().nullable(),
  places: z
    .array(
      z.object({
        placeId: z.string().uuid(),
        position: z.number().int().nonnegative(),
        arrivesAt: z.string().datetime().nullable(),
        departsAt: z.string().datetime().nullable(),
      }),
    )
    .max(40),
});

export const getMyJourneyContexts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("journeys")
      .select("*, journey_places(*)")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return data ?? [];
  });

export const saveJourneyContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof journeyDraft> & { id?: string }) =>
    journeyDraft.extend({ id: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = {
      owner_id: context.userId,
      title: data.title,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      timezone: data.timezone,
      visibility: data.visibility,
      opportunity_opt_in: data.opportunityOptIn,
      status: data.status,
      expires_at: data.expiresAt,
      last_confirmed_at: new Date().toISOString(),
    };
    const query = data.id
      ? context.supabase
          .from("journeys")
          .update(row)
          .eq("id", data.id)
          .eq("owner_id", context.userId)
      : context.supabase.from("journeys").insert(row);
    const { data: saved, error } = await query.select("id").single();
    if (error) throw error;

    const { error: clearError } = await context.supabase
      .from("journey_places")
      .delete()
      .eq("journey_id", saved.id);
    if (clearError) throw clearError;
    if (data.places.length) {
      const { error: placesError } = await context.supabase.from("journey_places").insert(
        data.places.map((place) => ({
          journey_id: saved.id,
          place_id: place.placeId,
          position: place.position,
          arrives_at: place.arrivesAt,
          departs_at: place.departsAt,
        })),
      );
      if (placesError) throw placesError;
    }
    return { id: saved.id };
  });

export const removeJourneyContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("journeys")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });