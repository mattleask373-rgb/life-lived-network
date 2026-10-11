import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useSession } from "@/hooks/use-session";
import { useWorldContext } from "@/lib/world-context";
import { placePath, searchPlaces, type Place } from "@/lib/places";
import { privatePage } from "@/lib/seo";
import { DataErrorState, DataLoadingState } from "@/components/data-state";
import {
  deleteMemory,
  exportMyData,
  listMyMemories,
  saveMemory,
} from "@/lib/memories.functions";
import { MEMORY_NOTE_MAX, memoryInput, memoryWhen, type PlaceMemory } from "@/lib/memories";

const title = "Places I've known — Real World Atlas";
const description =
  "A private record of the places that have been part of your life. Only you can see it.";

export const Route = createFileRoute("/memories")({
  head: () => privatePage({ path: "", title, description }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const { session, ready } = useSession();

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">Places I've known</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Private to you. Nobody else can see these, and they're never used to suggest you to
          anyone or to say you're somewhere now.
        </p>
        {!ready ? (
          <div className="mt-8">
            <DataLoadingState label="Checking who's here…" />
          </div>
        ) : !session ? (
          <div className="card-paper mt-8 p-5">
            <p>Sign in to keep a private record of places you've known.</p>
            <Link
              to="/auth"
              className="focus-ink mt-3 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm text-primary-foreground"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <Memories />
        )}
      </div>
    </main>
  );
}

function Memories() {
  const qc = useQueryClient();
  const list = useServerFn(listMyMemories);
  const remove = useServerFn(deleteMemory);
  const download = useServerFn(exportMyData);
  const [editing, setEditing] = useState<PlaceMemory | "new" | null>(null);
  const [exportState, setExportState] = useState<"idle" | "working" | "done" | "error">("idle");

  const query = useQuery({ queryKey: ["memories"], queryFn: () => list() });
  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memories"] }),
  });

  const runExport = async () => {
    setExportState("working");
    try {
      const data = await download();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `real-world-atlas-export-${data.exportedAt.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportState("done");
    } catch {
      setExportState("error");
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {editing ? (
        <MemoryForm
          memory={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            void qc.invalidateQueries({ queryKey: ["memories"] });
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="focus-ink min-h-11 rounded-full bg-primary px-5 text-sm text-primary-foreground"
        >
          Add a place
        </button>
      )}

      {query.isLoading ? (
        <DataLoadingState label="Loading your places…" className="" />
      ) : query.isError ? (
        <DataErrorState retry={() => void query.refetch()} className="" />
      ) : (query.data ?? []).length === 0 ? (
        <p className="card-paper p-5 text-sm text-muted-foreground">
          Nothing here yet. Add a place that's been part of your life — a town you grew up in, a
          street you lived on, somewhere you went once and remember.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Your places">
          {(query.data ?? []).map((m) => (
            <li key={m.id} className="card-paper p-4">
              <p className="text-lg">{m.place?.name ?? "A place no longer on record"}</p>
              <p className="text-xs text-muted-foreground">{memoryWhen(m)}</p>
              {m.note ? <p className="mt-2 whitespace-pre-wrap text-sm">{m.note}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {m.place ? (
                  <Link
                    to="/$country/$place"
                    params={{ country: m.place.countryCode.toLowerCase(), place: m.place.slug }}
                    className="focus-ink inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm"
                  >
                    What's there now
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditing(m)}
                  className="focus-ink min-h-11 rounded-full border border-border bg-card px-4 text-sm"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={del.isPending}
                  onClick={() => {
                    if (window.confirm("Delete this place from your record? This can't be undone."))
                      del.mutate(m.id);
                  }}
                  className="focus-ink min-h-11 rounded-full border border-border bg-card px-4 text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {del.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn't delete that just now. Please try again.
        </p>
      ) : null}

      <section className="card-paper p-5" aria-labelledby="export-heading">
        <h2 id="export-heading" className="text-xl">
          Download your data
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A file of your places, profile, skills, areas, availability and saved items. It is not a
          complete account export yet: conversations, requests you posted and reports aren't in it.
        </p>
        <button
          type="button"
          onClick={() => void runExport()}
          disabled={exportState === "working"}
          className="focus-ink mt-3 min-h-11 rounded-full border border-border bg-card px-4 text-sm"
        >
          {exportState === "working" ? "Preparing…" : "Download (JSON)"}
        </button>
        <p role="status" aria-live="polite" className="mt-2 text-sm">
          {exportState === "done"
            ? "Downloaded."
            : exportState === "error"
              ? "Couldn't prepare your download. Please try again."
              : ""}
        </p>
      </section>
    </div>
  );
}

function MemoryForm({
  memory,
  onDone,
  onCancel,
}: {
  memory: PlaceMemory | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { index } = useWorldContext();
  const save = useServerFn(saveMemory);
  const [placeId, setPlaceId] = useState(memory?.placeId ?? "");
  const [placeQuery, setPlaceQuery] = useState(memory?.place?.name ?? "");
  const [startedOn, setStartedOn] = useState(memory?.startedOn ?? "");
  const [endedOn, setEndedOn] = useState(memory?.endedOn ?? "");
  const [note, setNote] = useState(memory?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const results = useMemo<Place[]>(
    () => (index && placeQuery.trim() && !placeId ? searchPlaces(index, placeQuery, 8) : []),
    [index, placeQuery, placeId],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = memoryInput.safeParse({
      id: memory?.id,
      placeId,
      startedOn,
      endedOn,
      note,
    });
    if (!parsed.success) {
      setError(
        placeId ? (parsed.error.issues[0]?.message ?? "Check the details") : "Choose a place",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await save({ data: { id: memory?.id, placeId, startedOn, endedOn, note } });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that place.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="card-paper space-y-4 p-5" noValidate>
      <h2 className="text-xl">{memory ? "Edit this place" : "Add a place"}</h2>
      <div>
        <label htmlFor="memory-place" className="block text-sm text-muted-foreground">
          Place
        </label>
        <input
          id="memory-place"
          value={placeQuery}
          onChange={(e) => {
            setPlaceQuery(e.target.value);
            setPlaceId("");
          }}
          placeholder="Search towns, cities, neighbourhoods…"
          autoComplete="off"
          className="focus-ink mt-1 min-h-11 w-full rounded-md border border-border bg-card px-3"
        />
        {placeId && index ? (
          <p className="mt-1 text-xs text-muted-foreground">{placePath(index, placeId, 3)}</p>
        ) : null}
        {results.length ? (
          <ul className="mt-2 space-y-1" aria-label="Matching places">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPlaceId(p.id);
                    setPlaceQuery(p.name);
                  }}
                  className="focus-ink min-h-11 w-full rounded-md border border-border bg-card px-3 text-left text-sm"
                >
                  {index ? placePath(index, p.id, 3) : p.name}
                </button>
              </li>
            ))}
          </ul>
        ) : placeQuery.trim() && !placeId && index ? (
          <p className="mt-1 text-xs text-muted-foreground">
            No place on record matches that yet.
          </p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-muted-foreground">From (optional)</span>
          <input
            type="date"
            value={startedOn}
            onChange={(e) => setStartedOn(e.target.value)}
            className="focus-ink mt-1 min-h-11 w-full rounded-md border border-border bg-card px-3"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Until (optional)</span>
          <input
            type="date"
            value={endedOn}
            onChange={(e) => setEndedOn(e.target.value)}
            className="focus-ink mt-1 min-h-11 w-full rounded-md border border-border bg-card px-3"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-muted-foreground">Note (optional, only you see it)</span>
        <textarea
          value={note}
          maxLength={MEMORY_NOTE_MAX}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="focus-ink mt-1 w-full rounded-md border border-border bg-card p-3"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="focus-ink min-h-11 rounded-full bg-primary px-5 text-sm text-primary-foreground"
        >
          {busy ? "Saving…" : "Save privately"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="focus-ink min-h-11 rounded-full border border-border bg-card px-4 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
