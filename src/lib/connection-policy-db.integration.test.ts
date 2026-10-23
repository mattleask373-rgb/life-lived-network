import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

// Check if a local PostgreSQL socket or connection string is available
const PG_SOCKET = process.env.TEST_PG_SOCKET || "/tmp/pg_socket";
const PG_PORT = process.env.TEST_PG_PORT || "54321";
const PG_USER = process.env.TEST_PG_USER || "postgres";
const PG_DATABASE = process.env.TEST_PG_DB || "postgres";

const isDbAvailable = () => {
  try {
    const res = spawnSync(
      "psql",
      ["-U", PG_USER, "-h", PG_SOCKET, "-p", PG_PORT, "-d", PG_DATABASE, "-c", "SELECT 1;"],
      { encoding: "utf8", timeout: 2000 },
    );
    return res.status === 0;
  } catch {
    return false;
  }
};

const runPsql = (sql: string) => {
  const res = spawnSync(
    "psql",
    ["-U", PG_USER, "-h", PG_SOCKET, "-p", PG_PORT, "-d", PG_DATABASE, "-c", sql],
    { encoding: "utf8", timeout: 5000 },
  );
  return {
    status: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
  };
};

describe.runIf(isDbAvailable())("PR #162 two-account database isolation integration test", () => {
  const ALICE_ID = "11111111-1111-1111-1111-111111111111";
  const BOB_ID = "22222222-2222-2222-2222-222222222222";
  const CHARLIE_ID = "33333333-3333-3333-3333-333333333333";
  const NEED_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  const resetFixtures = () => {
    const setupSql = `
      TRUNCATE public.connection_messages, public.connection_requests, public.user_blocks, public.content_reports, public.needs CASCADE;
      INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
        ('${ALICE_ID}', 'alice@test.local', '{"display_name":"Alice"}'),
        ('${BOB_ID}', 'bob@test.local', '{"display_name":"Bob"}'),
        ('${CHARLIE_ID}', 'charlie@test.local', '{"display_name":"Charlie"}')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.needs (id, creator_id, category, title, place_text, status, visibility)
      VALUES ('${NEED_ID}', '${ALICE_ID}', 'practical', 'Need gardening', 'Bristol', 'open', 'public');
    `;
    const res = runPsql(setupSql);
    expect(res.status).toBe(0);
  };

  it("proves conversation requests and captured context cannot be read, altered, or spoofed across accounts", () => {
    resetFixtures();

    // 1. Bob creates a connection request to Alice
    const bobInsertSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      INSERT INTO public.connection_requests (need_id, sender_id, recipient_id, direction, note)
      VALUES ('${NEED_ID}', '${BOB_ID}', '${ALICE_ID}', 'offer', 'Hi Alice, I can help');
      RESET ROLE;
    `;
    const bobInsertRes = runPsql(bobInsertSql);
    expect(bobInsertRes.status).toBe(0);

    // 2. Verify Bob sees 1 request with server-derived context
    const bobSelectSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      SELECT context_title, context_place, status FROM public.connection_requests;
      RESET ROLE;
    `;
    const bobSelectRes = runPsql(bobSelectSql);
    expect(bobSelectRes.stdout).toContain("Need gardening");
    expect(bobSelectRes.stdout).toContain("Bristol");
    expect(bobSelectRes.stdout).toContain("sent");

    // 3. Verify Alice (recipient) sees the request
    const aliceSelectSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${ALICE_ID}';
      SELECT count(*) AS visible_count FROM public.connection_requests;
      RESET ROLE;
    `;
    const aliceSelectRes = runPsql(aliceSelectSql);
    expect(aliceSelectRes.stdout).toMatch(/1\s+\(1 row\)/);

    // 4. Verify Charlie (unrelated third party) CANNOT see the request (RLS isolation)
    const charlieSelectSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${CHARLIE_ID}';
      SELECT count(*) AS visible_count FROM public.connection_requests;
      RESET ROLE;
    `;
    const charlieSelectRes = runPsql(charlieSelectSql);
    expect(charlieSelectRes.stdout).toMatch(/0\s+\(1 row\)/);

    // 5. Charlie CANNOT update or accept Alice and Bob's request
    const charlieUpdateSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${CHARLIE_ID}';
      UPDATE public.connection_requests SET status = 'accepted';
      RESET ROLE;
    `;
    const charlieUpdateRes = runPsql(charlieUpdateSql);
    expect(charlieUpdateRes.stdout).toContain("UPDATE 0");

    // 6. Bob (sender) CANNOT accept his own request (status guard enforcement)
    const bobAcceptSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      UPDATE public.connection_requests SET status = 'accepted';
      RESET ROLE;
    `;
    const bobAcceptRes = runPsql(bobAcceptSql);
    expect(bobAcceptRes.stderr).toContain(
      "This participant cannot make the requested status transition",
    );

    // 7. Bob CANNOT alter captured context (least-privilege grant enforcement)
    const bobContextTamperSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      UPDATE public.connection_requests SET context_title = 'Forged Title';
      RESET ROLE;
    `;
    const bobContextTamperRes = runPsql(bobContextTamperSql);
    expect(bobContextTamperRes.stderr).toContain("permission denied for table connection_requests");

    // 8. Alice (recipient) accepts the request
    const aliceAcceptSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${ALICE_ID}';
      UPDATE public.connection_requests SET status = 'accepted';
      SELECT status FROM public.connection_requests;
      RESET ROLE;
    `;
    const aliceAcceptRes = runPsql(aliceAcceptSql);
    expect(aliceAcceptRes.stdout).toContain("UPDATE 1");
    expect(aliceAcceptRes.stdout).toContain("accepted");

    // 9. Once settled, Alice cannot reopen or change settled status
    const aliceReopenSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${ALICE_ID}';
      UPDATE public.connection_requests SET status = 'sent';
      RESET ROLE;
    `;
    const aliceReopenRes = runPsql(aliceReopenSql);
    expect(aliceReopenRes.stderr).toContain("A settled conversation request cannot be reopened");
  });

  it("proves conversation messages cannot be sent by outsiders, forged, mutated, or deleted", () => {
    resetFixtures();

    // Setup: Bob creates request and Alice accepts
    const setupConvSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      INSERT INTO public.connection_requests (need_id, sender_id, recipient_id, direction, note)
      VALUES ('${NEED_ID}', '${BOB_ID}', '${ALICE_ID}', 'offer', 'Hi Alice');
      SET request.jwt.claim.sub = '${ALICE_ID}';
      UPDATE public.connection_requests SET status = 'accepted';
      RESET ROLE;
    `;
    expect(runPsql(setupConvSql).status).toBe(0);

    // 1. Charlie attempts to send a message on Alice and Bob's request -> rejected by trigger/RLS
    const charlieMessageSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${CHARLIE_ID}';
      INSERT INTO public.connection_messages (request_id, sender_id, body)
      SELECT id, '${CHARLIE_ID}', 'Charlie eavesdropping'
      FROM public.connection_requests;
      RESET ROLE;
    `;
    const charlieMessageRes = runPsql(charlieMessageSql);
    expect(charlieMessageRes.stdout).toContain("INSERT 0 0");

    // 2. Bob sends a legitimate message on the accepted conversation
    const bobMessageSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      INSERT INTO public.connection_messages (request_id, sender_id, body)
      SELECT id, '${BOB_ID}', 'Hi Alice, looking forward to it'
      FROM public.connection_requests;
      RESET ROLE;
    `;
    const bobMessageRes = runPsql(bobMessageSql);
    expect(bobMessageRes.stdout).toContain("INSERT 0 1");

    // 3. Message read visibility: Bob and Alice see 1; Charlie sees 0
    const checkVisSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      SELECT 'bob_view' AS t, count(*) FROM public.connection_messages;
      SET request.jwt.claim.sub = '${ALICE_ID}';
      SELECT 'alice_view' AS t, count(*) FROM public.connection_messages;
      SET request.jwt.claim.sub = '${CHARLIE_ID}';
      SELECT 'charlie_view' AS t, count(*) FROM public.connection_messages;
      RESET ROLE;
    `;
    const checkVisRes = runPsql(checkVisSql);
    expect(checkVisRes.stdout).toContain("bob_view");
    expect(checkVisRes.stdout).toContain("alice_view");
    expect(checkVisRes.stdout).toContain("charlie_view |     0");

    // 4. Message mutation and deletion are completely denied
    const mutateSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      UPDATE public.connection_messages SET body = 'Tampered content';
      RESET ROLE;
    `;
    const mutateRes = runPsql(mutateSql);
    expect(mutateRes.stderr).toContain("permission denied for table connection_messages");

    const deleteSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      DELETE FROM public.connection_messages;
      RESET ROLE;
    `;
    const deleteRes = runPsql(deleteSql);
    expect(deleteRes.stderr).toContain("permission denied for table connection_messages");
  });

  it("proves user blocks and content reports isolate safety records across accounts", () => {
    resetFixtures();

    // 1. Alice blocks Bob
    const blockSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${ALICE_ID}';
      INSERT INTO public.user_blocks (blocker_id, blocked_id)
      VALUES ('${ALICE_ID}', '${BOB_ID}');
      SELECT count(*) FROM public.user_blocks;
      RESET ROLE;
    `;
    const blockRes = runPsql(blockSql);
    expect(blockRes.stdout).toContain("INSERT 0 1");

    // 2. Block visibility: Alice sees it; Bob and Charlie CANNOT see who blocked whom
    const blockVisSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      SELECT 'bob' AS t, count(*) FROM public.user_blocks;
      SET request.jwt.claim.sub = '${CHARLIE_ID}';
      SELECT 'charlie' AS t, count(*) FROM public.user_blocks;
      RESET ROLE;
    `;
    const blockVisRes = runPsql(blockVisSql);
    expect(blockVisRes.stdout).toContain("bob |     0");
    expect(blockVisRes.stdout).toContain("charlie |     0");

    // 3. Bob cannot delete or alter Alice's block
    const blockTamperSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      DELETE FROM public.user_blocks WHERE blocked_id = '${BOB_ID}';
      RESET ROLE;
    `;
    const blockTamperRes = runPsql(blockTamperSql);
    expect(blockTamperRes.stdout).toContain("DELETE 0");

    // 4. Alice files a content report against Bob
    const reportSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${ALICE_ID}';
      INSERT INTO public.content_reports (reporter_id, reported_user_id, subject_type, subject_id, reason, note)
      VALUES ('${ALICE_ID}', '${BOB_ID}', 'profile', '${BOB_ID}', 'harassment', 'Inappropriate conduct');
      SELECT status FROM public.content_reports;
      RESET ROLE;
    `;
    const reportRes = runPsql(reportSql);
    expect(reportRes.stdout).toContain("submitted");

    // 5. Report visibility: Alice (reporter) sees it; Bob (reported user) and Charlie CANNOT see it
    const reportVisSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      SELECT 'bob' AS t, count(*) FROM public.content_reports;
      SET request.jwt.claim.sub = '${CHARLIE_ID}';
      SELECT 'charlie' AS t, count(*) FROM public.content_reports;
      RESET ROLE;
    `;
    const reportVisRes = runPsql(reportVisSql);
    expect(reportVisRes.stdout).toContain("bob |     0");
    expect(reportVisRes.stdout).toContain("charlie |     0");

    // 6. Neither Bob nor Alice can delete the report, nor can Bob resolve it
    const reportTamperSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${BOB_ID}';
      UPDATE public.content_reports SET status = 'resolved', resolution = 'dismissed';
      RESET ROLE;
    `;
    const reportTamperRes = runPsql(reportTamperSql);
    expect(reportTamperRes.stdout).toContain("UPDATE 0");

    const reportDeleteSql = `
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${ALICE_ID}';
      DELETE FROM public.content_reports;
      RESET ROLE;
    `;
    const reportDeleteRes = runPsql(reportDeleteSql);
    expect(reportDeleteRes.stderr).toContain("permission denied for table content_reports");
  });
});
