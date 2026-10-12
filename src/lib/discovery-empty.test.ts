import { describe, expect, it } from "vitest";
import { emptyListState, homeRecordedStatus } from "./discovery-empty";

describe("emptyListState", () => {
  it("says filtered-out when a filter hides loaded entries", () => {
    expect(emptyListState(5, true)).toBe("filtered-out");
  });
  it("says nothing recorded when the place has no entries", () => {
    expect(emptyListState(0, true)).toBe("nothing-recorded");
    expect(emptyListState(0, false)).toBe("nothing-recorded");
  });
});

describe("homeRecordedStatus", () => {
  it("does not report a failed or unfinished needs read as zero", () => {
    expect(
      homeRecordedStatus({
        checking: false,
        worldFailed: false,
        recorded: 4,
        openNeeds: null,
        needsFailed: true,
      }),
    ).toBe("4 things recorded here · open needs couldn't be checked");
    expect(
      homeRecordedStatus({
        checking: false,
        worldFailed: false,
        recorded: 4,
        openNeeds: null,
        needsFailed: false,
      }),
    ).toBe("4 things recorded here · still checking open needs");
  });

  it("reports a known zero, and keeps a world failure from looking like an empty place", () => {
    expect(
      homeRecordedStatus({
        checking: false,
        worldFailed: false,
        recorded: 1,
        openNeeds: 0,
        needsFailed: false,
      }),
    ).toBe("1 thing recorded here · 0 open needs");
    expect(
      homeRecordedStatus({
        checking: false,
        worldFailed: true,
        recorded: 0,
        openNeeds: null,
        needsFailed: true,
      }),
    ).toBe("We couldn't check what's recorded here.");
    expect(
      homeRecordedStatus({
        checking: true,
        worldFailed: false,
        recorded: 0,
        openNeeds: null,
        needsFailed: false,
      }),
    ).toBe("Checking what's recorded here…");
  });
});
