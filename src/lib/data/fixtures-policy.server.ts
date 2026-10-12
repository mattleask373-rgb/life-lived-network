/**
 * When demonstration fixtures may be mixed into a real answer.
 *
 * Production: never — NODE_ENV=production overrides WORLD_FIXTURES=true, so a
 * stray flag cannot leak invented records onto the live site. Development and
 * tests: yes by default, so the app can be demonstrated deterministically.
 */

export function fixturesAllowed(): boolean {
  if (process.env["NODE_ENV"] === "production") return false;
  return process.env["WORLD_FIXTURES"] !== "false";
}
