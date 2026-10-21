import { describe, expect, it } from "vitest";

import {
  decideSourceLifecycle,
  type SourceLifecycleMetadata,
  type SourceRecordLifecycleInput,
} from "./source-lifecycle-policy";

const now = Date.parse("2026-10-21T12:00:00.000Z");

function source(overrides: Partial<SourceLifecycleMetadata> = {}): SourceLifecycleMetadata {
  return {
    id: "source-1",
    name: "Outside Calendar",
    attribution: "Outside Calendar",
    status: "ready",
    enabled: true,
    refreshMinutes: 60,
    consecutiveFailures: 0,
    ...overrides,
  };
}

function record(overrides: Partial<SourceRecordLifecycleInput> = {}): SourceRecordLifecycleInput {
  return {
    listingId: "listing-1",
    sourceId: "source-1",
    sourceUrl: "https://source.example/events/123",
    sourceState: "live",
    lastSeenAt: "2026-10-21T11:30:00.000Z",
    sourceUpdatedAt: null,
    ...overrides,
  };
}

function decide(
  records: SourceRecordLifecycleInput[],
  sources: SourceLifecycleMetadata[] = [source()],
) {
  return decideSourceLifecycle({
    listingId: "listing-1",
    records,
    sources: new Map(sources.map((item) => [item.id, item])),
    now,
  });
}

describe("public source lifecycle policy", () => {
  it("uses the most recent eligible live source record and its attribution", () => {
    const result = decide(
      [
        record({ sourceState: "removed", lastSeenAt: "2026-10-21T10:00:00.000Z" }),
        record({
          sourceId: "source-2",
          sourceUrl: "https://second.example/event",
          sourceState: "live",
          lastSeenAt: "2026-10-21T11:45:00.000Z",
        }),
      ],
      [source(), source({ id: "source-2", name: "Second Source", attribution: "Second Source" })],
    );

    expect(result).toMatchObject({
      eligible: true,
      reason: "eligible",
      sourceName: "Second Source",
      sourceUrl: "https://second.example/event",
      lastCheckedAt: "2026-10-21T11:45:00.000Z",
      sourceId: "source-2",
    });
  });

  it.each(["requires_review", "not_suitable", "unknown_status"])(
    "fails closed when the only supporting source is %s",
    (status) => {
      expect(decide([record()], [source({ status })])).toMatchObject({
        eligible: false,
        reason: "no_eligible_source",
      });
    },
  );

  it.each(["cancelled", "postponed", "removed"])(
    "does not discover a listing whose newest trusted record is %s",
    (sourceState) => {
      expect(
        decide([
          record({ sourceState, lastSeenAt: "2026-10-21T11:50:00.000Z" }),
          record({ sourceState: "live", lastSeenAt: "2026-10-21T11:00:00.000Z" }),
        ]),
      ).toMatchObject({ eligible: false, reason: "source_record_not_live" });
    },
  );

  it("does not let an older removed source erase a fresher independent live source", () => {
    expect(
      decide(
        [
          record({ sourceState: "removed", lastSeenAt: "2026-10-21T10:00:00.000Z" }),
          record({
            sourceId: "source-2",
            sourceUrl: "https://second.example/event",
            lastSeenAt: "2026-10-21T11:45:00.000Z",
          }),
        ],
        [source(), source({ id: "source-2", name: "Second", attribution: "Second" })],
      ),
    ).toMatchObject({ eligible: true, sourceId: "source-2" });
  });

  it("keeps historical information through a temporary source failure but degrades its quality", () => {
    expect(decide([record()], [source({ consecutiveFailures: 2 })])).toMatchObject({
      eligible: true,
      reason: "eligible",
      dataQualityOverride: "may have changed",
    });
  });

  it("does not describe paused or credential-blocked sources as freshly checked", () => {
    expect(decide([record()], [source({ enabled: false })]).dataQualityOverride).toBe(
      "may have changed",
    );
    expect(
      decide([record()], [source({ status: "requires_credentials" })]).dataQualityOverride,
    ).toBe("may have changed");
  });

  it("fails closed when evidence is missing, malformed, future-dated, or unsafe", () => {
    expect(decide([])).toMatchObject({ eligible: false, reason: "no_source_record" });
    expect(decide([record({ listingId: null })])).toMatchObject({ eligible: false });
    expect(decide([record({ lastSeenAt: "not-a-date" })])).toMatchObject({ eligible: false });
    expect(decide([record({ lastSeenAt: "2026-10-22T00:00:00.000Z" })])).toMatchObject({
      eligible: false,
    });
    expect(decide([record({ sourceUrl: "javascript:alert(1)" })])).toMatchObject({
      eligible: false,
    });
    expect(decide([record({ sourceUrl: "https://user:pass@source.example/event" })])).toMatchObject({
      eligible: false,
    });
    expect(decide([record({ sourceState: "unknown" })])).toMatchObject({ eligible: false });
  });

  it("does not let records for another listing authorize this listing", () => {
    expect(decide([record({ listingId: "other-listing" })])).toMatchObject({
      eligible: false,
      reason: "no_source_record",
    });
  });

  it("treats tied observations conservatively when one says live and another says removed", () => {
    expect(
      decide(
        [
          record({ sourceState: "live", lastSeenAt: "2026-10-21T11:30:00.000Z" }),
          record({
            sourceId: "source-2",
            sourceState: "removed",
            lastSeenAt: "2026-10-21T11:30:00.000Z",
          }),
        ],
        [source(), source({ id: "source-2", name: "Second", attribution: "Second" })],
      ),
    ).toMatchObject({ eligible: false, reason: "source_record_not_live" });
  });
});
