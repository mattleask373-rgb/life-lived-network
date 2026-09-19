import { describe, expect, it } from "vitest";

import {
  canMove,
  contextFromNeed,
  isOpen,
  roleFor,
  rowToRequest,
  type ConnectionRequest,
  type ConnectionRequestRow,
} from "./connection";
import { AIRBNB_CHANGEOVER } from "./fixtures/people-and-needs";

const row: ConnectionRequestRow = {
  id: "r1",
  need_id: "n1",
  sender_id: "sarah",
  recipient_id: "asker",
  direction: "offer",
  note: "I do these every week nearby.",
  status: "sent",
  context_title: "Airbnb changeover",
  context_place: "Brighton",
  context_when: "Thu, 24 Sep",
  created_at: "2026-09-19T09:00:00.000Z",
  updated_at: "2026-09-19T09:00:00.000Z",
};

const request: ConnectionRequest = rowToRequest(row);

describe("connection requests", () => {
  it("keeps the context that was true when it was sent", () => {
    expect(request.context).toEqual({
      title: "Airbnb changeover",
      place: "Brighton",
      when: "Thu, 24 Sep",
    });
  });

  it("builds context from a need without inventing anything", () => {
    const context = contextFromNeed(AIRBNB_CHANGEOVER);
    expect(context.title).toBe(AIRBNB_CHANGEOVER.title);
    expect(context.place).toBe(AIRBNB_CHANGEOVER.placeText || "Nearby");
    expect(context.when).not.toBe("");
  });

  it("says plainly when a need has no agreed time", () => {
    const context = contextFromNeed({ ...AIRBNB_CHANGEOVER, startsAt: null });
    expect(context.when).toBe("Time still to agree");
  });

  it("knows which side of a conversation someone is on", () => {
    expect(roleFor(request, "sarah")).toBe("sender");
    expect(roleFor(request, "asker")).toBe("recipient");
    expect(roleFor(request, "stranger")).toBeNull();
  });

  it("lets the recipient answer, and only answer", () => {
    expect(canMove("recipient", "sent", "accepted")).toBe(true);
    expect(canMove("recipient", "sent", "declined")).toBe(true);
    expect(canMove("recipient", "sent", "withdrawn")).toBe(false);
  });

  it("lets the sender take it back, and nothing else", () => {
    expect(canMove("sender", "sent", "withdrawn")).toBe(true);
    expect(canMove("sender", "sent", "accepted")).toBe(false);
  });

  it("never reopens something that has been settled", () => {
    for (const from of ["accepted", "declined", "withdrawn"] as const) {
      expect(canMove("recipient", from, "accepted")).toBe(false);
      expect(canMove("sender", from, "withdrawn")).toBe(false);
    }
  });

  it("only keeps the thread writable while it is live", () => {
    expect(isOpen("sent")).toBe(true);
    expect(isOpen("accepted")).toBe(true);
    expect(isOpen("declined")).toBe(false);
    expect(isOpen("withdrawn")).toBe(false);
  });
});
