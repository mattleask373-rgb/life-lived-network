/**
 * When demonstration fixtures may be mixed into a real answer.
 *
 * Production: never. A quiet place must read as quiet, not as a plausible
 * invention. Development and tests: yes, so the app can be built and
 * demonstrated deterministically.
 */

export function fixturesAllowed(): boolean {
  const explicit = process.env["WORLD_FIXTURES"];
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env["NODE_ENV"] !== "production";
}
