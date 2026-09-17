import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { EntryCard } from "@/components/entry-card";
import { EntrySheet } from "@/components/entry-sheet";
import { useLifeList } from "@/hooks/use-life-list";
import { useQuery } from "@tanstack/react-query";
import { fetchWorld } from "@/lib/listings";
import { LIFE_LIST_SEEDS, type WorldEntry } from "@/lib/world-data";

const title = "Your life list — The Living World";
const description =
  "The things you said why not to: places to go, people to meet, skills to learn and projects to help with. A private list, not a public performance.";

export const Route = createFileRoute("/life-list")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: LifeListPage,
});

function LifeListPage() {
  const { ids, ready, has, toggle } = useLifeList();
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const { data: world } = useQuery({ queryKey: ["world"], queryFn: fetchWorld });
  const saved = ids
    .map((id) => (world ?? []).find((e) => e.id === id))
    .filter((e): e is WorldEntry => Boolean(e));

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">Your life list</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only you see this. There's no score, and nothing expires.
        </p>

        {!ready ? null : saved.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {saved.map((e) => (
              <EntryCard key={e.id} entry={e} onOpen={setOpen} />
            ))}
          </div>
        ) : (
          <div className="card-paper mt-6 p-5">
            <p>Nothing saved yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Plenty of people start with something like:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {LIFE_LIST_SEEDS.map((s) => (
                <li key={s} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/"
              className="focus-ink mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              Have a look at the map
            </Link>
          </div>
        )}
      </div>

      {open ? (
        <EntrySheet
          entry={open}
          saved={has(open.id)}
          onSave={toggle}
          onClose={() => setOpen(null)}
          onOpenEntry={setOpen}
        />
      ) : null}
    </main>
  );
}
