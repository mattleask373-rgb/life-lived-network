import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { cleanInput, draftInputSchema, isDraftAssistDisabled, type Draft } from "./draft-assist";
import { draftQuotaRetryMessage, parseDraftQuotaResponse } from "./draft-assist-quota";

export type DraftResult =
  | { ok: true; draft: Draft }
  | {
      ok: false;
      error: string;
      code?: "RATE_LIMITED" | "UNAVAILABLE";
      retryAfterSeconds?: number;
    };

/** Turns a signed-in person's free text into a reviewable draft. Saves nothing. */
export const draftFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const parsed = draftInputSchema.parse(input);
    return {
      text: cleanInput(parsed.text),
      hint: parsed.hint ?? null,
    };
  })
  .handler(async ({ data, context }): Promise<DraftResult> => {
    if (data.text.length < 8) return { ok: false, error: "Say a little more first." };

    // Respect the existing emergency stop before making a database call.
    // generateDraft() checks it again immediately before provider construction.
    if (isDraftAssistDisabled(process.env["DRAFT_ASSIST_DISABLED"])) {
      return {
        ok: false,
        error: "Drafting help is paused right now. You can still write it yourself.",
        code: "UNAVAILABLE",
      };
    }

    // No user ID is accepted from request input: the database function binds the
    // quota to auth.uid() from this signed-in Supabase request. Missing or invalid
    // quota evidence fails closed, before importing the paid provider path.
    const quotaClient = context.supabase as unknown as {
      rpc: (name: "consume_ai_draft_quota") => Promise<{ data: unknown; error: unknown | null }>;
    };
    let quotaResponse: { data: unknown; error: unknown | null };
    try {
      quotaResponse = await quotaClient.rpc("consume_ai_draft_quota");
    } catch {
      return {
        ok: false,
        error: "Drafting help is unavailable right now. You can still write it yourself.",
        code: "UNAVAILABLE",
      };
    }
    if (quotaResponse.error) {
      return {
        ok: false,
        error: "Drafting help is unavailable right now. You can still write it yourself.",
        code: "UNAVAILABLE",
      };
    }

    const quota = parseDraftQuotaResponse(quotaResponse.data);
    if (!quota || !quota.allowed) {
      if (quota && !quota.allowed && quota.limitKind !== "unavailable") {
        // Keep the typed result for app callers while making the transport
        // contract explicit for clients, proxies, and operational monitoring.
        setResponseStatus(429);
        setResponseHeader("Retry-After", String(quota.retryAfterSeconds));
        setResponseHeader("Cache-Control", "no-store");
        return {
          ok: false,
          error: draftQuotaRetryMessage(quota.retryAfterSeconds),
          code: "RATE_LIMITED",
          retryAfterSeconds: quota.retryAfterSeconds,
        };
      }
      return {
        ok: false,
        error: "Drafting help is unavailable right now. You can still write it yourself.",
        code: "UNAVAILABLE",
      };
    }

    const { generateDraft } = await import("./draft-assist.server");
    return generateDraft(data.text, data.hint);
  });
