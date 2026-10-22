import { categoryBySlug } from "./service-taxonomy";
import type { BookingState } from "./services";

const BOOKING_STATES = new Set<BookingState>(["bookable", "enquire", "external", "not_bookable"]);

export interface ServiceOfferFields {
  service_category: string;
  organisation: string;
  provider_note: string;
  booking_state: BookingState;
  booking_url: string;
  cost: number;
}

export class ServiceOfferValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceOfferValidationError";
  }
}

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ServiceOfferValidationError(`${field} is required.`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new ServiceOfferValidationError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function optionalText(value: unknown, field: string, maxLength: number): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") {
    throw new ServiceOfferValidationError(`${field} must be text.`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new ServiceOfferValidationError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function safeBookingUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error("unsafe");
    }
    return parsed.toString();
  } catch {
    throw new ServiceOfferValidationError("Use a valid public http or https booking link.");
  }
}

/**
 * Validate a person-authored service listing before the existing listings insert.
 *
 * The category must be explicitly chosen; this helper never classifies by title
 * or claims that a provider, credential, booking slot, or service-area radius is
 * verified. Publication remains a self-declared user listing under the existing
 * listing policy; this is not a qualification or regulatory verification system.
 */
export function parseServiceOfferDraft(input: unknown): ServiceOfferFields {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new ServiceOfferValidationError("Service offer details are missing.");
  }
  const record = input as Record<string, unknown>;

  const requestedCategory = requiredText(record.serviceCategory, "Service category", 100);
  const category = categoryBySlug(requestedCategory);
  if (!category || category.group === "work") {
    throw new ServiceOfferValidationError("Choose a valid service category, not a job category.");
  }

  const rawCost = typeof record.cost === "number" ? record.cost : Number(record.cost);
  if (
    record.cost === undefined ||
    record.cost === null ||
    (typeof record.cost === "string" && !record.cost.trim()) ||
    !Number.isFinite(rawCost) ||
    rawCost < 0 ||
    rawCost > 1_000_000_000
  ) {
    throw new ServiceOfferValidationError(
      "Enter a typical price; use 0 only if the service is genuinely free. Describe the price basis in the details.",
    );
  }

  const bookingState = record.bookingState;
  if (typeof bookingState !== "string" || !BOOKING_STATES.has(bookingState as BookingState)) {
    throw new ServiceOfferValidationError("Choose a supported booking or enquiry state.");
  }

  const rawUrl = optionalText(record.bookingUrl, "Booking link", 2000);
  const needsLink = bookingState === "bookable" || bookingState === "external";
  if (needsLink && !rawUrl) {
    throw new ServiceOfferValidationError(
      "Add the provider's booking link for this booking state.",
    );
  }
  if (!needsLink && rawUrl) {
    throw new ServiceOfferValidationError(
      "Choose an external-booking state before adding a booking link.",
    );
  }

  return {
    service_category: category.slug,
    organisation: optionalText(record.organisation, "Provider name", 120),
    provider_note: optionalText(record.providerNote, "Provider details", 1000),
    booking_state: bookingState as BookingState,
    booking_url: rawUrl ? safeBookingUrl(rawUrl) : "",
    cost: rawCost,
  };
}
