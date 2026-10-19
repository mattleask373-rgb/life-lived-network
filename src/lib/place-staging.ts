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
  return Number.isFinite(Date.parse(value)) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

const sourceSchema = z
  .object({
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
  })
  .strict();

const stagedPlaceSchema = z
  .object({
    sourceKey: z.string().trim().min(1).max(320),
    name: z.string().trim().min(1).max(200),
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
  })
  .strict()
  .superRefine((row, context) => {
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
  /** Parent source keys from a separately reviewed crosswalk only. */
  knownParentSourceKeys?: readonly string[];
}

const MAX_BATCH_SIZE = 5000;

/**
 * Pure staging validation: no database client, generated ID, import, or publish.
 * Only an entirely clean batch is eligible for a separate disposable-DB preview.
 */
export function normalizeStagedPlaceBatch(
  input: unknown,
  options: PlaceStageOptions = {},
): PlaceStageReport {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_BATCH_SIZE) {
    const total = Array.isArray(input) ? input.length : 0;
    return {
      rows: [],
      issues: [
        {
          rowIndex: -1,
          code: "invalid_row",
          message: `Batch must contain between 1 and ${MAX_BATCH_SIZE} rows`,
        },
      ],
      eligibleForDisposablePreview: false,
      summary: { total, eligible: 0, blocked: total },
    };
  }

  const issues: PlaceStageIssue[] = [];
  const rowReasons = new Map<number, Set<PlaceStageIssueCode>>();
  const addIssue = (
    rowIndex: number,
    sourceKey: string | undefined,
    code: PlaceStageIssueCode,
    message: string,
  ) => {
    const reasons = rowReasons.get(rowIndex) ?? new Set<PlaceStageIssueCode>();
    reasons.add(code);
    rowReasons.set(rowIndex, reasons);
    issues.push({ rowIndex, ...(sourceKey ? { sourceKey } : {}), code, message });
  };

  const parsed = input.map((value, rowIndex) => {
    const result = stagedPlaceSchema.safeParse(value);
    if (!result.success) {
      addIssue(
        rowIndex,
        typeof value === "object" &&
          value !== null &&
          "sourceKey" in value &&
          typeof value.sourceKey === "string"
          ? value.sourceKey
          : undefined,
        "invalid_row",
        result.error.issues
          .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`)
          .join("; "),
      );
      return null;
    }
    return { rowIndex, data: result.data };
  });

  const validRows = parsed.filter((row): row is NonNullable<typeof row> => row !== null);
  const firstKeyIndex = new Map<string, number>();
  const firstSlugIndex = new Map<string, number>();
  const rowByKey = new Map<string, { rowIndex: number; data: StagedPlaceInput }>();

  for (const item of validRows) {
    const { rowIndex, data } = item;
    const previousKey = firstKeyIndex.get(data.sourceKey);
    if (previousKey !== undefined) {
      addIssue(
        rowIndex,
        data.sourceKey,
        "duplicate_source_key",
        "Source key appears more than once",
      );
      addIssue(
        previousKey,
        data.sourceKey,
        "duplicate_source_key",
        "Source key appears more than once",
      );
    } else {
      firstKeyIndex.set(data.sourceKey, rowIndex);
      rowByKey.set(data.sourceKey, item);
    }

    const previousSlug = firstSlugIndex.get(data.slug);
    if (previousSlug !== undefined) {
      addIssue(rowIndex, data.sourceKey, "duplicate_slug", "Slug must be globally unique");
      addIssue(previousSlug, data.sourceKey, "duplicate_slug", "Slug must be globally unique");
    } else {
      firstSlugIndex.set(data.slug, rowIndex);
    }

    if (data.latitude === null || data.longitude === null) {
      addIssue(
        rowIndex,
        data.sourceKey,
        "missing_coordinates",
        "Place-level coordinates are required before staging preview",
      );
    }
    if (data.source.reviewStatus !== "approved_by_human") {
      addIssue(
        rowIndex,
        data.sourceKey,
        "source_review_pending",
        "Source and its intended use need human approval",
      );
    }
    if (data.source.rightsStatus !== "cleared") {
      addIssue(
        rowIndex,
        data.sourceKey,
        "rights_not_cleared",
        "Source licence and attribution rights are not cleared",
      );
    }
    if (data.sourceDataStatus !== "current") {
      addIssue(
        rowIndex,
        data.sourceKey,
        "source_not_current",
        "Only current source-confirmed places may enter staging preview",
      );
    }
  }

  const knownParents = new Set(options.knownParentSourceKeys ?? []);
  for (const item of validRows) {
    const parentKey = item.data.parentSourceKey;
    if (parentKey && !rowByKey.has(parentKey) && !knownParents.has(parentKey)) {
      addIssue(
        item.rowIndex,
        item.data.sourceKey,
        "missing_parent",
        "Parent must be in this batch or an explicitly reviewed crosswalk",
      );
    }
  }

  const complete = new Set<string>();
  const cycleKeys = new Set<string>();
  for (const startKey of rowByKey.keys()) {
    if (complete.has(startKey)) continue;
    const path: string[] = [];
    const positions = new Map<string, number>();
    let current: string | null = startKey;
    while (current && rowByKey.has(current) && !complete.has(current)) {
      const seenAt = positions.get(current);
      if (seenAt !== undefined) {
        for (const key of path.slice(seenAt)) cycleKeys.add(key);
        break;
      }
      positions.set(current, path.length);
      path.push(current);
      current = rowByKey.get(current)?.data.parentSourceKey ?? null;
    }
    for (const key of path) complete.add(key);
  }
  for (const key of cycleKeys) {
    const item = rowByKey.get(key);
    if (item) {
      addIssue(item.rowIndex, key, "parent_cycle", "Parent relationships must be acyclic");
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const item of validRows) {
      const parentKey = item.data.parentSourceKey;
      const parent = parentKey ? rowByKey.get(parentKey) : undefined;
      if (!parent || !rowReasons.has(parent.rowIndex) || rowReasons.has(item.rowIndex)) continue;
      addIssue(
        item.rowIndex,
        item.data.sourceKey,
        "missing_parent",
        "Parent is blocked; this child cannot be previewed independently",
      );
      changed = true;
    }
  }

  const rows = validRows.map(({ rowIndex, data }): NormalizedStagedPlace => {
    const reasons = [...(rowReasons.get(rowIndex) ?? [])];
    return {
      sourceKey: data.sourceKey,
      name: data.name,
      slug: data.slug,
      kind: data.kind,
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
    };
  });

  const eligible = rows.filter((row) => row.status === "eligible_for_disposable_preview").length;
  const blocked = input.length - eligible;
  return {
    rows,
    issues,
    eligibleForDisposablePreview:
      input.length === rows.length && issues.length === 0 && eligible === rows.length,
    summary: { total: input.length, eligible, blocked },
  };
}
