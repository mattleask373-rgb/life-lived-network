#!/usr/bin/env node
/**
 * Black-box RLS/PostgREST regression for the local_discovery boundary.
 *
 * SAFETY: this test refuses any non-loopback DB or API URL before connecting.
 * It inserts only synthetic fixtures, uses locally signed JWTs, never prints
 * response bodies/tokens/keys, and deletes its fixtures in finally.
 */
import { createHmac, randomUUID } from "node:crypto";
import postgres from "postgres";

const env = process.env;
const databaseUrl = env["SUPABASE_DB_URL"]?.trim();
const supabaseUrl = env["SUPABASE_URL"]?.trim();
const anonKey = env["SUPABASE_ANON_KEY"]?.trim();
const jwtSecret = env["SUPABASE_JWT_SECRET"]?.trim();

function isLoopbackHost(host) {
  const normalized = host.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
}

function isLoopbackPostgresUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "postgres:" || url.protocol === "postgresql:") &&
      isLoopbackHost(url.hostname)
    );
  } catch {
    return false;
  }
}

function isLoopbackApiUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      isLoopbackHost(url.hostname)
    );
  } catch {
    return false;
  }
}

if (
  !isLoopbackPostgresUrl(databaseUrl) ||
  !isLoopbackApiUrl(supabaseUrl) ||
  !anonKey ||
  !jwtSecret
) {
  console.error(
    "Refusing PostgREST security test: DB/API URLs must both use loopback hosts and local anon/JWT credentials must be present.",
  );
  process.exit(2);
}

const apiBase = supabaseUrl.replace(/\/+$/, "");
const sql = postgres(databaseUrl, {
  max: 4,
  connect_timeout: 5,
  idle_timeout: 5,
  onnotice: () => undefined,
});
const testTag = randomUUID().slice(0, 8);
const users = {
  owner: { id: randomUUID(), email: `local-discovery-owner-${testTag}@example.test` },
  a: { id: randomUUID(), email: `local-discovery-a-${testTag}@example.test` },
  b: { id: randomUUID(), email: `local-discovery-b-${testTag}@example.test` },
};
const places = {
  a: { id: randomUUID(), slug: `rwa-test-a-${testTag}`, name: "Synthetic Locality A" },
  b: { id: randomUUID(), slug: `rwa-test-b-${testTag}`, name: "Synthetic Locality B" },
};
const needs = {
  localA: randomUUID(),
  localB: randomUUID(),
  staleA: randomUUID(),
  expiredA: randomUUID(),
  publicA: randomUUID(),
};
const results = [];
let fixturesCreated = false;

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function jwtFor(userId) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({
    aud: "authenticated",
    exp: now + 900,
    iat: now,
    iss: "supabase",
    role: "authenticated",
    sub: userId,
  });
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", jwtSecret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function add(name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail });
}

function apiHeaders(token, extra = {}) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function apiRequest(path, token, extraHeaders = {}, method = "GET", body) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: apiHeaders(token, {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...extraHeaders,
    }),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: "error",
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* preserve status-only evidence */
  }
  return { status: response.status, headers: response.headers, json };
}

function needPath(id) {
  const query = new URLSearchParams({
    select: "id,place_id,visibility",
    id: `eq.${id}`,
  });
  return `/rest/v1/needs?${query.toString()}`;
}

async function expectOne(name, id, token, placeId, visibility) {
  try {
    const response = await apiRequest(needPath(id), token);
    const rows = Array.isArray(response.json) ? response.json : null;
    const ok = response.status === 200 && rows?.length === 1 &&
      rows[0]?.id === id && rows[0]?.place_id === placeId &&
      rows[0]?.visibility === visibility;
    add(name, ok, `HTTP ${response.status}; expected exactly one permitted synthetic row`);
  } catch {
    add(name, false, "request failed; details withheld");
  }
}

async function expectZero(name, id, token) {
  try {
    const response = await apiRequest(needPath(id), token);
    const rows = Array.isArray(response.json) ? response.json : null;
    add(
      name,
      response.status === 200 && Array.isArray(rows) && rows.length === 0,
      `HTTP ${response.status}; expected HTTP 200 with zero visible rows`,
    );
  } catch {
    add(name, false, "request failed; details withheld");
  }
}

