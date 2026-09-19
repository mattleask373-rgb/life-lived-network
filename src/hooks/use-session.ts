import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Who's here, if anyone. Exploring never requires an account. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setReady(false);
    setError(false);
    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!alive) return;
        setSession(data.session);
        setError(Boolean(sessionError));
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [attempt]);

  return {
    session,
    user: session?.user ?? null,
    ready,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
