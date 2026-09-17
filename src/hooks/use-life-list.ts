import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  readLifeList,
  writeLifeList,
  type LifeListCategory,
  type LifeListItem,
} from "@/lib/life-list";
import { useSession } from "./use-session";

export function useLifeList() {
  const { user, ready: sessionReady } = useSession();
  const [items, setItems] = useState<LifeListItem[]>([]);
  const [ready, setReady] = useState(false);

  // Local first, so the list appears instantly and works signed out.
  useEffect(() => {
    setItems(readLifeList());
    setReady(true);
  }, []);

  // Signed in: bring anything saved while exploring up into the account.
  useEffect(() => {
    if (!sessionReady || !user) return;
    let alive = true;
    (async () => {
      const local = readLifeList();
      if (local.length) {
        await supabase
          .from("saved_items")
          .upsert(
            local.map((i) => ({ user_id: user.id, ref: i.ref, category: i.category })),
            { onConflict: "user_id,ref" },
          );
        writeLifeList([]);
      }
      const { data } = await supabase.from("saved_items").select("ref, category");
      if (!alive) return;
      setItems(
        (data ?? []).map((r) => ({
          ref: r.ref,
          category: r.category as LifeListCategory,
        })),
      );
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [sessionReady, user]);

  const toggle = useCallback(
    (ref: string, category: LifeListCategory = "want to do") => {
      setItems((prev) => {
        const saved = prev.some((i) => i.ref === ref);
        const next = saved
          ? prev.filter((i) => i.ref !== ref)
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
        const next = prev.map((i) => (i.ref === ref ? { ...i, category } : i));
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

  return {
    items,
    ids: items.map((i) => i.ref),
    ready,
    toggle,
    setCategory,
    has: (ref: string) => items.some((i) => i.ref === ref),
    signedIn: Boolean(user),
  };
}
