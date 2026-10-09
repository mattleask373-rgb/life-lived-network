import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./ai/run-id";
import { DRAFT_INSTRUCTIONS, draftSchema, tidyDraft } from "./draft-assist";
import type { DraftResult } from "./draft-assist.functions";

const MODEL = "openai/gpt-6-astra";

function statusOf(err: unknown): number | null {
  const e = err as { statusCode?: number; status?: number; cause?: { statusCode?: number } };
  return e?.statusCode ?? e?.status ?? e?.cause?.statusCode ?? null;
}

export async function generateDraft(text: string, hint: string | null): Promise<DraftResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "Drafting help isn't set up right now." };
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions: DRAFT_INSTRUCTIONS,
      output: Output.object({ schema: draftSchema }),
      messages: [
        {
          role: "user",
          content: `${hint ? `They are on the "${hint}" form.\n` : ""}Their words:\n"""${text}"""`,
        },
      ],
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const output = await result.output;
    return { ok: true, draft: tidyDraft(draftSchema.parse(output)) };
  } catch (err) {
    const status = statusOf(err);
    console.error("draft-assist failed", status);
    if (status === 429) return { ok: false, error: "Lots of people are drafting right now. Try again in a minute." };
    if (status === 402 || status === 403)
      return { ok: false, error: "Drafting help is unavailable at the moment. You can still write it yourself." };
    return { ok: false, error: "We couldn't draft that. You can still write it yourself." };
  }
}
