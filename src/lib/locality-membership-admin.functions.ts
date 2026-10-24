import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { reviewLocalityMembershipInput } from "./locality-membership-admin";

/** The deliberately narrow type for the one service-role RPC used here. */
type MembershipReviewRpc = {
  rpc: (
    functionName: "review_locality_membership",
    args: {
      _action: "grant" | "revoke";
      _actor_id: string;
      _user_id: string;
      _place_id: string;
      _verification_method: string | null;
      _evidence_reference: string | null;
      _reason_code: string;
    },
  ) => Promise<{
    data:
      | {
          membership_id: string;
          membership_status: string;
          audit_event_id: string;
        }[]
      | null;
    error: { message: string } | null;
  }>;
};

/**
 * Grant or revoke an exact-place locality membership.
 *
 * Authorization is checked with the request-scoped client before importing the
 * service-role client. The database RPC repeats the admin check, rejects
 * self-approval, and commits membership plus audit record atomically.
 */
export const reviewLocalityMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewLocalityMembershipInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminRole, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw new Error("Administrator authorization could not be verified.");
    if (!adminRole) throw new Error("Only a current administrator may review locality membership.");

    const { data: place, error: placeError } = await context.supabase
      .from("places")
      .select("id")
      .eq("id", data.placeId)
      .maybeSingle();
    if (placeError) throw new Error("The selected locality could not be verified.");
    if (!place) throw new Error("The selected locality does not exist.");

    // Load only after the request-scoped authorization check. This cast is
    // localized because generated Supabase types are refreshed from SQL by the
    // repository's later schema-type generation workflow.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rpc = supabaseAdmin as unknown as MembershipReviewRpc;
    const { data: rows, error } = await rpc.rpc("review_locality_membership", {
      _action: data.action,
      _actor_id: context.userId,
      _user_id: data.userId,
      _place_id: data.placeId,
      _verification_method: data.action === "grant" ? data.verificationMethod : null,
      _evidence_reference: data.action === "grant" ? data.evidenceReference : null,
      _reason_code: data.reasonCode,
    });

    if (error || !rows || rows.length !== 1) {
      // Do not leak privileged SQL details or report a successful mutation on an
      // unexpected/empty RPC result.
      throw new Error("The locality membership review could not be completed.");
    }

    return rows[0];
  });
