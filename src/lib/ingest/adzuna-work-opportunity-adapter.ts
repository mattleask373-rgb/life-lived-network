/**
 * Pure composition of the Adzuna response parser and the reviewed
 * WorkOpportunity staging bridge.
 *
 * The caller owns fetching and authorization. This module performs no network
 * requests, credential reads, persistence, source-rights approvals, or
 * publication. Canonical place resolutions must be supplied by the caller.
 */

import { parseAdzunaSearchPayload } from "./adzuna";
import {
  stageAdzunaWorkOpportunity,
  type CanonicalPlaceResolution,
  type OpportunityBridgeRejectionReason,
  type StagedExternalOpportunity,
} from "./adzuna-work-opportunity";

export interface AdzunaWorkOpportunityBatchInput {
  payload: unknown;
  countryCode: string;
  /** One explicit, timezone-bearing observation instant for this fetched batch. */
  observedAt: string;
  /** Existing canonical place-resolver output, keyed by provider external ID. */
  placeResolutions?: ReadonlyMap<string, CanonicalPlaceResolution>;
}

export interface AdzunaWorkOpportunityBatchResult {
  candidates: StagedExternalOpportunity[];
  rejected: Array<{
    externalId: string;
    reason: OpportunityBridgeRejectionReason;
  }>;
  /** Parser-level problems remain visible; they are not treated as zero supply. */
  skipped: string[];
}

/**
 * Parse and stage one provider response without making any candidate public.
 * Unknown arrangements and all other bridge failures are returned explicitly.
 */
export function stageAdzunaWorkOpportunityBatch(
  input: AdzunaWorkOpportunityBatchInput,
): AdzunaWorkOpportunityBatchResult {
  const parsed = parseAdzunaSearchPayload(input.payload, input.countryCode);
  const candidates: StagedExternalOpportunity[] = [];
  const rejected: AdzunaWorkOpportunityBatchResult["rejected"] = [];

  for (const job of parsed.jobs) {
    // This call also compile-checks that the parser's actual record shape fits
    // the bridge contract; the two modules do not maintain parallel DTOs here.
    const result = stageAdzunaWorkOpportunity(
      job,
      input.observedAt,
      input.placeResolutions?.get(job.externalId) ?? null,
    );

    if (result.status === "staged") {
      candidates.push(result.candidate);
    } else {
      rejected.push({ externalId: job.externalId, reason: result.reason });
    }
  }

  return { candidates, rejected, skipped: parsed.skipped };
}
