import { z } from "zod";

const userId = z.string().uuid();
const placeId = z.string().uuid();
const evidenceReference = z
  .string()
  .trim()
  .min(3)
  .max(160)
  .regex(/^(?!.*https?:\/\/)[A-Za-z0-9._:/-]+$/i);

export const reviewLocalityMembershipInput = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("grant"),
      userId,
      placeId,
      reasonCode: z.enum(["locality_relationship_verified", "local_steward_attestation"]),
      verificationMethod: z.enum([
        "in_person",
        "local_steward",
        "document_checked",
        "other_reviewed",
      ]),
      evidenceReference,
    })
    .strict(),
  z
    .object({
      action: z.literal("revoke"),
      userId,
      placeId,
      reasonCode: z.enum([
        "member_request",
        "verification_expired",
        "steward_review",
        "admin_correction",
      ]),
    })
    .strict(),
]);

export type ReviewLocalityMembershipInput = z.infer<typeof reviewLocalityMembershipInput>;
