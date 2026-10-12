/**
 * Input shapes for server actions that previously trusted the caller's types.
 * Validation rejects malformed requests early; it does not replace the
 * row-level and role checks done on the server and in the database.
 */
import { z } from "zod";

export const moveConnectionInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["sent", "accepted", "declined", "withdrawn"]),
});

export const needIdInput = z.object({ needId: z.string().uuid() });

export const refreshSourceInput = z.object({
  sourceId: z.string().uuid(),
  placeSlug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  days: z.number().int().min(1).max(60).optional(),
  force: z.boolean().optional(),
});

const timezoneInput = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid time zone.");

const timestampInput = z.string().datetime().nullable();

/**
 * Runtime boundary for posting a need. TypeScript interfaces disappear over
 * the network, so every field has explicit bounds and enums. Strict mode also
 * prevents clients from writing database-owned columns such as creator_id,
 * status, timestamps or expiry through this server action.
 */
export const createNeedInput = z
  .object({
    category: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .transform((value) => value.toLowerCase()),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(4000),
    intent: z.enum([
      "paid_work",
      "one_off_work",
      "recurring_work",
      "professional_service",
      "help",
      "community_project",
      "volunteering",
      "skills_exchange",
    ]),
    place_id: z.string().uuid().nullable(),
    place_text: z.string().trim().max(200),
    lat: z.number().finite().min(-90).max(90).nullable(),
    lng: z.number().finite().min(-180).max(180).nullable(),
    timezone: timezoneInput,
    starts_at: timestampInput,
    ends_at: timestampInput,
    duration_minutes: z.number().int().min(1).max(1440).nullable(),
    flexibility: z.enum(["fixed", "some", "very"]),
    budget: z.number().finite().min(0).max(1_000_000).nullable(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    payment_type: z.enum(["paid", "exchange", "contribution", "unsure"]),
    required_skills: z.array(z.string().trim().min(1).max(100)).max(20),
    required_qualifications: z.array(z.string().trim().min(1).max(150)).max(20),
    recurring: z.boolean(),
    urgency: z.enum(["today", "soon", "whenever"]),
    visibility: z.enum(["private", "local_discovery", "public"]),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.starts_at && value.ends_at) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "An end time needs a start time.",
      });
      return;
    }

    if (
      value.starts_at &&
      value.ends_at &&
      Date.parse(value.ends_at) <= Date.parse(value.starts_at)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "The end time must be after the start time.",
      });
    }
  });

export type CreateNeedInput = z.infer<typeof createNeedInput>;

export interface CanonicalNeedPlace {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  currency: string;
}

/**
 * Place metadata is a server-owned fact, not client-supplied location. When
 * a canonical place is selected, persist only its centre, name, clock and
 * currency. With no canonical place selected, keep the request unlocated.
 */
export function canonicalizeNeedPlace(
  input: CreateNeedInput,
  place: CanonicalNeedPlace | null,
): CreateNeedInput {
  if (input.place_id === null) {
    return {
      ...input,
      place_id: null,
      place_text: "Nearby",
      lat: null,
      lng: null,
      timezone: "UTC",
      currency: "EUR",
    };
  }

  if (!place || place.id !== input.place_id) {
    throw new Error("Choose a valid locality before posting a need.");
  }

  return {
    ...input,
    place_id: place.id,
    place_text: place.name,
    lat: place.lat,
    lng: place.lng,
    timezone: place.timezone,
    currency: place.currency,
  };
}
