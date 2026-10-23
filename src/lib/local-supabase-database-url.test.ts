import { describe, expect, it } from "vitest";
import { isLocalSupabaseDatabaseUrl } from "./local-supabase-database-url";

describe("local Supabase integration-test database guard", () => {
  it("accepts Postgres URLs on IPv4, IPv6, and localhost loopback hosts", () => {
    expect(
      isLocalSupabaseDatabaseUrl("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
    ).toBe(true);
    expect(
      isLocalSupabaseDatabaseUrl("postgres://postgres:postgres@localhost:54322/postgres"),
    ).toBe(true);
    expect(
      isLocalSupabaseDatabaseUrl("postgres://postgres:postgres@[::1]:54322/postgres"),
    ).toBe(true);
  });

  it("rejects hosted Supabase, arbitrary remote hosts, non-Postgres schemes, and malformed values", () => {
    for (const value of [
      undefined,
      "",
      "not-a-url",
      "https://127.0.0.1:54322/postgres",
      "postgres://postgres:password@db.example.supabase.co:5432/postgres",
      "postgresql://postgres:password@203.0.113.12:5432/postgres",
      "postgres://postgres:password@192.168.1.10:5432/postgres",
    ]) {
      expect(isLocalSupabaseDatabaseUrl(value)).toBe(false);
    }
  });
});
