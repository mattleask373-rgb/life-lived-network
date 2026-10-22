import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  readLifeList,
  writeLifeList,
  type LifeListCategory,
  type LifeListItem,
} from "@/lib/life-list";
import { useSession } from "./use-session";

type LifeListMutation = (current: LifeListItem[]) => Promise<LifeListItem[]>;

export function useLifeList() {
  const { user, ready: sessionReady, error: sessionError, retry: retrySession } = useSession();
  const [items, setItems] = useState<LifeListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [writeError, setWriteError] = useState(false);
  const itemsRef = useRef<LifeListItem[]>([]);
  const generation = useRef(0);
  // Serialize mutations so quick consecutive clicks cannot calculate from the same
  // stale snapshot or let a slower request overwrite a newer choice.
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const load = useCallback(async () => {
    // A retry/read must not race a pending write and restore an older server view.
    await mutationQueueRef.current;
    const request = ++generation.current;
    const isCurrent = () => generation.current === request;

    setReady(false);
    setLoadError(false);
    setWriteError(false);
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
        const local = readLifeList();
        itemsRef.current = local;
        setItems(local);
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
      const loaded = data.map((row) => ({
        ref: row.ref,
        category: row.category as LifeListCategory,
      }));
      itemsRef.current = loaded;
      setItems(loaded);
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

  const enqueueMutation = useCallback((mutate: LifeListMutation): Promise<boolean> => {
    const operation = mutationQueueRef.current.then(async () => {
      // Invalidate any read already in flight before applying a confirmed write.
      generation.current += 1;
      const current = itemsRef.current;
      const next = await mutate(current);
      itemsRef.current = next;
      setItems(next);
      setWriteError(false);
      setLoadError(false);
      setReady(true);
      return true;
    });

    // Consume the rejection and expose it to the component without an unhandled
    // promise. Failed writes leave the last confirmed state unchanged.
    const handled = operation.catch(() => {
      setWriteError(true);
      setLoadError(true);
      setReady(true);
      return false;
    });
    mutationQueueRef.current = handled.then(() => undefined);
    return handled;
  }, []);

  const toggle = useCallback(
    (ref: string, category: LifeListCategory = "want to do"): Promise<boolean> =>
      enqueueMutation(async (current) => {
        const saved = current.some((item) => item.ref === ref);
        const next = saved
          ? current.filter((item) => item.ref !== ref)
          : [...current, { ref, category }];

        if (user) {
          if (saved) {
            const { error } = await supabase
              .from("saved_items")
              .delete()
              .eq("ref", ref)
              .eq("user_id", user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("saved_items")
              .upsert({ user_id: user.id, ref, category }, { onConflict: "user_id,ref" });
            if (error) throw error;
          }
        } else {
          writeLifeList(next);
        }

        return next;
      }),
    [enqueueMutation, user],
  );

  const setCategory = useCallback(
    (ref: string, category: LifeListCategory): Promise<boolean> =>
      enqueueMutation(async (current) => {
        const existing = current.find((item) => item.ref === ref);
        if (!existing) return current;
        const next = current.map((item) => (item.ref === ref ? { ...item, category } : item));

        if (user) {
          const { error } = await supabase
            .from("saved_items")
            .upsert({ user_id: user.id, ref, category }, { onConflict: "user_id,ref" });
          if (error) throw error;
        } else {
          writeLifeList(next);
        }

        return next;
      }),
    [enqueueMutation, user],
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
    writeError,
    retryLoad,
    toggle,
    setCategory,
    has: (ref: string) => items.some((item) => item.ref === ref),
    signedIn: Boolean(user),
  };
}
