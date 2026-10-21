/**
 * Pure, fail-closed eligibility seam for a future "Ask this place" context.
 *
 * This module is intentionally not wired to the UI or a model provider. The
 * current WorldEntry contract does not carry the explicit rights/review/model
 * use attestations required below, so current records cannot become eligible
 * merely because they are published, verified, or have a source URL.
 *
 * A future caller must obtain these fields from a trusted server-side contract.
 * Never map client-supplied record payloads into this shape.
 */

export const ASK_PLACE_POLICY_LIMITS = {
  questionChars: 500,
  placeOrRecordIdChars: 128,
  sourceUrlChars: 512,
  records: 8,
  recordTextChars: 1_200,
  totalTextChars: 6_000,
} as const;

export type AskPlaceContextRecord = {
  id: string;
  placeId: string;
  sourceId: string;
  sourceUrl: string;
  lastCheckedAt: string;
  text: string;
};

export type AskPlaceContextResult =
  | {
      status: "unavailable";
      reason: "invalid_place" | "invalid_question" | "no_eligible_records";
      records: [];
      citationIds: [];
    }
  | {
      status: "eligible_context";
      question: string;
      records: AskPlaceContextRecord[];
      citationIds: string[];
      contextCharacters: number;
    };

type Candidate = Record<string, unknown>;

function isObject(value: unknown): value is Candidate {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= ASK_PLACE_POLICY_LIMITS.placeOrRecordIdChars &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function cleanText(value: string, maxChars: number): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxChars);
}

function isCitableHttpUrl(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > ASK_PLACE_POLICY_LIMITS.sourceUrlChars ||
    value.trim() !== value
  ) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname.length > 0 &&
      url.username.length === 0 &&
      url.password.length === 0
    );
  } catch {
    return false;
  }
}

function eligibleRecord(candidate: unknown, placeId: string): AskPlaceContextRecord | null {
  if (!isObject(candidate)) return null;

  const {
    id,
    placeId: candidatePlaceId,
    publicationStatus,
    dataQuality,
    demonstration,
    rightsStatus,
    rightsAttestationId,
    reviewStatus,
    reviewAttestationId,
    modelUseAllowed,
    modelUseAttestationId,
    freshnessStatus,
    sourceId,
    sourceUrl,
    lastCheckedAt,
    title,
    summary,
    details,
  } = candidate;

  // All policy decisions are explicit. Missing values never inherit defaults.
  if (
    !isIdentifier(id) ||
    candidatePlaceId !== placeId ||
    publicationStatus !== "published" ||
    dataQuality !== "verified" ||
    demonstration !== false ||
    rightsStatus !== "cleared" ||
    !isIdentifier(rightsAttestationId) ||
    reviewStatus !== "approved" ||
    !isIdentifier(reviewAttestationId) ||
    modelUseAllowed !== true ||
    !isIdentifier(modelUseAttestationId) ||
    freshnessStatus !== "current" ||
    !isIdentifier(sourceId) ||
    !isCitableHttpUrl(sourceUrl) ||
    typeof lastCheckedAt !== "string" ||
    lastCheckedAt.length > 64
  ) {
    return null;
  }

  const checkedAt = Date.parse(lastCheckedAt);
  if (!Number.isFinite(checkedAt) || checkedAt > Date.now()) return null;

  if (typeof title !== "string" || typeof summary !== "string") return null;
  const safeTitle = cleanText(title, 180);
  const safeSummary = cleanText(summary, 640);
  if (!safeTitle || !safeSummary) return null;

  const safeDetails = Array.isArray(details)
    ? details
        .filter((detail): detail is string => typeof detail === "string")
        .slice(0, 4)
        .map((detail) => cleanText(detail, 180))
        .filter(Boolean)
    : [];

  const text = cleanText(
    [
      `Title: ${safeTitle}`,
      `Summary: ${safeSummary}`,
      ...safeDetails.map((detail) => `Detail: ${detail}`),
    ].join("\n"),
    ASK_PLACE_POLICY_LIMITS.recordTextChars,
  );

  if (!text) return null;

  return {
    id,
    placeId,
    sourceId,
    sourceUrl,
    lastCheckedAt,
    text,
  };
}

/**
 * Build a bounded candidate context only from records with explicit,
 * server-supplied eligibility evidence for the exact requested place.
 *
 * This does not call a model, neutralise prompt injection, verify attestations,
 * or activate the feature. Those remain separate review gates under issue #209.
 */
export function prepareAskPlaceContext(
  placeIdInput: unknown,
  questionInput: unknown,
  candidatesInput: unknown,
): AskPlaceContextResult {
  if (!isIdentifier(placeIdInput)) {
    return { status: "unavailable", reason: "invalid_place", records: [], citationIds: [] };
  }

  if (
    typeof questionInput !== "string" ||
    questionInput.trim().length === 0 ||
    questionInput.trim().length > ASK_PLACE_POLICY_LIMITS.questionChars
  ) {
    return { status: "unavailable", reason: "invalid_question", records: [], citationIds: [] };
  }

  if (!Array.isArray(candidatesInput)) {
    return {
      status: "unavailable",
      reason: "no_eligible_records",
      records: [],
      citationIds: [],
    };
  }

  const records: AskPlaceContextRecord[] = [];
  const seenIds = new Set<string>();
  let contextCharacters = 0;

  for (const candidate of candidatesInput) {
    const record = eligibleRecord(candidate, placeIdInput);
    if (!record || seenIds.has(record.id)) continue;

    const remaining = ASK_PLACE_POLICY_LIMITS.totalTextChars - contextCharacters;
    if (remaining <= 0 || records.length >= ASK_PLACE_POLICY_LIMITS.records) break;

    const boundedText = record.text.slice(0, remaining);
    if (!boundedText) continue;

    records.push({ ...record, text: boundedText });
    seenIds.add(record.id);
    contextCharacters += boundedText.length;
  }

  if (records.length === 0) {
    return {
      status: "unavailable",
      reason: "no_eligible_records",
      records: [],
      citationIds: [],
    };
  }

  return {
    status: "eligible_context",
    question: questionInput.trim(),
    records,
    citationIds: records.map((record) => record.id),
    contextCharacters,
  };
}
