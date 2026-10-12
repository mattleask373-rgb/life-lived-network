import { describe, expect, it } from "vitest";
import { sanitizeTelemetryPayload, telemetry, TelemetryEvent } from "./telemetry";

describe("Telemetry & Conversion Contract", () => {
  it("records valid search and conversion events", () => {
    telemetry.clear();
    const event: TelemetryEvent = {
      type: "search_submitted",
      timestamp: new Date().toISOString(),
      normalizedQuery: "drake birmingham",
      source: "front_door",
    };

    telemetry.record(event);
    expect(telemetry.getRecentEvents()).toHaveLength(1);
    expect(telemetry.getRecentEvents()[0].type).toBe("search_submitted");
  });

  it("rejects telemetry payloads containing raw email PII", () => {
    expect(() => {
      sanitizeTelemetryPayload({
        type: "search_submitted",
        raw: "contact me at user@example.com",
      });
    }).toThrow(/forbidden sensitive pattern/);
  });

  it("rejects telemetry payloads containing auth tokens or secrets", () => {
    expect(() => {
      sanitizeTelemetryPayload({
        type: "action_selected",
        auth: "Bearer eyJhbGciOi...",
      });
    }).toThrow(/forbidden sensitive pattern/);
  });
});
