/**
 * Lightweight observability for server reads and writes.
 *
 * Enough to answer "which query, how long, how many, did it work" later.
 * Deliberately never logs a person's details, what they asked for in their own
 * words, journey specifics, or any secret.
 */

export interface Observation {
  op: string;
  ms: number;
  ok: boolean;
  count?: number;
  code?: string;
}

export async function observe<T>(
  op: string,
  run: () => Promise<T>,
  count?: (result: T) => number,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await run();
    log({
      op,
      ms: Date.now() - started,
      ok: true,
      ...(count ? { count: count(result) } : {}),
    });
    return result;
  } catch (error) {
    log({
      op,
      ms: Date.now() - started,
      ok: false,
      code: error instanceof Error ? error.name : "unknown",
    });
    throw error;
  }
}

function log(o: Observation) {
  console.log(`[data] ${JSON.stringify(o)}`);
}
