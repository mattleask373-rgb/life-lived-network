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

interface LifeListIdentity {
  userId: string | null;
  ready: boolean;
  failed: boolean;
}

function sameLifeListIdentity(left: LifeListIdentity, right: LifeListIdentity): boolean {
  return left.userId === right.userId && left.ready === right.ready && left.failed === right.failed;
}

export function useLifeList() {
  const { user, ready: sessionReady, error: sessionError, retry: retrySession } = useSession();
  const [items, setItems] = useState<LifeListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [writeError, setWriteError] = useState(false);
  const [itemsOwner, setItemsOwner] = useState<string | null | undefined>(undefined);
  const itemsRef = useRef<LifeListItem[]>([]);
  const itemsOwnerRef = useRef<string | null | undefined>(undefined);
  const activeIdentityRef = useRef<LifeListIdentity>({
    userId: user?.id ?? null,
    ready: sessionReady,
    failed: Boolean(sessionError),
  });
  activeIdentityRef.current = {
    userId: user?.id ?? null,
    ready: sessionReady,
    failed: Boolean(sessionError),
  };
  const generation = useRef(0);
  const loadGeneration = useRef(0);
  const mounted = useRef(false);
  // Serialize mutations so quick repeated clicks cannot use stale snapshots.
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const load = useCallback(async () => {
    const loadRequest = ++loadGeneration.current;
    const identity: LifeListIdentity = {
      userId: user?.id ?? null,
      ready: sessionReady,
      failed: Boolean(sessionError),
    };
    setReady(false);
    setLoadError(false);
    setWriteError(false);

    // Wait for writes queued before this read, then verify that neither the
    // account nor the load attempt changed while we were waiting.
    await mutationQueueRef.current;
    if (
      !mounted.current ||
      loadGeneration.current !== loadRequest ||
      !sameLifeListIdentity(activeIdentityRef.current, identity)
    ) {
      return;
    }
    const request = ++generation.current;
    const isCurrent = () =>
      mounted.current &&
      generation.current === request &&
      loadGeneration.current === loadRequest &&
      sameLifeListIdentity(activeIdentityRef.current, identity);

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
        itemsOwnerRef.current = null;
        setItemsOwner(null);
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
      itemsOwnerRef.current = userId;
      setItemsOwner(userId);
      setItems(loaded);
      // Only clear the local source after both the merge and the account read
      // have succeeded, so a follow-up read failure cannot lose the local copy.
      if (local.length) writeLifeList([]);
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
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      // Invalidate queued work and reads across unmount/account changes.
      generation.current += 1;
      loadGeneration.current += 1;
    };
  }, [load]);

  const enqueueMutation = useCallback(
    (expectedUserId: string | null, mutate: LifeListMutation): Promise<boolean> => {
      let request = 0;
      const operation = mutationQueueRef.current.then(async () => {
        const identity = activeIdentityRef.current;
        // A queued click may outlive the account that created its callback. Do
        // not let it write using that old identity or the previous account's list.
        if (
          !mounted.current ||
          !identity.ready ||
          identity.failed ||
          identity.userId !== expectedUserId ||
          itemsOwnerRef.current !== expectedUserId
        ) {
          return false;
        }

        // Invalidate any read already in flight before applying a confirmed write.
        request = ++generation.current;
        const current = itemsRef.current;
        const next = await mutate(current);
        const currentIdentity = activeIdentityRef.current;
        // A write may complete after unmount or an account switch. Never publish
        // its snapshot into the new account's UI.
        if (
          !mounted.current ||
          generation.current !== request ||
          !currentIdentity.ready ||
          currentIdentity.failed ||
          currentIdentity.userId !== expectedUserId ||
          itemsOwnerRef.current !== expectedUserId
        ) {
          return false;
        }
        itemsRef.current = next;
        setItems(next);
        setWriteError(false);
        setReady(true);
        return true;
      });

    // Keep read errors and write errors separate, and never call state setters
    // after unmount. A failed write leaves the last confirmed state unchanged.
    const handled = operation.catch(() => {
      if (mounted.current && generation.current === request) {
        setWriteError(true);
        setReady(true);
      }
      return false;
    });
      mutationQueueRef.current = handled.then(() => undefined);
      return handled;
    },
    [],
  );

  const toggle = useCallback(
    (ref: string, category: LifeListCategory = "want to do"): Promise<boolean> => {
      const expectedUserId = user?.id ?? null;
      return enqueueMutation(expectedUserId, async (current) => {
        const saved = current.some((item) => item.ref === ref);
        const next = saved
          ? current.filter((item) => item.ref !== ref)
          : [...current, { ref, category }];

        if (expectedUserId) {
          if (saved) {
            const { error } = await supabase
              .from("saved_items")
              .delete()
              .eq("ref", ref)
              .eq("user_id", expectedUserId);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("saved_items")
              .upsert({ user_id: expectedUserId, ref, category }, { onConflict: "user_id,ref" });
            if (error) throw error;
          }
        } else {
          writeLifeList(next);
        }

        return next;
      });
    },
    [enqueueMutation, user?.id],
  );

  const setCategory = useCallback(
    (ref: string, category: LifeListCategory): Promise<boolean> => {
      const expectedUserId = user?.id ?? null;
      return enqueueMutation(expectedUserId, async (current) => {
        const existing = current.find((item) => item.ref === ref);
        if (!existing) return current;
        const next = current.map((item) => (item.ref === ref ? { ...item, category } : item));

        if (expectedUserId) {
          const { error } = await supabase
            .from("saved_items")
            .upsert({ user_id: expectedUserId, ref, category }, { onConflict: "user_id,ref" });
          if (error) throw error;
        } else {
          writeLifeList(next);
        }

        return next;
      });
    },
    [enqueueMutation, user?.id],
  );

  const retryLoad = () => {
    if (sessionError) {
      retrySession();
    } else {
      void load();
    }
  };

  const activeUserId = user?.id ?? null;
  const visibleItems = itemsOwner === activeUserId ? items : [];
  const visibleReady = ready && itemsOwner === activeUserId;
  const visibleWriteError = writeError && itemsOwner === activeUserId;

  return {
    items: visibleItems,
    ids: visibleItems.map((item) => item.ref),
    ready: visibleReady,
    loadError,
    writeError: visibleWriteError,
    retryLoad,
    toggle,
    setCategory,
    has: (ref: string) => visibleItems.some((item) => item.ref === ref),
    signedIn: Boolean(user),
  };
}