async function expectZeroPlaceCount(name, placeId, token) {
  try {
    const query = new URLSearchParams({
      select: "id",
      visibility: "eq.local_discovery",
      place_id: `eq.${placeId}`,
    });
    const response = await apiRequest(`/rest/v1/needs?${query.toString()}`, token, {
      Prefer: "count=exact",
      Range: "0-0",
    });
    const contentRange = response.headers.get("content-range") ?? "";
    const total = contentRange.match(/\/(\d+|\*)$/)?.[1];
    const rows = Array.isArray(response.json) ? response.json : null;
    add(
      name,
      response.status === 200 &&
        Array.isArray(rows) &&
        rows.length === 0 &&
        total === "0",
      `HTTP ${response.status}; Content-Range total=${total ?? "unavailable"}; expected zero`,
    );
  } catch {
    add(name, false, "request failed; details withheld");
  }
}

async function expectDenied(name, path, token, schema = "private", method = "GET", body) {
  try {
    const headers = {
      "Accept-Profile": schema,
      ...(method === "GET" ? {} : { "Content-Profile": schema }),
    };
    const response = await apiRequest(path, token, headers, method, body);
    // Only a client/API 4xx counts as a denial. A 5xx must never mask exposure.
    add(
      name,
      response.status >= 400 && response.status < 500,
      `HTTP ${response.status}; expected an explicit client/API denial (4xx)`,
    );
  } catch {
    add(name, false, "request failed; details withheld");
  }
}

async function seedFixtures() {
  await sql.begin(async (tx) => {
    const instanceId = "00000000-0000-0000-0000-000000000000";
    for (const user of Object.values(users)) {
      await tx`
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at,
          raw_app_meta_data, raw_user_meta_data
        ) VALUES (
          ${user.id}::uuid, ${instanceId}::uuid, 'authenticated', 'authenticated',
          ${user.email}, '', now(), now(), now(),
          ${JSON.stringify({ provider: "email", providers: ["email"] })}::jsonb, '{}'::jsonb
        )
      `;
    }

    await tx`
      INSERT INTO public.places (id, kind, name, slug, country_code, parent_id)
      VALUES (
        ${places.a.id}::uuid, 'city', ${places.a.name}, ${places.a.slug}, 'GB', NULL
      )
    `;
    await tx`
      INSERT INTO public.places (id, kind, name, slug, country_code, parent_id)
      VALUES (
        ${places.b.id}::uuid, 'city', ${places.b.name}, ${places.b.slug}, 'GB', NULL
      )
    `;

    await tx`
      INSERT INTO public.needs (
        id, creator_id, category, title, status, visibility, place_id, place_text,
        last_confirmed_at, expires_at, ends_at
      ) VALUES
        (${needs.localA}::uuid, ${users.owner.id}::uuid, 'practical', 'Synthetic Local A',
         'open', 'local_discovery', ${places.a.id}::uuid, ${places.a.name}, now(), NULL, NULL),
        (${needs.localB}::uuid, ${users.owner.id}::uuid, 'practical', 'Synthetic Local B',
         'open', 'local_discovery', ${places.b.id}::uuid, ${places.b.name}, now(), NULL, NULL),
        (${needs.staleA}::uuid, ${users.owner.id}::uuid, 'practical', 'Synthetic Stale A',
         'open', 'local_discovery', ${places.a.id}::uuid, ${places.a.name},
         now() - interval '31 days', NULL, NULL),
        (${needs.expiredA}::uuid, ${users.owner.id}::uuid, 'practical', 'Synthetic Expired A',
         'open', 'local_discovery', ${places.a.id}::uuid, ${places.a.name},
         now(), now() - interval '1 hour', NULL),
        (${needs.publicA}::uuid, ${users.owner.id}::uuid, 'practical', 'Synthetic Public A',
         'open', 'public', ${places.a.id}::uuid, ${places.a.name}, now(), NULL, NULL)
    `;

    await tx`
      INSERT INTO private.locality_memberships (user_id, place_id, status, verified_by, verified_at)
      VALUES
        (${users.a.id}::uuid, ${places.a.id}::uuid, 'verified', ${users.owner.id}::uuid, now()),
        (${users.b.id}::uuid, ${places.b.id}::uuid, 'verified', ${users.owner.id}::uuid, now())
    `;
  });
  fixturesCreated = true;
}

