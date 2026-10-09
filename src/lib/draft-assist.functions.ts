import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cleanInput, DRAFT_KINDS, type Draft } from "./draft-assist";

export type DraftResult = { ok: true; draft: Draft } | { ok: false; error: string };

/** Turns a signed-in person's free text into a reviewable draft. Saves nothing. */
export const draftFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; hint?: string | null }) => ({
    text: cleanInput(String(input?.text ?? "")),
    hint: DRAFT_KINDS.includes(input?.hint as never) ? (input.hint as string) : null,
  }))
  .handler(async ({ data }): Promise<DraftResult> => {
    if (data.text.length < 8) return { ok: false, error: "Say a little more first." };
    const { generateDraft } = await import("./draft-assist.server");
    return generateDraft(data.text, data.hint);
  });
