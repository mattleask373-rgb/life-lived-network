/**
 * Application-level data errors.
 *
 * The interface never sees a database message. It sees one of these, so it can
 * stay honest and calm: "we couldn't reach this right now", not a Postgres code.
 */

export type DataErrorCode =
  | "DATA_UNAVAILABLE"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "STALE_DATA"
  | "PROVIDER_DEGRADED"
  | "INVALID_CONTEXT";

export const DATA_ERROR_MESSAGE: Record<DataErrorCode, string> = {
  DATA_UNAVAILABLE: "We couldn't reach this just now. Try again in a moment.",
  UNAUTHENTICATED: "You'll need to be signed in for that.",
  FORBIDDEN: "That isn't yours to change.",
  NOT_FOUND: "This isn't here any more.",
  STALE_DATA: "This information may be out of date.",
  PROVIDER_DEGRADED: "One of our sources is quiet right now, so this may be incomplete.",
  INVALID_CONTEXT: "Something about that request didn't make sense.",
};

export class DataError extends Error {
  readonly code: DataErrorCode;

  constructor(code: DataErrorCode, detail?: string) {
    super(DATA_ERROR_MESSAGE[code]);
    this.name = "DataError";
    this.code = code;
    // Detail is for server logs only; it never reaches a person.
    if (detail) this.cause = detail;
  }
}

/** Turns anything thrown below the boundary into one predictable shape. */
export function asDataError(error: unknown, fallback: DataErrorCode = "DATA_UNAVAILABLE"): DataError {
  if (error instanceof DataError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/jwt|unauthor/i.test(message)) return new DataError("UNAUTHENTICATED", message);
  if (/permission|policy|row-level/i.test(message)) return new DataError("FORBIDDEN", message);
  return new DataError(fallback, message);
}

export function isDataErrorCode(error: unknown, code: DataErrorCode): boolean {
  return error instanceof DataError && error.code === code;
}
