import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authSource = readFileSync(new URL("./auth.tsx", import.meta.url), "utf8");

describe("email authentication paths", () => {
  it("offers a passwordless magic-link mode for existing accounts", () => {
    expect(authSource).toContain('type Mode = "in" | "up" | "forgot" | "magic";');
    expect(authSource).toContain("supabase.auth.signInWithOtp({");
    expect(authSource).toContain("shouldCreateUser: false");
    expect(authSource).toContain("emailRedirectTo:");
    expect(authSource).toContain("Email me a sign-in link");
    expect(authSource).toContain("Check your email — a sign-in link is on its way.");
  });

  it("does not ask for a password in magic-link or password-reset mode", () => {
    expect(authSource).toContain('{mode === "up" || mode === "in" ? (');
  });

  it("handles thrown confirmation resend errors and blocks repeated in-flight requests", () => {
    expect(authSource).toContain(
      "const [resendingConfirmation, setResendingConfirmation] = useState(false);",
    );
    expect(authSource).toContain("disabled={busy || resendingConfirmation || !email}");
    expect(authSource).toContain(
      'catch {\n                  setError("We couldn\'t resend that just now. Try again in a minute.");',
    );
    expect(authSource).toContain(
      "finally {\n                  setResendingConfirmation(false);",
    );
  });
  it("keeps password sign-in, account creation, Google OAuth and password recovery available", () => {
    expect(authSource).toContain("supabase.auth.signInWithPassword({ email, password })");
    expect(authSource).toContain("supabase.auth.signUp({");
    expect(authSource).toContain('lovable.auth.signInWithOAuth("google"');
    expect(authSource).toContain("supabase.auth.resetPasswordForEmail(email, {");
  });
});
