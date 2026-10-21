import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const dateSchema = z
  .string()
  .regex(ISO_DATE, "Use a calendar date in YYYY-MM-DD form")
  .refine(isCalendarDate, "Use a real calendar date");

const compensationSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("stated_paid"),
      /** Integer currency minor units; no floating-point monetary values. The field is currency-neutral. */
      amountMinorUnits: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** ISO 4217-style code; market-specific allow-list validation stays upstream. */
      currency: z.string().regex(/^[A-Z]{3}$/),
      basis: z.enum(["hour", "shift", "day", "week", "project"]),
    })
    .strict(),
  z
    .object({
      status: z.literal("explicitly_unpaid"),
      classification: z.enum(["volunteering", "training", "other"]),
    })
    .strict(),
  z.object({ status: z.literal("not_stated") }).strict(),
]);

const provenanceSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("owner_declared"),
      sourceName: z.string().trim().min(1).max(160),
    })
    .strict(),
  z
    .object({
      kind: z.literal("partner_feed"),
      sourceName: z.string().trim().min(1).max(160),
      sourceUrl: z.string().url().refine(isHttpUrl, "Source URL must use HTTP or HTTPS"),
    })
    .strict(),
  z
    .object({
      kind: z.literal("curated"),
      sourceName: z.string().trim().min(1).max(160),
      sourceUrl: z.string().url().refine(isHttpUrl, "Source URL must use HTTP or HTTPS"),
    })
    .strict(),
]);

const workOpportunitySchema = z
  .object({
    arrangement: z.enum(["short_term", "seasonal", "longer_term", "professional"]),
    /** Pay/arrangement does not infer legal status: the engagement type is separately stated. */
    engagementKind: z.enum([
      "paid_work",
      "volunteering",
      "skills_exchange",
      "unpaid_training",
      "not_stated",
    ]),
    compensation: compensationSchema,
    duration: z
      .object({
        amount: z.number().finite().positive(),
        unit: z.enum(["hours", "days", "weeks", "months"]),
      })
      .strict()
      .optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    /** A missing value is not treated as accommodation being unavailable. */
    accommodation: z.enum(["offered", "not_offered", "not_stated"]),
    transportNotes: z.string().max(2000).optional(),
    skillRequirements: z.array(z.string().trim().min(1).max(160)).max(20),
    hostExpectations: z.array(z.string().trim().min(1).max(240)).max(20),
    conditions: z.array(z.string().trim().min(1).max(240)).max(30),
    /** Market-specific review is required; the schema does not infer legal compliance. */
    jurisdictionCountryCode: z.string().regex(/^[A-Z]{2}$/),
    policyReviewStatus: z.enum(["not_reviewed", "review_required", "approved_by_human"]),
    publicationStatus: z.enum(["draft", "review_required", "published", "withdrawn"]),
    provenance: provenanceSchema,
    rightsStatus: z.enum(["unreviewed", "cleared", "restricted", "withdrawn"]),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after start date",
      });
    }

    if (value.compensation.status === "explicitly_unpaid") {
      if (value.engagementKind === "paid_work") {
        context.addIssue({
          code: "custom",
          path: ["engagementKind"],
          message: "Paid work cannot have explicitly unpaid compensation",
        });
      } else if (
        value.compensation.classification === "volunteering" &&
        value.engagementKind !== "volunteering"
      ) {
        context.addIssue({
          code: "custom",
          path: ["engagementKind"],
          message: "Explicitly unpaid volunteering must use the volunteering engagement kind",
        });
      } else if (
        value.compensation.classification === "training" &&
        value.engagementKind !== "unpaid_training"
      ) {
        context.addIssue({
          code: "custom",
          path: ["engagementKind"],
          message: "Explicitly unpaid training must use the unpaid_training engagement kind",
        });
      }
    }

    if (value.publicationStatus === "published") {
      if (value.engagementKind === "not_stated") {
        context.addIssue({
          code: "custom",
          path: ["engagementKind"],
          message:
            "A published opportunity must explicitly distinguish work, volunteering, exchange, or training",
        });
      }
      if (value.policyReviewStatus !== "approved_by_human") {
        context.addIssue({
          code: "custom",
          path: ["policyReviewStatus"],
          message: "Market-specific policy review must be approved by a human before publication",
        });
      }
      if (value.rightsStatus !== "cleared") {
        context.addIssue({
          code: "custom",
          path: ["rightsStatus"],
          message: "Source rights must be cleared before publication",
        });
      }
    }
  });

export type WorkOpportunity = z.infer<typeof workOpportunitySchema>;

/** Pure runtime parser for staging/ingest boundaries; no IO or persistence. */
export function parseWorkOpportunity(input: unknown): WorkOpportunity {
  return workOpportunitySchema.parse(input);
}

/** Only reviewed, rights-cleared, explicitly classified published records surface as work. */
export function isPublishableWorkOpportunity(input: unknown): input is WorkOpportunity {
  const parsed = workOpportunitySchema.safeParse(input);
  return (
    parsed.success &&
    parsed.data.publicationStatus === "published" &&
    parsed.data.engagementKind !== "not_stated" &&
    parsed.data.policyReviewStatus === "approved_by_human" &&
    parsed.data.rightsStatus === "cleared"
  );
}
