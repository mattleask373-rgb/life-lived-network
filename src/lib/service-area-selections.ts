import type { AreaRelation, ServiceArea, TravelWillingness } from "./capability";

export const MAX_SERVICE_AREA_SELECTIONS = 200;

export interface ServiceAreaSelection {
  placeId: string;
  relation: AreaRelation;
  travelWillingness: TravelWillingness;
}

type ExistingArea = Pick<ServiceArea, "placeId" | "relation" | "travelWillingness">;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RELATIONS = new Set<AreaRelation>(["serves", "available_in", "travelling_through"]);
const TRAVEL_WILLINGNESSES = new Set<TravelWillingness>(["local", "will_travel", "anywhere"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Convert the three profile selections into one explicit relationship per place.
 * Existing "available_in" and travel-willingness choices are preserved when
 * that place remains selected; a newly selected service area is self-declared
 * as "serves", while a passing-through place stays a journey-only fact.
 */
export function buildServiceAreaSelections(
  existing: readonly ExistingArea[],
  servicePlaceIds: readonly string[],
  availableInPlaceIds: readonly string[],
  travellingThroughPlaceIds: readonly string[],
): ServiceAreaSelection[] {
  const existingByPlace = new Map<string, ExistingArea>();
  const relationPriority: Record<AreaRelation, number> = {
    serves: 3,
    available_in: 2,
    travelling_through: 1,
  };
  for (const area of existing) {
    const previous = existingByPlace.get(area.placeId);
    // In legacy duplicate data, prefer the most explicit non-journey relation.
    if (!previous || relationPriority[area.relation] > relationPriority[previous.relation]) {
      existingByPlace.set(area.placeId, area);
    }
  }

  const serviceIds = [...new Set(servicePlaceIds)];
  const serviceSet = new Set(serviceIds);
  const availableIds = [...new Set(availableInPlaceIds)].filter((id) => !serviceSet.has(id));
  const availableSet = new Set([...serviceIds, ...availableIds]);
  const travelIds = [...new Set(travellingThroughPlaceIds)].filter((id) => !availableSet.has(id));

  const serviceSelections = serviceIds.map((placeId): ServiceAreaSelection => {
    const previous = existingByPlace.get(placeId);
    const keepTravel = previous?.relation === "serves";
    return {
      placeId,
      relation: "serves",
      travelWillingness: keepTravel ? previous.travelWillingness : "local",
    };
  });

  const availableSelections = availableIds.map((placeId): ServiceAreaSelection => {
    const previous = existingByPlace.get(placeId);
    const keepTravel = previous?.relation === "available_in";
    return {
      placeId,
      relation: "available_in",
      travelWillingness: keepTravel ? previous.travelWillingness : "local",
    };
  });

  const travelSelections = travelIds.map((placeId): ServiceAreaSelection => {
    const previous = existingByPlace.get(placeId);
    return {
      placeId,
      relation: "travelling_through",
      travelWillingness:
        previous?.relation === "travelling_through" ? previous.travelWillingness : "anywhere",
    };
  });

  return [...serviceSelections, ...availableSelections, ...travelSelections];
}

/** Validate the complete replacement set before the server mutates any rows. */
export function parseServiceAreaUpdate(input: unknown): { serviceAreas: ServiceAreaSelection[] } {
  if (!isRecord(input) || !Array.isArray(input.serviceAreas)) {
    throw new Error("Service areas must be provided as a list.");
  }
  if (input.serviceAreas.length > MAX_SERVICE_AREA_SELECTIONS) {
    throw new Error(`Choose no more than ${MAX_SERVICE_AREA_SELECTIONS} places at once.`);
  }

  const seen = new Set<string>();
  const serviceAreas = input.serviceAreas.map((value, index): ServiceAreaSelection => {
    if (!isRecord(value)) throw new Error(`Service area ${index + 1} is invalid.`);

    const placeId = typeof value.placeId === "string" ? value.placeId.trim() : "";
    if (!UUID_PATTERN.test(placeId)) {
      throw new Error(`Service area ${index + 1} needs a valid place.`);
    }
    if (seen.has(placeId)) {
      throw new Error("A place can only have one service-area relationship.");
    }
    seen.add(placeId);

    if (typeof value.relation !== "string" || !RELATIONS.has(value.relation as AreaRelation)) {
      throw new Error(`Service area ${index + 1} has an unknown relationship.`);
    }
    if (
      typeof value.travelWillingness !== "string" ||
      !TRAVEL_WILLINGNESSES.has(value.travelWillingness as TravelWillingness)
    ) {
      throw new Error(`Service area ${index + 1} has an unknown travel preference.`);
    }

    return {
      placeId,
      relation: value.relation as AreaRelation,
      travelWillingness: value.travelWillingness as TravelWillingness,
    };
  });

  return { serviceAreas };
}
