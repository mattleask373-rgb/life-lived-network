/**
 * Pure Adzuna job-search adapter primitives.
 *
 * This module deliberately does not make network calls, read credentials, resolve
 * localities, or publish listings. It converts a provider response into a
 * bounded, source-attributed staging record. A later server-side bridge must
 * verify source rights, resolve geography, attach freshness and map the record
 * into the reviewed WorkOpportunity contract before publication.
 */

import { coordinate, instant, plainText, safeUrl } from "./normalise";

export const ADZUNA_SOURCE_KEY = "adzuna-jobs";
export const ADZUNA_API_ROOT = "https://api.adzuna.com/v1/api";

const MAX_RESULTS_PER_PAGE = 50;
const MAX_PAGE = 100;
const MAX_QUERY_LENGTH = 120;

export interface AdzunaSearchInput {
  /** Provider market slug (for example "gb", "us" or "au"), not a locality. */
  market: string;
  what: string;
  where?: string;
  page?: number;
  resultsPerPage?: number;
}

/**
 * A credential-free provider request. The server adds app_id/app_key only at
 * request time and must never log the final credential-bearing URL.
 */
export interface AdzunaSearchRequest {
  path: string;
  params: URLSearchParams;
}

export function adzunaSearchRequest(input: AdzunaSearchInput): AdzunaSearchRequest {
  const market = input.market.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(market)) {
    throw new Error("Adzuna market must be a configured two-letter provider code");
  }

  const what = plainText(input.what, MAX_QUERY_LENGTH);
  if (!what) throw new Error("Adzuna search requires a non-empty service or job query");

  const rawPage = input.page ?? 1;
  if (!Number.isInteger(rawPage) || rawPage < 1 || rawPage > MAX_PAGE) {
    throw new Error(`Adzuna page must be an integer from 1 to ${MAX_PAGE}`);
  }

  const resultsPerPage = input.resultsPerPage ?? 20;
  if (
    !Number.isInteger(resultsPerPage) ||
    resultsPerPage < 1 ||
    resultsPerPage > MAX_RESULTS_PER_PAGE
  ) {
    throw new Error(`Adzuna resultsPerPage must be an integer from 1 to ${MAX_RESULTS_PER_PAGE}`);
  }

  const params = new URLSearchParams();
  params.set("what", what);
  params.set("results_per_page", String(resultsPerPage));
  params.set("content-type", "application/json");

  const where = plainText(input.where ?? "", MAX_QUERY_LENGTH);
  if (where) params.set("where", where);

  return {
    path: `/jobs/${market}/search/${rawPage}`,
    params,
  };
}

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};
}

function scalarText(value: unknown, maxLength = 200): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return plainText(String(value), maxLength);
}

function nullableText(value: unknown, maxLength = 200): string | null {
  const result = scalarText(value, maxLength);
  return result || null;
}

function positiveAmount(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function predictedFlag(value: unknown): boolean | null {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  return null;
}

/**
 * Keep the API's salary evidence rather than guessing a currency or pay period.
 * The documented search response exposes salary_min/max and
 * salary_is_predicted, but does not consistently provide the unit/currency in
 * the record example. These values are not safe for public display on their
 * own; the reviewed work contract needs explicit currency and basis.
 */
export interface AdzunaCompensationEvidence {
  minimum: number | null;
  maximum: number | null;
  salaryIsPredicted: boolean | null;
  currency: null;
  basis: null;
}

function compensationEvidence(record: RecordValue): AdzunaCompensationEvidence {
  let minimum = positiveAmount(record["salary_min"]);
  let maximum = positiveAmount(record["salary_max"]);

  if (minimum !== null && maximum !== null && minimum > maximum) {
    minimum = null;
    maximum = null;
  }

  return {
    minimum,
    maximum,
    salaryIsPredicted:
      minimum === null && maximum === null ? null : predictedFlag(record["salary_is_predicted"]),
    // Do not derive currency from locality or assume a currency exponent.
    currency: null,
    // Do not assume yearly/monthly/hourly merely because the source is a job ad.
    basis: null,
  };
}

export interface AdzunaJobRecord {
  providerKey: typeof ADZUNA_SOURCE_KEY;
  externalId: string;
  title: string;
  /** A sanitised provider snippet; source terms must permit its public reuse. */
  summary: string;
  employerName: string | null;
  countryCode: string;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  categoryLabel: string | null;
  categoryTag: string | null;
  contractType: string | null;
  contractTime: string | null;
  sourceUrl: string;
  sourceCreatedAt: string | null;
  compensationEvidence: AdzunaCompensationEvidence;
  /** Staging only. No parsed listing is automatically rights-cleared or published. */
  reviewRequired: true;
}

export interface AdzunaParseResult {
  jobs: AdzunaJobRecord[];
  skipped: string[];
}

function responseError(payload: RecordValue): string {
  return (
    plainText(payload["message"], 240) ||
    plainText(payload["error"], 240) ||
    plainText(payload["faultstring"], 240)
  );
}

/** Parse a search response without treating malformed/error payloads as empty supply. */
export function parseAdzunaSearchPayload(payload: unknown, countryCode: string): AdzunaParseResult {
  const country = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return { jobs: [], skipped: ["Configured countryCode must be a two-letter ISO code"] };
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { jobs: [], skipped: ["Provider response was not an object"] };
  }

  const response = asRecord(payload);
  const results = response["results"];
  if (!Array.isArray(results)) {
    const error = responseError(response);
    return {
      jobs: [],
      skipped: [
        error ? `Provider returned an error: ${error}` : "Provider response had no results array",
      ],
    };
  }

  const jobs: AdzunaJobRecord[] = [];
  const skipped: string[] = [];

  for (const item of results) {
    const record = asRecord(item);
    const externalId = scalarText(record["id"], 100);
    const title = plainText(record["title"], 160);
    const sourceUrl = safeUrl(record["redirect_url"]);

    if (!externalId || !title || !sourceUrl) {
      skipped.push("Skipped a result missing a stable ID, title or safe source URL");
      continue;
    }

    const location = asRecord(record["location"]);
    const company = asRecord(record["company"]);
    const category = asRecord(record["category"]);
    const locationText = nullableText(location["display_name"], 200);

    let latitude = coordinate(location["latitude"], 90);
    let longitude = coordinate(location["longitude"], 180);
    // Coordinates form a pair; never preserve one half as a real location.
    if (latitude === null || longitude === null) {
      latitude = null;
      longitude = null;
    }

    jobs.push({
      providerKey: ADZUNA_SOURCE_KEY,
      externalId,
      title,
      summary: plainText(record["description"], 1200),
      employerName: nullableText(company["display_name"], 160),
      countryCode: country,
      locationText,
      latitude,
      longitude,
      categoryLabel: nullableText(category["label"], 120),
      categoryTag: nullableText(category["tag"], 120),
      contractType: nullableText(record["contract_type"], 80)?.toLowerCase() ?? null,
      contractTime: nullableText(record["contract_time"], 80)?.toLowerCase() ?? null,
      sourceUrl,
      sourceCreatedAt: instant(record["created"]),
      compensationEvidence: compensationEvidence(record),
      reviewRequired: true,
    });
  }

  return { jobs, skipped };
}
