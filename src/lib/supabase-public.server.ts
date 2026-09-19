/**
 * One server-side reader for genuinely public data.
 *
 * Everything the world can see without signing in comes through here, so
 * paging, indexes and later caching have a single home. It uses the
 * publishable key, so row-level security still applies exactly as it does to
 * an anonymous visitor — it is not an admin back door.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function publicServerClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        // New-format keys are opaque strings, not bearer JWTs.
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
