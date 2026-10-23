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
    return (url.protocol === "http:" || url.protocol === "https:") && isLoopbackHost(url.hostname);
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
  childReader: { id: randomUUID(), email: `local-discovery-child-reader-${testTag}@example.test` },
  noGrant: { id: randomUUID(), email: `local-discovery-no-grant-${testTag}@example.test` },
  providerB: { id: randomUUID(), email: `local-discovery-provider-b-${testTag}@example.test` },
  providerChild: {
    id: randomUUID(),
    email: `local-discovery-provider-child-${testTag}@example.test`,
  },
};
const places = {
  a: { id: randomUUID(), slug: `rwa-test-a-${testTag}`, name: "Synthetic Locality A" },
  child: { id: randomUUID(), slug: `rwa-test-child-${testTag}`, name: "Synthetic Child A1" },
  b: { id: randomUUID(), slug: `rwa-test-b-${testTag}`, name: "Synthetic Locality B" },
};
const needs = {
  localA: randomUUID(),
  child: randomUUID(),
  localB: randomUUID(),
  staleA: randomUUID(),
  expiredA: randomUUID(),
  publicA: randomUUID(),
};
const facts = {
  capabilities: {
    publicA: randomUUID(),
    localA: randomUUID(),
    localChild: randomUUID(),
    localB: randomUUID(),
    privateA: randomUUID(),
    staleA: randomUUID(),
    expiredA: randomUUID(),
  },
  serviceAreas: {
    publicA: randomUUID(),
    localA: randomUUID(),
    localChild: randomUUID(),
    localB: randomUUID(),
    localBFromProviderA: randomUUID(),
    privateA: randomUUID(),
  },
  availability: {
    publicA: randomUUID(),
    localA: randomUUID(),
    localChild: randomUUID(),
    localB: randomUUID(),
    privateA: randomUUID(),
    staleA: randomUUID(),
    expiredA: randomUUID(),
  },
  opportunityPreferences: {
    publicA: randomUUID(),
    localA: randomUUID(),
    localChild: randomUUID(),
    localB: randomUUID(),
    privateA: randomUUID(),
  },
  contributions: {
    publicA: randomUUID(),
    localA: randomUUID(),
    localChild: randomUUID(),
    localB: randomUUID(),
    privateA: randomUUID(),
  },
};
const factTables = [
  { table: "person_capabilities", ids: facts.capabilities },
  { table: "service_areas", ids: facts.serviceAreas },
  { table: "availability_windows", ids: facts.availability },
  { table: "opportunity_preferences", ids: facts.opportunityPreferences },
  { table: "contribution_preferences", ids: facts.contributions },
];
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
    const ok =
      response.status === 200 &&
      rows?.length === 1 &&
      rows[0]?.id === id &&
      rows[0]?.place_id === placeId &&
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
      response.status === 200 && Array.isArray(rows) && rows.length === 0 && total === "0",
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
        ${places.child.id}::uuid, 'village', ${places.child.name}, ${places.child.slug}, 'GB',
        ${places.a.id}::uuid
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
        (${needs.child}::uuid, ${users.owner.id}::uuid, 'practical', 'Synthetic Child A1',
         'open', 'local_discovery', ${places.child.id}::uuid, ${places.child.name}, now(), NULL, NULL),
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
        (${users.b.id}::uuid, ${places.b.id}::uuid, 'verified', ${users.owner.id}::uuid, now()),
        (${users.childReader.id}::uuid, ${places.child.id}::uuid, 'verified', ${users.owner.id}::uuid, now())
    `;

    // User-facing locality membership is trusted server data; profile place is the
    // locality context of a person's own discovery facts, not reader authorization.
    await tx`
      UPDATE public.profiles SET place_id = ${places.a.id}::uuid, discoverable = true
      WHERE id IN (${users.owner.id}::uuid, ${users.noGrant.id}::uuid)
    `;
    await tx`
      UPDATE public.profiles SET place_id = ${places.b.id}::uuid, discoverable = true
      WHERE id = ${users.providerB.id}::uuid
    `;
    await tx`
      UPDATE public.profiles SET place_id = ${places.child.id}::uuid, discoverable = true
      WHERE id = ${users.providerChild.id}::uuid
    `;

    await tx`
      INSERT INTO public.person_capabilities
        (id, user_id, kind, label, visibility, expires_on, last_confirmed_at)
      VALUES
        (${facts.capabilities.publicA}::uuid, ${users.owner.id}::uuid, 'skill', 'Synthetic public capability', 'public', NULL, now()),
        (${facts.capabilities.localA}::uuid, ${users.owner.id}::uuid, 'skill', 'Synthetic locality A capability', 'local_discovery', NULL, now()),
        (${facts.capabilities.localChild}::uuid, ${users.providerChild.id}::uuid, 'skill', 'Synthetic child capability', 'local_discovery', NULL, now()),
        (${facts.capabilities.localB}::uuid, ${users.providerB.id}::uuid, 'skill', 'Synthetic locality B capability', 'local_discovery', NULL, now()),
        (${facts.capabilities.privateA}::uuid, ${users.owner.id}::uuid, 'skill', 'Synthetic private capability', 'private', NULL, now()),
        (${facts.capabilities.staleA}::uuid, ${users.owner.id}::uuid, 'experience', 'Synthetic stale capability', 'local_discovery', NULL, now() - interval '31 days'),
        (${facts.capabilities.expiredA}::uuid, ${users.owner.id}::uuid, 'qualification', 'Synthetic expired capability', 'local_discovery', current_date - 1, now())
    `;

    await tx`
      INSERT INTO public.service_areas
        (id, user_id, place_id, radius_km, note, visibility, relation, travel_willingness)
      VALUES
        (${facts.serviceAreas.publicA}::uuid, ${users.owner.id}::uuid, ${places.a.id}::uuid, 10, '', 'public', 'serves', 'local'),
        (${facts.serviceAreas.localA}::uuid, ${users.owner.id}::uuid, ${places.a.id}::uuid, 10, '', 'local_discovery', 'serves', 'local'),
        (${facts.serviceAreas.localChild}::uuid, ${users.providerChild.id}::uuid, ${places.child.id}::uuid, 10, '', 'local_discovery', 'serves', 'local'),
        (${facts.serviceAreas.localB}::uuid, ${users.providerB.id}::uuid, ${places.b.id}::uuid, 10, '', 'local_discovery', 'serves', 'local'),
        (${facts.serviceAreas.localBFromProviderA}::uuid, ${users.owner.id}::uuid, ${places.b.id}::uuid, 10, '', 'local_discovery', 'serves', 'local'),
        (${facts.serviceAreas.privateA}::uuid, ${users.owner.id}::uuid, ${places.a.id}::uuid, 10, '', 'private', 'serves', 'local')
    `;

    await tx`
      INSERT INTO public.availability_windows
        (id, user_id, starts_at, ends_at, timezone, recurrence, note, visibility, expires_at, last_confirmed_at)
      VALUES
        (${facts.availability.publicA}::uuid, ${users.owner.id}::uuid, now() + interval '1 hour', now() + interval '2 hours', 'UTC', 'none', '', 'public', NULL, now()),
        (${facts.availability.localA}::uuid, ${users.owner.id}::uuid, now() + interval '1 hour', now() + interval '2 hours', 'UTC', 'none', '', 'local_discovery', NULL, now()),
        (${facts.availability.localChild}::uuid, ${users.providerChild.id}::uuid, now() + interval '1 hour', now() + interval '2 hours', 'UTC', 'none', '', 'local_discovery', NULL, now()),
        (${facts.availability.localB}::uuid, ${users.providerB.id}::uuid, now() + interval '1 hour', now() + interval '2 hours', 'UTC', 'none', '', 'local_discovery', NULL, now()),
        (${facts.availability.privateA}::uuid, ${users.owner.id}::uuid, now() + interval '1 hour', now() + interval '2 hours', 'UTC', 'none', '', 'private', NULL, now()),
        (${facts.availability.staleA}::uuid, ${users.owner.id}::uuid, now() + interval '1 hour', now() + interval '2 hours', 'UTC', 'none', '', 'local_discovery', NULL, now() - interval '31 days'),
        (${facts.availability.expiredA}::uuid, ${users.owner.id}::uuid, now() + interval '1 hour', now() + interval '2 hours', 'UTC', 'none', '', 'local_discovery', now() - interval '1 hour', now())
    `;

    await tx`
      INSERT INTO public.opportunity_preferences
        (id, user_id, preference, note, visibility, earning_preference)
      VALUES
        (${facts.opportunityPreferences.publicA}::uuid, ${users.owner.id}::uuid, 'Synthetic public preference', '', 'public', 'unstated'),
        (${facts.opportunityPreferences.localA}::uuid, ${users.owner.id}::uuid, 'Synthetic locality A preference', '', 'local_discovery', 'unstated'),
        (${facts.opportunityPreferences.localChild}::uuid, ${users.providerChild.id}::uuid, 'Synthetic child preference', '', 'local_discovery', 'unstated'),
        (${facts.opportunityPreferences.localB}::uuid, ${users.providerB.id}::uuid, 'Synthetic locality B preference', '', 'local_discovery', 'unstated'),
        (${facts.opportunityPreferences.privateA}::uuid, ${users.owner.id}::uuid, 'Synthetic private preference', '', 'private', 'unstated')
    `;

    await tx`
      INSERT INTO public.contribution_preferences (id, user_id, contribution, note, visibility)
      VALUES
        (${facts.contributions.publicA}::uuid, ${users.owner.id}::uuid, 'Synthetic public contribution', '', 'public'),
        (${facts.contributions.localA}::uuid, ${users.owner.id}::uuid, 'Synthetic locality A contribution', '', 'local_discovery'),
        (${facts.contributions.localChild}::uuid, ${users.providerChild.id}::uuid, 'Synthetic child contribution', '', 'local_discovery'),
        (${facts.contributions.localB}::uuid, ${users.providerB.id}::uuid, 'Synthetic locality B contribution', '', 'local_discovery'),
        (${facts.contributions.privateA}::uuid, ${users.owner.id}::uuid, 'Synthetic private contribution', '', 'private')
    `;
  });
  fixturesCreated = true;
}

async function cleanupFixtures() {
  await sql.begin(async (tx) => {
    for (const id of Object.values(needs)) {
      await tx`DELETE FROM public.needs WHERE id = ${id}::uuid`;
    }
    for (const group of factTables) {
      for (const id of Object.values(group.ids)) {
        await tx.unsafe("DELETE FROM public." + group.table + " WHERE id = $1::uuid", [id]);
      }
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
    const userChild = jwtFor(users.childReader.id);
    const userNoGrant = jwtFor(users.noGrant.id);

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
    await expectZeroPlaceCount("A member cannot count B locality rows", places.b.id, userA);

    // Probe unfiltered collection endpoints, not only known-ID reads.
    const anonCollection = await apiRequest("/rest/v1/needs?select=id,visibility", anon);
    const anonRows = Array.isArray(anonCollection.json) ? anonCollection.json : [];
    const localFixtureIds = [needs.localA, needs.child, needs.localB, needs.staleA, needs.expiredA];
    add(
      "anonymous unfiltered collection does not expose local fixtures",
      anonCollection.status === 200 &&
        localFixtureIds.every((id) => !anonRows.some((row) => row.id === id)),
      "expected all synthetic local_discovery fixtures to be absent",
    );
    const aCollection = await apiRequest("/rest/v1/needs?select=id,visibility", userA);
    const aRows = Array.isArray(aCollection.json) ? aCollection.json : [];
    add(
      "A unfiltered collection returns exact A place only",
      aCollection.status === 200 &&
        aRows.some((row) => row.id === needs.localA) &&
        ![needs.child, needs.localB].some((id) => aRows.some((row) => row.id === id)),
      "expected only the exact authorized place from synthetic local rows",
    );

    // PostgREST IN and OR filters must never widen the RLS decision.
    const inQuery = new URLSearchParams({
      select: "id,place_id,visibility",
      place_id: "in.(" + places.a.id + "," + places.child.id + "," + places.b.id + ")",
    });
    const inResponse = await apiRequest("/rest/v1/needs?" + inQuery.toString(), userA);
    const inRows = Array.isArray(inResponse.json) ? inResponse.json : [];
    add(
      "place_id=in cannot cross the RLS locality boundary",
      inResponse.status === 200 &&
        inRows.some((row) => row.id === needs.localA) &&
        ![needs.child, needs.localB].some((id) => inRows.some((row) => row.id === id)),
      "expected only locality A among the synthetic place-filtered rows",
    );
    const orQuery = new URLSearchParams({
      select: "id,visibility",
      or: "(visibility.eq.public,visibility.eq.local_discovery)",
    });
    const orResponse = await apiRequest("/rest/v1/needs?" + orQuery.toString(), userA);
    const orRows = Array.isArray(orResponse.json) ? orResponse.json : [];
    add(
      "OR visibility filters cannot cross the RLS locality boundary",
      orResponse.status === 200 &&
        orRows.some((row) => row.id === needs.publicA) &&
        orRows.some((row) => row.id === needs.localA) &&
        ![needs.child, needs.localB].some((id) => orRows.some((row) => row.id === id)),
      "expected public plus exact-place local rows only",
    );

    const headResponse = await apiRequest(
      needPath(needs.localB),
      userA,
      { Prefer: "count=exact" },
      "HEAD",
    );
    const headRange = headResponse.headers.get("content-range") ?? "";
    const slashIndex = headRange.lastIndexOf("/");
    const headTotal = slashIndex >= 0 ? headRange.slice(slashIndex + 1) : "";
    add(
      "HEAD with exact count cannot reveal cross-locality row existence",
      headResponse.status === 200 && headTotal === "0",
      "expected a zero Content-Range total for locality B when queried by member A",
    );

    // RLS may return 204 for a filtered no-op. Read the row using the privileged
    // local DB connection afterward to prove the attempted write changed nothing.
    const patchResponse = await apiRequest(
      needPath(needs.localB),
      userA,
      { Prefer: "return=minimal" },
      "PATCH",
      { title: "Unauthorized synthetic mutation" },
    );
    const unchanged = await sql`
      SELECT title FROM public.needs WHERE id = ${needs.localB}::uuid
    `;
    add(
      "cross-locality PATCH is a no-op",
      patchResponse.status >= 200 &&
        patchResponse.status < 300 &&
        unchanged.length === 1 &&
        unchanged[0].title === "Synthetic Local B",
      "expected no change to locality B from a locality A member",
    );
    await expectZero(
      "A parent-place membership does not grant child-place access",
      needs.child,
      userA,
    );

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

    // Exercise every per-fact table through PostgREST, including known-ID
    // reads and exact-count HEAD requests for hidden rows.
    async function expectOneFact(name, table, id, token, visibility) {
      try {
        const query = new URLSearchParams({
          select: "id,visibility",
          id: "eq." + id,
        });
        const response = await apiRequest(
          "/rest/v1/" + table + "?" + query.toString(),
          token,
        );
        const rows = Array.isArray(response.json) ? response.json : null;
        add(
          name,
          response.status === 200 &&
            rows?.length === 1 &&
            rows[0]?.id === id &&
            rows[0]?.visibility === visibility,
          "expected exactly one permitted synthetic fact; HTTP " + response.status,
        );
      } catch {
        add(name, false, "request failed; details withheld");
      }
    }

    async function expectZeroFact(name, table, id, token) {
      try {
        const query = new URLSearchParams({
          select: "id,visibility",
          id: "eq." + id,
        });
        const response = await apiRequest(
          "/rest/v1/" + table + "?" + query.toString(),
          token,
        );
        const rows = Array.isArray(response.json) ? response.json : null;
        add(
          name,
          response.status === 200 && Array.isArray(rows) && rows.length === 0,
          "expected zero visible synthetic facts; HTTP " + response.status,
        );
      } catch {
        add(name, false, "request failed; details withheld");
      }
    }

    async function expectZeroFactHead(name, table, id, token) {
      try {
        const query = new URLSearchParams({
          select: "id",
          id: "eq." + id,
        });
        const response = await apiRequest(
          "/rest/v1/" + table + "?" + query.toString(),
          token,
          { Prefer: "count=exact", Range: "0-0" },
          "HEAD",
        );
        const range = response.headers.get("content-range") ?? "";
        const slash = range.lastIndexOf("/");
        const total = slash >= 0 ? range.slice(slash + 1) : "";
        add(
          name,
          response.status === 200 && total === "0",
          "expected Content-Range total zero; HTTP " + response.status,
        );
      } catch {
        add(name, false, "request failed; details withheld");
      }
    }

    for (const group of factTables) {
      const facts = group.ids;
      await expectOneFact(
        "anon reads explicit public " + group.table,
        group.table,
        facts.publicA,
        anon,
        "public",
      );
      await expectZeroFact(
        "anon cannot read local A in " + group.table,
        group.table,
        facts.localA,
        anon,
      );
      await expectZeroFact(
        "anon cannot read child in " + group.table,
        group.table,
        facts.localChild,
        anon,
      );
      await expectZeroFact(
        "anon cannot read local B in " + group.table,
        group.table,
        facts.localB,
        anon,
      );
      await expectZeroFact(
        "anon cannot read private in " + group.table,
        group.table,
        facts.privateA,
        anon,
      );

      await expectOneFact(
        "A reads exact A fact in " + group.table,
        group.table,
        facts.localA,
        userA,
        "local_discovery",
      );
      await expectZeroFact(
        "A cannot read child fact in " + group.table,
        group.table,
        facts.localChild,
        userA,
      );
      await expectZeroFact(
        "A cannot read B fact in " + group.table,
        group.table,
        facts.localB,
        userA,
      );
      await expectZeroFact(
        "A cannot read private fact in " + group.table,
        group.table,
        facts.privateA,
        userA,
      );
      await expectZeroFactHead(
        "A cannot infer B existence by HEAD in " + group.table,
        group.table,
        facts.localB,
        userA,
      );

      await expectOneFact(
        "B reads exact B fact in " + group.table,
        group.table,
        facts.localB,
        userB,
        "local_discovery",
      );
      await expectZeroFact(
        "B cannot read A fact in " + group.table,
        group.table,
        facts.localA,
        userB,
      );
      await expectZeroFact(
        "B cannot read child fact in " + group.table,
        group.table,
        facts.localChild,
        userB,
      );
      await expectZeroFact(
        "B cannot read private fact in " + group.table,
        group.table,
        facts.privateA,
        userB,
      );

      await expectOneFact(
        "child reader reads exact child fact in " + group.table,
        group.table,
        facts.localChild,
        userChild,
        "local_discovery",
      );
      await expectZeroFact(
        "child reader cannot read A fact in " + group.table,
        group.table,
        facts.localA,
        userChild,
      );
      await expectZeroFact(
        "child reader cannot read B fact in " + group.table,
        group.table,
        facts.localB,
        userChild,
      );
      await expectZeroFact(
        "child reader cannot read private fact in " + group.table,
        group.table,
        facts.privateA,
        userChild,
      );

      await expectZeroFact(
        "profile-only user cannot read local A in " + group.table,
        group.table,
        facts.localA,
        userNoGrant,
      );
      await expectOneFact(
        "owner retains own private fact in " + group.table,
        group.table,
        facts.privateA,
        jwtFor(users.owner.id),
        "private",
      );
    }
    await expectZeroFact(
      "A cannot read service-area row targeted at B",
      "service_areas",
      facts.serviceAreas.localBFromProviderA,
      userA,
    );
    await expectOneFact(
      "B can read service-area row targeted at B even when provider profile is A",
      "service_areas",
      facts.serviceAreas.localBFromProviderA,
      userB,
      "local_discovery",
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
