import { z } from "zod";

/**
 * Shape of an AI-assisted draft. The model only restructures the person's own
 * words: anything they didn't say stays empty and is listed in `missing`.
 * Nothing here is ever saved without the person reviewing and posting it.
 */
export const DRAFT_KINDS = ["need", "offer", "place"] as const;
export type DraftKind = (typeof DRAFT_KINDS)[number];

export const draftSchema = z
  .object({
    kind: z.enum(DRAFT_KINDS),
    title: z.string(),
    category: z.string(),
    summary: z.string(),
    details: z.array(z.string()),
    missing: z.array(z.string()),
  })
  .strict();
export type Draft = z.infer<typeof draftSchema>;

export const MAX_INPUT = 2000;

export function cleanInput(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_INPUT);
}

/** Never let a draft carry more than a person would review at a glance. */
export function tidyDraft(d: Draft): Draft {
  const t = (s: string, n: number) => s.trim().slice(0, n);
  return {
    kind: d.kind,
    title: t(d.title, 120),
    category: t(d.category, 40).toLowerCase(),
    summary: t(d.summary, 400),
    details: d.details.map((x) => t(x, 200)).filter(Boolean).slice(0, 6),
    missing: d.missing.map((x) => t(x, 120)).filter(Boolean).slice(0, 6),
  };
}

export const DRAFT_INSTRUCTIONS = `You help a member of a local community app turn their own words into a clear draft of a need (something they want help with), an offer (time or skill they can give, or work they offer) or a place (somewhere real, an event or project).
Rules:
- Use ONLY facts the person stated. Never invent names, prices, times, dates, addresses, qualifications, availability or people.
- Do not add exact addresses even if given; keep place to area level.
- If something useful is unknown (when, where, cost, how long, who it's for), leave it out and list it briefly in "missing" as a question for them.
- title: one plain line, under 80 characters. category: one or two lowercase words (e.g. gardening). summary: one or two plain sentences in their voice. details: short factual lines they stated.
- Choose kind from need/offer/place by what they said; if unclear prefer the closest and mention it in missing.
- Write in British English, calm and plain. No marketing language.`;
