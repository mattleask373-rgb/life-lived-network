/**
 * Restrict integration tests that create/delete synthetic accounts to loopback DB URLs.
 * This is a guardrail, not proof that a loopback port cannot be forwarded elsewhere.
 */
export function isLocalSupabaseDatabaseUrl(value: string | undefined): value is string {
  const candidate = value?.trim();
  if (!candidate) return false;

  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    const isLoopback =
      host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
    return (url.protocol === "postgres:" || url.protocol === "postgresql:") && isLoopback;
  } catch {
    return false;
  }
}
