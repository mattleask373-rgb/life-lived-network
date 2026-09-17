import { useCallback, useEffect, useState } from "react";
import { readLifeList, writeLifeList } from "@/lib/life-list";

export function useLifeList() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readLifeList());
    setReady(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeLifeList(next);
      return next;
    });
  }, []);

  return { ids, ready, toggle, has: (id: string) => ids.includes(id) };
}
