import { describe, expect, it } from "vitest";

import type { ServiceArea } from "./capability";
import {
  buildServiceAreaSelections,
  MAX_SERVICE_AREA_SELECTIONS,
  parseServiceAreaUpdate,
} from "./service-area-selections";

const BIRMINGHAM = "550e8400-e29b-41d4-a716-446655440000";
const BRIGHTON = "550e8400-e29b-41d4-a716-446655440001";
const LISBON = "550e8400-e29b-41d4-a716-446655440002";

function area(
  placeId: string,
  relation: ServiceArea["relation"],
  travelWillingness: ServiceArea["travelWillingness"] = "local",
): Pick<ServiceArea, "placeId" | "relation" | "travelWillingness"> {
  return { placeId, relation, travelWillingness };
}

describe("service area selection conversion", () => {
  it("preserves explicit relationships for places that remain selected", () => {
    const result = buildServiceAreaSelections(
      [
        area(BIRMINGHAM, "available_in", "will_travel"),
        area(BRIGHTON, "travelling_through", "anywhere"),
      ],
      [],
      [BIRMINGHAM],
      [BRIGHTON],
    );

    expect(result).toEqual([
      { placeId: BIRMINGHAM, relation: "available_in", travelWillingness: "will_travel" },
      { placeId: BRIGHTON, relation: "travelling_through", travelWillingness: "anywhere" },
    ]);
  });

  it("does not convert a journey-only place into a service area when another place changes", () => {
    const result = buildServiceAreaSelections(
      [area(BRIGHTON, "travelling_through", "anywhere")],
      [BIRMINGHAM],
      [],
      [BRIGHTON],
    );

    expect(result).toContainEqual({
      placeId: BRIGHTON,
      relation: "travelling_through",
      travelWillingness: "anywhere",
    });
    expect(result.find((value) => value.placeId === BRIGHTON)?.relation).not.toBe("serves");
  });

  it("keeps an available-in declaration separate from serving an area", () => {
    expect(buildServiceAreaSelections([], [], [BRIGHTON], [])).toEqual([
      { placeId: BRIGHTON, relation: "available_in", travelWillingness: "local" },
    ]);
  });

  it("makes a newly selected work area explicit and keeps work/journey choices disjoint", () => {
    expect(buildServiceAreaSelections([], [BIRMINGHAM], [], [BIRMINGHAM])).toEqual([
      { placeId: BIRMINGHAM, relation: "serves", travelWillingness: "local" },
    ]);
  });
});

describe("service area input validation", () => {
  it("accepts one valid row per canonical place", () => {
    expect(
      parseServiceAreaUpdate({
        serviceAreas: [
          { placeId: BIRMINGHAM, relation: "serves", travelWillingness: "local" },
          { placeId: LISBON, relation: "travelling_through", travelWillingness: "anywhere" },
        ],
      }),
    ).toEqual({
      serviceAreas: [
        { placeId: BIRMINGHAM, relation: "serves", travelWillingness: "local" },
        { placeId: LISBON, relation: "travelling_through", travelWillingness: "anywhere" },
      ],
    });
  });

  it("rejects malformed place IDs, unknown relations and unknown travel preferences", () => {
    expect(() =>
      parseServiceAreaUpdate({
        serviceAreas: [{ placeId: "not-a-uuid", relation: "serves", travelWillingness: "local" }],
      }),
    ).toThrow(/valid place/i);

    expect(() =>
      parseServiceAreaUpdate({
        serviceAreas: [{ placeId: BIRMINGHAM, relation: "lives_in", travelWillingness: "local" }],
      }),
    ).toThrow(/relationship/i);

    expect(() =>
      parseServiceAreaUpdate({
        serviceAreas: [{ placeId: BIRMINGHAM, relation: "serves", travelWillingness: "teleport" }],
      }),
    ).toThrow(/travel preference/i);
  });

  it("rejects duplicate place relationships and oversized replacement sets", () => {
    expect(() =>
      parseServiceAreaUpdate({
        serviceAreas: [
          { placeId: BIRMINGHAM, relation: "serves", travelWillingness: "local" },
          { placeId: BIRMINGHAM, relation: "travelling_through", travelWillingness: "anywhere" },
        ],
      }),
    ).toThrow(/one service-area relationship/i);

    const tooMany = Array.from({ length: MAX_SERVICE_AREA_SELECTIONS + 1 }, (_, index) => ({
      placeId: `550e8400-e29b-41d4-a716-${String(index).padStart(12, "0")}`,
      relation: "serves",
      travelWillingness: "local",
    }));
    expect(() => parseServiceAreaUpdate({ serviceAreas: tooMany })).toThrow(/no more than/i);
  });
});
