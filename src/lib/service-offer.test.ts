import { describe, expect, it } from "vitest";

import { parseServiceOfferDraft, ServiceOfferValidationError } from "./service-offer";

function input(overrides: Record<string, unknown> = {}) {
  return {
    serviceCategory: "cleaning",
    organisation: "Westside Turnover Services",
    providerNote: "Self-described local cleaning offer.",
    bookingState: "not_bookable",
    bookingUrl: "",
    ...overrides,
  };
}

describe("first-party service-offer contract", () => {
  it("accepts an explicitly selected service category without inventing qualifications or availability", () => {
    expect(parseServiceOfferDraft(input())).toEqual({
      service_category: "cleaning",
      organisation: "Westside Turnover Services",
      provider_note: "Self-described local cleaning offer.",
      booking_state: "not_bookable",
      booking_url: "",
    });
  });

  it("normalizes valid public http/https booking links", () => {
    expect(
      parseServiceOfferDraft(
        input({
          bookingState: "external",
          bookingUrl: "https://provider.example/book?service=cleaning",
        }),
      ).booking_url,
    ).toBe("https://provider.example/book?service=cleaning");
  });

  it("requires the category to be selected from the shared taxonomy", () => {
    expect(() => parseServiceOfferDraft(input({ serviceCategory: "invented-category" }))).toThrow(
      ServiceOfferValidationError,
    );
    expect(() => parseServiceOfferDraft(input({ serviceCategory: "short-term-work" }))).toThrow(
      /not a job category/i,
    );
  });

  it.each(["javascript:alert(1)", "data:text/html,hi", "https://user:pass@provider.example/book", "not a URL"])(
    "rejects unsafe booking link %s",
    (bookingUrl) => {
      expect(() =>
        parseServiceOfferDraft(input({ bookingState: "external", bookingUrl })),
      ).toThrow(/valid public http or https/i);
    },
  );

  it("requires a link only for explicit bookable or external-booking states", () => {
    expect(() =>
      parseServiceOfferDraft(input({ bookingState: "external", bookingUrl: "" })),
    ).toThrow(/booking link/i);
    expect(() =>
      parseServiceOfferDraft(input({ bookingState: "bookable", bookingUrl: "" })),
    ).toThrow(/booking link/i);
    expect(() =>
      parseServiceOfferDraft(input({ bookingState: "enquire", bookingUrl: "https://provider.example" })),
    ).toThrow(/before adding/i);
  });

  it("keeps optional provider details bounded and trims them", () => {
    expect(parseServiceOfferDraft(input({ organisation: "  ", providerNote: "  " }))).toMatchObject({
      organisation: "",
      provider_note: "",
    });
    expect(() => parseServiceOfferDraft(input({ organisation: "x".repeat(121) }))).toThrow(
      /120 characters or fewer/i,
    );
    expect(() => parseServiceOfferDraft(input({ providerNote: "x".repeat(1001) }))).toThrow(
      /1000 characters or fewer/i,
    );
  });

  it("rejects unknown booking states rather than implying a pathway", () => {
    expect(() => parseServiceOfferDraft(input({ bookingState: "auto_booked" }))).toThrow(
      /supported booking or enquiry state/i,
    );
  });
});
