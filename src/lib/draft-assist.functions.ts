import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cleanInput, draftInputSchema, type Draft } from "./draft-assist";

export type DraftResult = { ok: true; draft: Draft } | { ok: false; error: string };

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
  .handler(async ({ data }): Promise<DraftResult> => {
    if (data.text.length < 8) return { ok: false, error: "Say a little more first." };
    const { generateDraft } = await import("./draft-assist.server");
    return generateDraft(data.text, data.hint);
  });
