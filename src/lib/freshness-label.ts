/**
 * User-facing age of the last recorded source check.
 *
 * This is a timestamp, not a claim that an event is current or available.
 */
export function sourceLastCheckedLabel(
  lastCheckedAt: string | null | undefined,
  now = new Date(),
): string | null {
  if (!lastCheckedAt) return null;

  const checkedAt = new Date(lastCheckedAt);
  const ageMs = now.getTime() - checkedAt.getTime();
  if (!Number.isFinite(checkedAt.getTime()) || !Number.isFinite(ageMs) || ageMs < 0) {
    return null;
  }

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (ageMs < minute) return "less than a minute ago";
  if (ageMs < hour) {
    const minutes = Math.floor(ageMs / minute);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (ageMs < day) {
    const hours = Math.floor(ageMs / hour);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (ageMs < 7 * day) {
    const days = Math.floor(ageMs / day);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  return `on ${checkedAt.toISOString().slice(0, 10)} UTC`;
}
