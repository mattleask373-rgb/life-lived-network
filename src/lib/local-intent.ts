/**
 * Global local-intent vocabulary.
 *
 * This is a deterministic interpretation boundary for acquisition/discovery
 * surfaces. It does not discover supply and does not rank providers.
 * Canonical possibility discovery remains findSupply().
 */

export type LocalIntentType =
  | "service" | "need" | "job" | "capability" | "community"
  | "guide" | "discovery" | "journey" | "unknown";

export interface LocalIntent {
  rawQuery: string;
  intentType: LocalIntentType;
  category?: string;
  skill?: string;
  localityId?: string | null;
  localitySlug?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  earningIntent?: boolean;
  contributionIntent?: boolean;
  journeyIntent?: boolean;
  communityIntent?: boolean;
  confidence: "high" | "supported" | "unknown";
}

export function localIntentFromContext(input: {
  rawQuery: string;
  intentType?: LocalIntentType;
  category?: string | null;
  skill?: string | null;
  localityId?: string | null;
  localitySlug?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  earningIntent?: boolean;
  contributionIntent?: boolean;
  journeyIntent?: boolean;
  communityIntent?: boolean;
}): LocalIntent {
  const hasStructuredSignal = Boolean(
    input.intentType || input.category || input.skill ||
      input.localityId || input.localitySlug || input.startTime || input.endTime ||
      input.earningIntent || input.contributionIntent || input.journeyIntent ||
      input.communityIntent,
  );
  return {
    rawQuery: input.rawQuery,
    intentType: input.intentType ?? "unknown",
    ...(input.category ? { category: input.category } : {}),
    ...(input.skill ? { skill: input.skill } : {}),
    localityId: input.localityId ?? null,
    localitySlug: input.localitySlug ?? null,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    ...(input.earningIntent !== undefined ? { earningIntent: input.earningIntent } : {}),
    ...(input.contributionIntent !== undefined ? { contributionIntent: input.contributionIntent } : {}),
    ...(input.journeyIntent !== undefined ? { journeyIntent: input.journeyIntent } : {}),
    ...(input.communityIntent !== undefined ? { communityIntent: input.communityIntent } : {}),
    confidence: hasStructuredSignal ? "supported" : "unknown",
  };
}
