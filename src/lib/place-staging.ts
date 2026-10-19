import { z } from "zod";

import type { PlaceKind } from "./places";

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

function isOffsetDateTime(value: string): boolean {
  return (
    Number.isFinite(Date.parse(value)) &&
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  );
}

const sourceSchema = z.object({
  sourceKey: z.string().trim().min(1).max(240),
  sourceName: z.string().trim().min(1).max(160),
  sourceUrl: z.string().url().refine(isHttpUrl, "Source URL must use HTTP or HTTPS"),
  licenseName: z.string().trim().min(1).max(160),
  licenseUrl: z.string().url().refine(isHttpUrl, "Licence URL must use HTTP or HTTPS"),
  attribution: z.string().trim().min(1).max(1000),
  version: z.string().trim().min(1).max(120),
  retrievedAt: z.string().refine(isOffsetDateTime, "Use an ISO date-time with timezone"),
  reviewStatus: z.enum(["pending", "approved_by_human", "rejected"]),
  rightsStatus: z.enum(["unreviewed", "cleared", "restricted", "withdrawn"]),
}).strict();

const stagedPlaceSchema = z.object({
  /** Stable, source-qualified identity; never a database UUID or generated ID. */
  sourceKey: z.string().trim().min(1).max(320),
  name: z.string().trim().min(1).max(200),
  /** Current PlaceIndex is keyed globally by slug, so collisions fail closed. */
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  kind: z.enum(["country", "region", "area", "city", "town", "village", "neighbourhood"]),
  parentSourceKey: z.string().trim().min(1).max(320).nullable(),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  timezone: z.string().min(1).refine(isIanaTimeZone, "Timezone must be a valid IANA identifier"),
  latitude: z.number().finite().min(-90).max(90).nullable(),
  longitude: z.number().finite().min(-180).max(180).nullable(),
  blurb: z.string().max(1000),
  sourceDataStatus: z.enum(["current", "historical", "unconfirmed", "unknown"]),
  source: sourceSchema,
}).strict().superRefine((row, context) => {
  if ((row.latitude === null) !== (row.longitude === null)) {
    context.addIssue({
      code: "custom",
      path: ["longitude"],
      message: "Latitude and longitude must both be present or both be null",
    });
  }
  if (row.parentSourceKey === row.sourceKey) {
    context.addIssue({
      code: "custom",
      path: ["parentSourceKey"],
      message: "A place cannot be its own parent",
    });
  }
  if (row.sourceKey !== row.source.sourceKey) {
    context.addIssue({
      code: "custom",
      path: ["source", "sourceKey"],
      message: "Source key must match the source-qualified row key",
    });
  }
});

export type StagedPlaceInput = z.infer<typeof stagedPlaceSchema>;

export type PlaceStageIssueCode =
  | "invalid_row"
  | "duplicate_source_key"
  | "duplicate_slug"
  | "missing_parent"
  | "self_parent"
  | "parent_cycle"
  | "missing_coordinates"
  | "source_review_pending"
  | "rights_not_cleared"
  | "source_not_current";

export interface PlaceStageIssue {
  rowIndex: number;
  sourceKey?: string;
  code: PlaceStageIssueCode;
  message: string;
}

export interface NormalizedStagedPlace {
  sourceKey: string;
  name: string;
  slug: string;
  kind: PlaceKind;
  parentSourceKey: string | null;
  countryCode: string;
  currency: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  blurb: string;
  source: StagedPlaceInput["source"];
  sourceDataStatus: StagedPlaceInput["sourceDataStatus"];
  /** Staging normalization never publishes a place or writes a database row. */
  publicationStatus: "not_published";
  status: "blocked" | "eligible_for_disposable_preview";
  reasons: PlaceStageIssueCode[];
}

export interface PlaceStageReport {
  rows: NormalizedStagedPlace[];
  issues: PlaceStageIssue[];
  eligibleForDisposablePreview: boolean;
  summary: {
    total: number;
    eligible: number;
    blocked: number;
  };
}

export interface PlaceStageOptions {
  /** Existing source keys must come from a reviewed crosswalk, not slug guessing. */
  knownParentSourceKeys?: readonly string[];
}

const MAX_BATCH_SIZE = 5000;

/**
 * Validate/normalize a bounded source batch without IO or side effects.
 * The batch must include its full parent hierarchy unless a parent is supplied
 * by an explicitly reviewed source-key crosswalk. No canonical IDs are created.
 */
