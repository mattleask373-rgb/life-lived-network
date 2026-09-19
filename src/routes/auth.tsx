import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { privatePage } from "@/lib/seo";

const title = "Join in — The Living World";
const description =
  "Explore the map without an account. Make one when you want to save something, post something real, or meet someone.";

export const Route = createFileRoute("/auth")({
  head: () => privatePage({ path: "", title, description }),
  component: AuthPage,
});

type Mode = "in" | "up" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      if (mode === "up") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
            emailRedirectTo: `${window.location.origin}/profile`,
          },
        });
        if (err) throw err;
        setNote("Check your email — there's a link in there to confirm it's you.");
      } else if (mode === "in") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        void navigate({ to: "/profile" });
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/profile`,
        });
        if (err) throw err;
        setNote("If that address has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again?");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in didn't complete.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/profile" });
  };

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-md px-4 pt-10 pb-20 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">
          {mode === "up" ? "Come in" : mode === "in" ? "Welcome back" : "Forgotten it?"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You never needed an account to look around. You need one to save things, post
          something real, or say hello to someone.
        </p>

        <form onSubmit={submit} className="card-paper mt-6 space-y-4 p-5">
          {mode === "up" ? (
            <label className="block text-sm">
              <span className="text-muted-foreground">What should people call you?</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          {mode !== "forgot" ? (
            <label className="block text-sm">
              <span className="text-muted-foreground">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="focus-ink w-full rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
          >
            {busy
              ? "One moment…"
              : mode === "up"
                ? "Make an account"
                : mode === "in"
                  ? "Sign in"
                  : "Send me a link"}
          </button>

          <button
            type="button"
            onClick={google}
            className="focus-ink w-full rounded-full border border-border bg-card px-5 py-2.5 text-sm"
          >
            Continue with Google
          </button>

          <div className="flex flex-wrap gap-3 pt-1 text-sm text-muted-foreground">
            {mode !== "up" ? (
              <button type="button" className="underline" onClick={() => setMode("up")}>
                I'm new here
              </button>
            ) : null}
            {mode !== "in" ? (
              <button type="button" className="underline" onClick={() => setMode("in")}>
                I already have an account
              </button>
            ) : null}
            {mode !== "forgot" ? (
              <button type="button" className="underline" onClick={() => setMode("forgot")}>
                I've forgotten my password
              </button>
            ) : null}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline">
            Or just carry on looking at the map
          </Link>
        </p>
      </div>
    </main>
  );
}
