/**
 * An internal tool for bringing the outside world in.
 *
 * Nothing links here from ordinary navigation and the page is never indexed.
 * Anyone without the reviewer role sees a plain refusal — and would be refused
 * by the server too, so this page is the door, not the lock.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { useSession } from "@/hooks/use-session";
import { useWorldContext } from "@/lib/world-context";
import { amISafetyReviewer } from "@/lib/moderation.functions";
import { listSources, refreshSource, type SourcePanelRow } from "@/lib/ingest.functions";
import type { IngestOutcome } from "@/lib/ingest/contract";

const title = "Sources — internal";
const description = "Internal panel for refreshing outside sources of activity. Not a public page.";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Sources,
});

function when(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Sources() {
  const { user, ready } = useSession();
  const { place } = useWorldContext();
  const checkRole = useServerFn(amISafetyReviewer);
  const load = useServerFn(listSources);
  const run = useServerFn(refreshSource);
  const [days, setDays] = useState(14);
  const [result, setResult] = useState<IngestOutcome | null>(null);
  const [failure, setFailure] = useState<string>("");

  const role = useQuery({
    queryKey: ["safety-reviewer"],
    queryFn: () => checkRole(),
    enabled: Boolean(user),
  });
  const reviewer = role.data?.reviewer === true;

  const sources = useQuery({
    queryKey: ["sources"],
    queryFn: () => load(),
    enabled: reviewer,
  });

  const refresh = useMutation({
    mutationFn: (sourceId: string) =>
      run({ data: { sourceId, placeSlug: place?.slug ?? "", days, force: true } }),
    onSuccess: (outcome) => {
      setFailure("");
      setResult(outcome);
      void sources.refetch();
    },
    onError: (error: Error) => {
      setResult(null);
      setFailure(error.message);
    },
  });

  if (!ready) return <main className="mx-auto max-w-3xl p-6">One moment.</main>;
  if (!user || (role.isFetched && !reviewer)) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl">Sources</h1>
        <p className="mt-3 text-muted-foreground">This is not open to you.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl">Sources</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Outside sources of activity. Refreshing asks a source what is happening in the locality
        currently selected — {place ? place.name : "none chosen yet"} — and brings it in credited
        and linked back. Nothing here is invented, and a source that fails changes nothing.
      </p>

      <label className="mt-4 block text-sm">
        How far ahead to ask, in days
        <input
          type="number"
          min={1}
          max={60}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="focus-ink mt-1 w-24 rounded-lg border border-border bg-background px-3 py-1.5"
        />
      </label>

      {sources.isLoading ? <p className="mt-6 text-muted-foreground">Loading.</p> : null}

      <ul className="mt-6 space-y-3">
        {(sources.data ?? []).map((source: SourcePanelRow) => (
          <li key={source.id} className="card-paper p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-base">{source.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {source.kind} · {source.accessMethod} · every {source.refreshMinutes} minutes ·{" "}
                  {source.storeImages ? "images permitted" : "images linked only"}
                </p>
              </div>
              <button
                type="button"
                disabled={refresh.isPending || !place}
                onClick={() => refresh.mutate(source.id)}
                className="focus-ink rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {refresh.isPending ? "Asking…" : "Refresh this locality"}
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div>
                <dt>State</dt>
                <dd className="text-foreground">
                  {source.enabled ? source.status : `off (${source.status})`}
                </dd>
              </div>
              <div>
                <dt>Credential</dt>
                <dd className="text-foreground">
                  {!source.credentialRequired
                    ? "not needed"
                    : source.credentialPresent
                      ? "configured"
                      : "Live source not configured"}
                </dd>
              </div>
              <div>
                <dt>Last run</dt>
                <dd className="text-foreground">{when(source.lastRunAt)}</dd>
              </div>
              <div>
                <dt>Last worked</dt>
                <dd className="text-foreground">{when(source.lastSuccessAt)}</dd>
              </div>
              <div>
                <dt>Last failed</dt>
                <dd className="text-foreground">{when(source.lastFailureAt)}</dd>
              </div>
              <div>
                <dt>Failures in a row</dt>
                <dd className="text-foreground">
                  {source.consecutiveFailures}
                  {source.lastErrorCategory ? ` · ${source.lastErrorCategory}` : ""}
                </dd>
              </div>
            </dl>
            {source.lastOutcome ? (
              <p className="mt-2 text-xs text-muted-foreground">{source.lastOutcome}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {failure ? <p className="mt-4 text-sm text-destructive">{failure}</p> : null}
      {result ? (
        <p className="mt-4 text-sm">
          {result.failure
            ? result.failure
            : `Read ${result.read} · ${result.imported} new · ${result.updated} updated · ${result.duplicates} already known`}
          {result.skipped.length ? ` · skipped ${result.skipped.length}` : ""}
        </p>
      ) : null}
    </main>
  );
}