async function cleanupFixtures() {
  await sql.begin(async (tx) => {
    for (const id of Object.values(needs)) {
      await tx`DELETE FROM public.needs WHERE id = ${id}::uuid`;
    }
    for (const user of Object.values(users)) {
      await tx`DELETE FROM private.locality_memberships WHERE user_id = ${user.id}::uuid`;
      await tx`DELETE FROM private.locality_memberships WHERE verified_by = ${user.id}::uuid`;
    }
    for (const place of Object.values(places)) {
      await tx`DELETE FROM private.locality_memberships WHERE place_id = ${place.id}::uuid`;
      await tx`DELETE FROM public.places WHERE id = ${place.id}::uuid`;
    }
    for (const user of Object.values(users)) {
      await tx`DELETE FROM auth.users WHERE id = ${user.id}::uuid`;
    }
  });
}

async function main() {
  try {
    await seedFixtures();

    const anon = anonKey;
    const userA = jwtFor(users.a.id);
    const userB = jwtFor(users.b.id);

    await expectOne(
      "anon sees one synthetic public need",
      needs.publicA,
      anon,
      places.a.id,
      "public",
    );
    await expectZero("anon cannot read synthetic local A need by ID", needs.localA, anon);
    await expectZero("anon cannot read synthetic local B need by ID", needs.localB, anon);
    await expectOne(
      "verified A reads exact-place A need",
      needs.localA,
      userA,
      places.a.id,
      "local_discovery",
    );
    await expectZero("verified A cannot read B need", needs.localB, userA);
    await expectOne(
      "verified B reads exact-place B need",
      needs.localB,
      userB,
      places.b.id,
      "local_discovery",
    );
    await expectZero("verified B cannot read A need", needs.localA, userB);
    await expectZero("A cannot read stale need even at its verified place", needs.staleA, userA);
    await expectZero(
      "A cannot read expired need even at its verified place",
      needs.expiredA,
      userA,
    );
    await expectZeroPlaceCount("anon count does not reveal A local rows", places.a.id, anon);
    await expectZeroPlaceCount("anon count does not reveal B local rows", places.b.id, anon);

    await expectDenied(
      "anon cannot query private membership table",
      "/rest/v1/locality_memberships?select=user_id&limit=1",
      anon,
    );
    await expectDenied(
      "authenticated cannot query private membership table",
      "/rest/v1/locality_memberships?select=user_id&limit=1",
      userA,
    );
    await expectDenied(
      "anon cannot invoke locality helper RPC",
      "/rest/v1/rpc/is_verified_locality_member",
      anon,
      "private",
      "POST",
      { _need_place_id: places.a.id },
    );
    await expectDenied(
      "authenticated cannot invoke locality helper RPC as an oracle",
      "/rest/v1/rpc/is_verified_locality_member",
      userA,
      "private",
      "POST",
      { _need_place_id: places.b.id },
    );

    const failures = results.filter((r) => !r.ok);
    for (const result of results) {
      console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name} — ${result.detail}`);
    }
    console.log(`\n${results.length - failures.length}/${results.length} PostgREST checks passed.`);
    if (failures.length) process.exitCode = 1;
  } catch {
    // Don't print SQL errors, which can include connection metadata.
    console.error("Local PostgREST boundary test failed; database details withheld.");
    process.exitCode = 1;
  } finally {
    if (fixturesCreated) {
      try {
        await cleanupFixtures();
      } catch {
        console.error("Synthetic fixture cleanup failed; inspect the disposable local database.");
        process.exitCode = 1;
      }
    }
    await sql.end({ timeout: 5 });
  }
}

await main();
