import { describe, expect, it } from "vitest";

import { entriesForMapList, partitionMapList } from "./map-list-sync";
import type { MapView } from "./map-view";
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
    expect(partition.unpinned.map((item) => item.id)).toEqual([
      "unpinned",
      "invalid-coordinates",
    ]);
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

  it("can show the whole locality without changing or reordering records", () => {
    const entries = [
      entry("outside", 52.7, -1.89),
      entry("unpinned", null, null),
      entry("inside", 52.43, -1.89),
    ];
    const partition = partitionMapList(entries, view);

    expect(entriesForMapList(entries, partition, true)).toEqual(entries);
  });

  it("returns no viewport matches for an empty input", () => {
    const partition = partitionMapList([], view);

    expect(partition).toEqual({ inView: [], unpinned: [], outsideView: [] });
    expect(entriesForMapList([], partition, false)).toEqual([]);
  });
});
