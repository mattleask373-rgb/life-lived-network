/**
 * Refuse to interpret a failed database operation as an empty result or success.
 *
 * Use only with a static operation label. Raw provider/database diagnostics may
 * contain identifiers or sensitive details and must not be copied into error
 * messages persisted by the ingest health panel.
 */
export function requireIngestStorageSuccess(error: unknown, operation: string): void {
  if (error !== null && error !== undefined) {
    throw new Error(`Ingest storage operation could not be confirmed: ${operation}.`);
  }
}
