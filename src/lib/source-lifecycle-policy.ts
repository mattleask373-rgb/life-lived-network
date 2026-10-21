/**
 * Public-read policy for imported listings.
 *
 * This is deliberately pure: it consumes the canonical listing's linked source
 * records and source metadata. It never queries Supabase, changes a row, infers
 * availability, or participates in Need matching.
 *
 * A transient failure, missing credential, or operator pause is not the same as
 * rights withdrawal: old information may remain visible with degraded freshness.
 * An explicitly unsuitable / review-held source cannot independently support a
 * public claim. A linked listing is discoverable only when the most recently
 * observed trusted source record says it is live.
 */

export type SourceRecordState = "live" | "cancelled" | "postponed" | "removed";
export type SourceLifecycleStatus =
  | "ready"
  | "requires_credentials"
  | "requires_review"
  | "not_suitable";

export interface SourceRecordLifecycleInput {
  listingId: string | null;
  sourceId: string;
  sourceUrl: string;
  sourceState: string;
  lastSeenAt: string | null;
  sourceUpdatedAt?: string | null;
}

export interface SourceLifecycleMetadata {
  id: string;
  name: string;
  attribution: string;
  status: string;
  enabled: boolean;
  refreshMinutes: number;
  consecutiveFailures: number;
}

export interface SourceLifecycleDecision {
  eligible: boolean;
  reason:
    | "eligible"
    | "no_source_record"
    | "no_eligible_source"
    | "source_record_not_live"
    | "invalid_source_evidence";
  sourceName?: string;
  sourceUrl?: string;
  lastCheckedAt?: string;
  /** When set, this value overrides listing data_quality before normalization. */
  dataQualityOverride?: "recently updated" | "may have changed";
  sourceId?: string;
}

interface Candidate {
  record: SourceRecordLifecycleInput;
  source: SourceLifecycleMetadata;
  checkedAt: number;
  sourceUpdatedAt: number | null;
}

const MIN_REFRESH_MINUTES = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function publicHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || !url.hostname) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Only statuses that retain source-use authority can support public listing facts. */
function sourceMaySupportPublicRead(source: SourceLifecycleMetadata): boolean {
  return source.status === "ready" || source.status === "requires_credentials";
}

function isKnownState(value: string): value is SourceRecordState {
  return value === "live" || value === "cancelled" || value === "postponed" || value === "removed";
}

function candidateFor(
  record: SourceRecordLifecycleInput,
  sources: ReadonlyMap<string, SourceLifecycleMetadata>,
  nowMs: number,
): Candidate | null {
  if (!record.listingId || !record.sourceId || !isKnownState(record.sourceState)) return null;
  const source = sources.get(record.sourceId);
  if (!source || !sourceMaySupportPublicRead(source)) return null;

  const sourceUrl = publicHttpUrl(record.sourceUrl);
  const sourceName = (source.attribution || source.name).trim();
  if (!sourceUrl || !sourceName) return null;

  const checkedAt = record.lastSeenAt ? Date.parse(record.lastSeenAt) : Number.NaN;
  if (!Number.isFinite(checkedAt) || checkedAt > nowMs) return null;

  const updatedAt = record.sourceUpdatedAt ? Date.parse(record.sourceUpdatedAt) : Number.NaN;
  return {
    record: { ...record, sourceUrl, sourceState: record.sourceState, sourceId: source.id },
    source: { ...source, attribution: sourceName },
    checkedAt,
    sourceUpdatedAt: Number.isFinite(updatedAt) && updatedAt <= nowMs ? updatedAt : null,
  };
}

/**
 * Evaluate one canonical listing's source links. The freshest eligible linked
 * record decides its state. This permits a newer independent live source to
 * preserve a listing when an older linked source has withdrawn it; a newest
 * cancelled/postponed/removed observation cannot be hidden by an older live one.
 *
 * A source in requires_review/not_suitable (or with unknown status) is excluded.
 * If no other eligible source remains, the imported listing fails closed.
 */
export function decideSourceLifecycle(input: {
  listingId: string;
  records: readonly SourceRecordLifecycleInput[];
  sources: ReadonlyMap<string, SourceLifecycleMetadata>;
  now?: number;
}): SourceLifecycleDecision {
  if (!input.records.length) {
    return { eligible: false, reason: "no_source_record" };
  }

  const nowMs = input.now ?? Date.now();
  const candidates = input.records
    .filter((record) => record.listingId === input.listingId)
    .map((record) => candidateFor(record, input.sources, nowMs))
    .filter((candidate): candidate is Candidate => candidate !== null)
    .sort((a, b) => {
      const time = b.checkedAt - a.checkedAt;
      if (time !== 0) return time;
      // On equal observation time, fail closed if the sources disagree.
      const statePriority = (state: SourceRecordState) => (state === "live" ? 0 : 1);
      return (
        statePriority(b.record.sourceState as SourceRecordState) -
        statePriority(a.record.sourceState as SourceRecordState)
      );
    });

  if (!candidates.length) {
    const listingRecords = input.records.filter((record) => record.listingId === input.listingId);
    if (!listingRecords.length) return { eligible: false, reason: "no_source_record" };
    const policyHeld = listingRecords.some((record) => {
      const source = input.sources.get(record.sourceId);
      return source !== undefined && !sourceMaySupportPublicRead(source);
    });
    return {
      eligible: false,
      reason: policyHeld ? "no_eligible_source" : "invalid_source_evidence",
    };
  }

  const latest = candidates[0]!;
  if (latest.record.sourceState !== "live") {
    return { eligible: false, reason: "source_record_not_live" };
  }

  const checkedAt = latest.checkedAt;
  const ageMs = nowMs - checkedAt;
  const configuredMinutes = latest.source.refreshMinutes;
  const refreshMs =
    (Number.isFinite(configuredMinutes) && configuredMinutes >= 1
      ? Math.max(configuredMinutes, MIN_REFRESH_MINUTES)
      : 60) * MINUTE_MS;

  const sourceHealthy =
    latest.source.enabled &&
    latest.source.status === "ready" &&
    latest.source.consecutiveFailures === 0;
  let dataQualityOverride: SourceLifecycleDecision["dataQualityOverride"];
  if (!sourceHealthy || ageMs > refreshMs * 3) {
    // Preserve prior knowledge, but do not represent it as currently checked.
    dataQualityOverride = "may have changed";
  } else if (
    latest.sourceUpdatedAt !== null &&
    nowMs - latest.sourceUpdatedAt <= DAY_MS &&
    nowMs >= latest.sourceUpdatedAt &&
    ageMs <= refreshMs
  ) {
    dataQualityOverride = "recently updated";
  }

  return {
    eligible: true,
    reason: "eligible",
    sourceName: latest.source.attribution,
    sourceUrl: latest.record.sourceUrl,
    lastCheckedAt: new Date(checkedAt).toISOString(),
    sourceId: latest.source.id,
    ...(dataQualityOverride ? { dataQualityOverride } : {}),
  };
}