export function normalizeStagedPlaceBatch(
  input: unknown,
  options: PlaceStageOptions = {},
): PlaceStageReport {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_BATCH_SIZE) {
    return {
      rows: [],
      issues: [{
        rowIndex: -1,
        code: "invalid_row",
        message: `Batch must contain between 1 and ${MAX_BATCH_SIZE} rows`,
      }],
      eligibleForDisposablePreview: false,
      summary: { total: Array.isArray(input) ? input.length : 0, eligible: 0, blocked: 0 },
    };
  }

  const issues: PlaceStageIssue[] = [];
  const parsedRows: Array<{ rowIndex: number; data: StagedPlaceInput } | null> = input.map(
    (value, rowIndex) => {
      const result = stagedPlaceSchema.safeParse(value);
      if (!result.success) {
        issues.push({
          rowIndex,
          code: "invalid_row",
          message: result.error.issues
            .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`)
            .join("; "),
        });
        return null;
      }
      return { rowIndex, data: result.data };
    },
  );

  const rowIssues = new Map<number, Set<PlaceStageIssueCode>>();
  const addIssue = (
    rowIndex: number,
    sourceKey: string | undefined,
    code: PlaceStageIssueCode,
    message: string,
  ) => {
    const codes = rowIssues.get(rowIndex) ?? new Set<PlaceStageIssueCode>();
    codes.add(code);
    rowIssues.set(rowIndex, codes);
    issues.push({ rowIndex, ...(sourceKey ? { sourceKey } : {}), code, message });
  };

  const firstKeyIndex = new Map<string, number>();
  const firstSlugIndex = new Map<string, number>();
  for (const item of parsedRows) {
    if (!item) continue;
    const { rowIndex, data } = item;
    const previousKey = firstKeyIndex.get(data.sourceKey);
    if (previousKey !== undefined) {
      addIssue(rowIndex, data.sourceKey, "duplicate_source_key", "Source key appears more than once");
      addIssue(previousKey, data.sourceKey, "duplicate_source_key", "Source key appears more than once");
    } else {
      firstKeyIndex.set(data.sourceKey, rowIndex);
    }
    const previousSlug = firstSlugIndex.get(data.slug);
    if (previousSlug !== undefined) {
      addIssue(rowIndex, data.sourceKey, "duplicate_slug", "Slug must be globally unique in the current PlaceIndex");
      addIssue(previousSlug, data.sourceKey, "duplicate_slug", "Slug must be globally unique in the current PlaceIndex");
    } else {
      firstSlugIndex.set(data.slug, rowIndex);
    }
    if (data.latitude === null || data.longitude === null) {
      addIssue(rowIndex, data.sourceKey, "missing_coordinates", "Place-level coordinates are required before staging preview");
    }
    if (data.source.reviewStatus !== "approved_by_human") {
      addIssue(rowIndex, data.sourceKey, "source_review_pending", "Source and its intended use need human approval");
    }
    if (data.source.rightsStatus !== "cleared") {
      addIssue(rowIndex, data.sourceKey, "rights_not_cleared", "Source licence and attribution rights are not cleared");
    }
    if (data.sourceDataStatus !== "current") {
      addIssue(rowIndex, data.sourceKey, "source_not_current", "Only current, source-confirmed place records may enter a staging preview");
    }
  }

  const parsedByKey = new Map<string, { rowIndex: number; data: StagedPlaceInput }>();
  for (const item of parsedRows) {
    if (item && !parsedByKey.has(item.data.sourceKey)) parsedByKey.set(item.data.sourceKey, item);
  }
  const knownParents = new Set(options.knownParentSourceKeys ?? []);
  for (const item of parsedRows) {
    if (!item || !item.data.parentSourceKey) continue;
    const { rowIndex, data } = item;
    if (
      !parsedByKey.has(data.parentSourceKey) &&
      !knownParents.has(data.parentSourceKey)
    ) {
      addIssue(rowIndex, data.sourceKey, "missing_parent", "Parent must be present in this batch or an explicitly reviewed crosswalk");
    }
  }

  // Walk parent chains iteratively to detect cycles without recursive stack growth.
  const completed = new Set<string>();
  const cycleKeys = new Set<string>();
  for (const startKey of parsedByKey.keys()) {
    if (completed.has(startKey)) continue;
    const trail: string[] = [];
    const positions = new Map<string, number>();
    let current: string | null = startKey;
    while (current && parsedByKey.has(current) && !completed.has(current)) {
      const seenAt = positions.get(current);
      if (seenAt !== undefined) {
        for (const cycleKey of trail.slice(seenAt)) cycleKeys.add(cycleKey);
        break;
      }
      positions.set(current, trail.length);
      trail.push(current);
      current = parsedByKey.get(current)?.data.parentSourceKey ?? null;
    }
    for (const key of trail) completed.add(key);
  }

  for (const key of cycleKeys) {
    const item = parsedByKey.get(key);
    if (item) addIssue(item.rowIndex, key, "parent_cycle", "Parent relationships must be acyclic");
  }

  // A child is blocked when its parent cannot pass staging checks.
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of parsedRows) {
      if (!item || !item.data.parentSourceKey) continue;
      const parent = parsedByKey.get(item.data.parentSourceKey);
      if (!parent) continue;
      const parentBlocked = rowIssues.has(parent.rowIndex);
      const childCodes = rowIssues.get(item.rowIndex);
      if (parentBlocked && !childCodes?.has("missing_parent")) {
        if (!childCodes?.has("source_not_current") && !childCodes?.has("parent_cycle")) {
          const before = childCodes?.size ?? 0;
          addIssue(item.rowIndex, item.data.sourceKey, "missing_parent", "Parent is blocked; this child cannot be previewed independently");
          if ((rowIssues.get(item.rowIndex)?.size ?? 0) !== before) changed = true;
        }
      }
    }
  }

  const rows: NormalizedStagedPlace[] = parsedRows.flatMap((item) => {
    if (!item) return [];
    const { rowIndex, data } = item;
    const reasons = [...(rowIssues.get(rowIndex) ?? [])];
    return [{
      sourceKey: data.sourceKey,
      name: data.name,
      slug: data.slug,
      kind: data.kind as PlaceKind,
      parentSourceKey: data.parentSourceKey,
      countryCode: data.countryCode,
      currency: data.currency,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude,
      blurb: data.blurb,
      source: data.source,
      sourceDataStatus: data.sourceDataStatus,
      publicationStatus: "not_published",
      status: reasons.length ? "blocked" : "eligible_for_disposable_preview",
      reasons,
    }];
  });

  const eligible = rows.filter((row) => row.status === "eligible_for_disposable_preview").length;
  const blocked = rows.length - eligible;
  return {
    rows,
    issues,
    eligibleForDisposablePreview: rows.length > 0 && issues.length === 0 && eligible === rows.length,
    summary: { total: input.length, eligible, blocked: input.length - eligible },
  };
}
