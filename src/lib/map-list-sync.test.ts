import { describe, expect, it } from "vitest";

import { entriesForMapList, mergeViewportEntries, partitionMapList } from "./map-list-sync";
import { MAX_MAP_PINS, type MapView } from "./map-view";
import type { WorldEntry } from "./world-data";

function entry(id: string, lat: number | null, lng: number | null): WorldEntry {
  return {
    id,
    layer: "work",
    title: id,
    place: "Somewhere",
    neighbourhood: "",
    x: 50,
    y: 50,
    lat,
    lng,
    when: "today",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "",
    details: [],
    host: "someone",
    verified: false,
    social: "quiet",
    outdoors: false,
  } as WorldEntry;
}

const view: MapView = { lat: 52.43, lng: -1.89, spanLat: 0.1, spanLng: 0.14 };

describe("map/list synchronization", () => {
  it("matches the map viewport and keeps unpinned records in the list", () => {
    const entries = [
      entry("outside", 52.7, -1.89),
      entry("unpinned", null, null),
      entry("inside", 52.43, -1.89),
      entry("invalid-coordinates", 95, 200),
    ];

    const partition = partitionMapList(entries, view);

    expect(partition.inView.map((item) => item.id)).toEqual(["inside"]);
    expect(partition.unpinned.map((item) => item.id)).toEqual(["unpinned", "invalid-coordinates"]);
    expect(partition.outsideView.map((item) => item.id)).toEqual(["outside"]);
  });

  it("does not claim located records are in view before the map reports a viewport", () => {
    const entries = [entry("located", 52.43, -1.89), entry("unpinned", null, null)];

    const partition = partitionMapList(entries, null);

    expect(partition.inView).toEqual([]);
    expect(partition.outsideView.map((item) => item.id)).toEqual(["located"]);
    expect(partition.unpinned.map((item) => item.id)).toEqual(["unpinned"]);
  });

  it("shows in-view and unpinned records in their original order", () => {
    const entries = [
      entry("outside", 52.7, -1.89),
      entry("unpinned", null, null),
      entry("inside", 52.43, -1.89),
    ];
    const partition = partitionMapList(entries, view);

    expect(entriesForMapList(entries, partition, false).map((item) => item.id)).toEqual([
      "unpinned",
      "inside",
    ]);
  });

  it("can show all loaded entries without changing or reordering records", () => {
    const entries = [
      entry("outside", 52.7, -1.89),
      entry("unpinned", null, null),
      entry("inside", 52.43, -1.89),
    ];
    const partition = partitionMapList(entries, view);

    expect(entriesForMapList(entries, partition, true)).toEqual(entries);
  });

  it("keeps non-finite and out-of-range coordinates unpinned", () => {
    const entries = [
      entry("not-a-number", Number.NaN, -1.89),
      entry("infinite-latitude", Number.POSITIVE_INFINITY, -1.89),
      entry("out-of-range-latitude", 91, -1.89),
      entry("out-of-range-longitude", 52.43, 181),
      entry("valid", 52.43, -1.89),
    ];

    const partition = partitionMapList(entries, view);

    expect(partition.inView.map((item) => item.id)).toEqual(["valid"]);
    expect(partition.unpinned.map((item) => item.id)).toEqual([
      "not-a-number",
      "infinite-latitude",
      "out-of-range-latitude",
      "out-of-range-longitude",
    ]);
    expect(partition.outsideView).toEqual([]);
  });

  it("merges viewport results with only unpinned locality records and prefers fresh coordinates", () => {
    const fresh = entry("fresh", 51.5, -0.12);
    const updated = entry("updated", 51.51, -0.13);
    const staleUnpinned = entry("updated", null, null);
    const unpinned = entry("unpinned", null, null);
    const outsideView = entry("outside", 40, -3);

    expect(
      mergeViewportEntries([fresh, updated], [staleUnpinned, unpinned, outsideView]).map(
        (item) => item.id,
      ),
    ).toEqual(["fresh", "updated", "unpinned"]);
    expect(mergeViewportEntries([updated], [staleUnpinned])[0]).toBe(updated);
  });

  it("keeps the list aligned with rendered pins and reports in-view records beyond the pin cap", () => {
    const entries = Array.from({ length: MAX_MAP_PINS + 5 }, (_, index) =>
      entry(`pin-${String(index + 1).padStart(3, "0")}`, view.lat, view.lng),
    );

    const partition = partitionMapList(entries, view);

    expect(partition.inView).toHaveLength(MAX_MAP_PINS);
    expect(partition.unrenderedInView.map((item) => item.id)).toEqual([
      "pin-301",
      "pin-302",
      "pin-303",
      "pin-304",
      "pin-305",
    ]);
    expect(partition.outsideView).toEqual([]);
    expect(entriesForMapList(entries, partition, false)).toEqual(entries.slice(0, MAX_MAP_PINS));
    expect(entriesForMapList(entries, partition, true)).toEqual(entries);
  });

  it("returns no viewport matches for an empty input", () => {
    const partition = partitionMapList([], view);

    expect(partition).toEqual({
      inView: [],
      unpinned: [],
      outsideView: [],
      unrenderedInView: [],
    });
    expect(entriesForMapList([], partition, false)).toEqual([]);
  });
});
