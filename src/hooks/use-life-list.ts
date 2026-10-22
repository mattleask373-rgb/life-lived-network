import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  readLifeList,
  writeLifeList,
  type LifeListCategory,
  type LifeListItem,
} from "@/lib/life-list";
import { useSession } from "./use-session";

export function useLifeList() {
  const {
    user,
    ready: sessionReady,
    error: sessionError,
    retry: retrySession,
  } = useSession();
  const [items, setItems] = useState<LifeListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const request = ++generation.current;
    const isCurrent = () => generation.current === request;

    setReady(false);
    setLoadError(false);
    if (!sessionReady) return;

    // A failed session read is not proof that the visitor is signed out.
    if (sessionError) {
      if (isCurrent()) {
        setLoadError(true);
        setReady(true);
      }
      return;
    }

    const userId = user?.id ?? null;
    if (!userId) {
      if (isCurrent()) {
        setItems(readLifeList());
        setReady(true);
      }
      return;
    }

    try {
      const local = readLifeList();
      if (local.length) {
        const { error: syncError } = await supabase.from("saved_items").upsert(
          local.map((item) => ({
            user_id: userId,
            ref: item.ref,
            category: item.category,
          })),
          { onConflict: "user_id,ref" },
        );

        // Keep the local copy until the account confirms the merge. A transient
        // backend failure must never look like a successful migration.
        if (syncError) throw syncError;
        writeLifeList([]);
      }

      // Defence in depth: RLS remains the authorization boundary, but the UI
      // explicitly requests only the active account's saved rows as well.
      const { data, error: readError } = await supabase
        .from("saved_items")
        .select("ref, category")
        .eq("user_id", userId);
      if (readError) throw readError;
      if (data === null) throw new Error("The saved list response was incomplete.");

      if (!isCurrent()) return;
      setItems(
        data.map((row) => ({
          ref: row.ref,
          category: row.category as LifeListCategory,
        })),
      );
      setReady(true);
    } catch {
      if (!isCurrent()) return;
      // Keep the current rows in memory, but expose an error state so callers
      // do not render a failed read as a verified empty list.
      setLoadError(true);
      setReady(true);
    }
  }, [sessionReady, sessionError, user?.id]);

  useEffect(() => {
    void load();
    return () => {
      // Ignore responses from a previous account or an obsolete retry.
      generation.current += 1;
    };
  }, [load]);

  const toggle = useCallback(
    (ref: string, category: LifeListCategory = "want to do") => {
      setItems((prev) => {
        const saved = prev.some((item) => item.ref === ref);
        const next = saved
          ? prev.filter((item) => item.ref !== ref)
          : [...prev, { ref, category }];
        if (user) {
          if (saved) {
            void supabase.from("saved_items").delete().eq("ref", ref).eq("user_id", user.id);
          } else {
            void supabase
              .from("saved_items")
              .upsert({ user_id: user.id, ref, category }, { onConflict: "user_id,ref" });
          }
        } else {
          writeLifeList(next);
        }
        return next;
      });
    },
    [user],
  );

  const setCategory = useCallback(
    (ref: string, category: LifeListCategory) => {
      setItems((prev) => {
        const next = prev.map((item) => (item.ref === ref ? { ...item, category } : item));
        if (user) {
          void supabase
            .from("saved_items")
            .upsert({ user_id: user.id, ref, category }, { onConflict: "user_id,ref" });
        } else {
          writeLifeList(next);
        }
        return next;
      });
    },
    [user],
  );

  const retryLoad = () => {
    if (sessionError) {
      retrySession();
    } else {
      void load();
    }
  };

  return {
    items,
    ids: items.map((item) => item.ref),
    ready,
    loadError,
    retryLoad,
    toggle,
    setCategory,
    has: (ref: string) => items.some((item) => item.ref === ref),
    signedIn: Boolean(user),
  };
}
