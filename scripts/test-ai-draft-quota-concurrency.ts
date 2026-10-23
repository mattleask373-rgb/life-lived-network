import postgres from "postgres";

const databaseUrl = process.env["SUPABASE_DB_URL"]?.trim();
if (!databaseUrl || !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  console.error("SUPABASE_DB_URL must point to the isolated local Supabase database.");
  process.exitCode = 1;
} else {
  const sql = postgres(databaseUrl, {
    max: 32,
    connect_timeout: 10,
    idle_timeout: 5,
    onnotice: () => undefined,
  });
  const userId = crypto.randomUUID();
  const email = `quota-concurrency-${userId}@example.test`;
  let userCreated = false;

  try {
    // This script must only receive the local/disposable DB URL from CI.
    // The synthetic account and all counters are removed in finally.
    await sql`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data
      )
      VALUES (
        ${userId}::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        ${email},
        '',
        now(),
        now(),
        now(),
        ${JSON.stringify({ provider: "email", providers: ["email"] })}::jsonb,
        '{}'::jsonb
      )
    `;
    userCreated = true;

    const attempts = 25;
    const decisions = await Promise.all(
      Array.from({ length: attempts }, async () =>
        sql.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE authenticated");
          await tx`SELECT set_config('request.jwt.claim.sub', ${userId}, true)`;
          const rows = await tx`SELECT * FROM public.consume_ai_draft_quota()`;
          if (rows.length !== 1) throw new Error("Quota RPC returned an unexpected row count");
          return rows[0] as {
            allowed: boolean;
            retry_after_seconds: number;
            limit_kind: string;
          };
        }),
      ),
    );

    const allowed = decisions.filter((decision) => decision.allowed).length;
    const hourlyDenied = decisions.filter((decision) => decision.limit_kind === "hourly").length;
    const dailyDenied = decisions.filter((decision) => decision.limit_kind === "daily").length;
    const invalidRetry = decisions.some(
      (decision) => !decision.allowed && decision.retry_after_seconds <= 0,
    );

    if (allowed !== 5 || hourlyDenied !== 15 || dailyDenied !== 5 || invalidRetry) {
      console.error(
        "Concurrent quota invariant failed: " +
          JSON.stringify({ attempts, allowed, hourlyDenied, dailyDenied, invalidRetry }),
      );
      process.exitCode = 1;
    } else {
      console.log(
        "Concurrent AI quota integration test passed: " +
          JSON.stringify({ attempts, allowed, hourlyDenied, dailyDenied }),
      );
    }
  } catch {
    // Avoid printing connection strings, SQL payloads or database diagnostics.
    console.error("Concurrent AI quota integration test failed; database details withheld.");
    process.exitCode = 1;
  } finally {
    if (userCreated) {
      try {
        await sql`DELETE FROM auth.users WHERE id = ${userId}::uuid`;
      } catch {
        console.error("Synthetic quota test account cleanup failed; inspect the disposable DB.");
        process.exitCode = 1;
      }
    }
    await sql.end({ timeout: 5 });
  }
}
