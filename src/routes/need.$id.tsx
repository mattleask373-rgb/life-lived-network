import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { findSupplyForNeed } from "@/lib/needs.functions";
import {
  BAND_HEADING,
  BAND_ORDER,
  type SupplyBand,
  type SupplyResult,
} from "@/lib/supply-engine";

const title = "Who could help — The Living World";
const description =
  "Real possibilities for a real need: people who've said they can help, community projects, freely offered hours, swaps, and travellers passing through — each one plainly labelled.";

export const Route = createFileRoute("/need/$id")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">
        We couldn't load this one just now. Try again in a moment.
      </p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">That need isn't here any more.</p>
    </Shell>
  ),
  component: NeedAnswer,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6">
        <Link to="/need" className="focus-ink text-xs uppercase tracking-[0.2em] text-muted-foreground">
          ← Needs
        </Link>
        {children}
      </div>
    </main>
  );
}

function NeedAnswer() {
  const { id } = Route.useParams();
  const find = useServerFn(findSupplyForNeed);
  const { data, isLoading } = useQuery({
    queryKey: ["supply", id],
    queryFn: () => find({ data: { needId: id } }),
  });

  if (isLoading) {
    return (
      <Shell>
        <p className="mt-6 text-sm text-muted-foreground">Looking…</p>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p className="mt-6 text-sm text-muted-foreground">That need isn't here any more.</p>
      </Shell>
    );
  }

  const { need, results, quiet } = data;

  return (
    <Shell>
      <header className="mt-4">
        <h1 className="text-3xl leading-tight">{need.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {need.placeText || "Nearby"} ·{" "}
          {need.startsAt
            ? new Date(need.startsAt).toLocaleString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: need.timezone,
              })
            : "Time still to agree"}
        </p>
        {need.description ? <p className="mt-3 text-sm">{need.description}</p> : null}
      </header>

      {quiet ? (
        <section className="card-paper mt-8 p-5">
          <h2 className="text-xl">It's quiet here</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We don't have anyone or anything reliable to point you at for this, in this place, at
            this time. We'd rather say that than make something up. If you post what you can give
            on the hours page, or ask again in a day or two, the picture changes as people join.
          </p>
          <Link
            to="/give"
            className="focus-ink mt-4 inline-flex rounded-full border border-border px-4 py-2 text-sm"
          >
            See what people are giving
          </Link>
        </section>
      ) : (
        <div className="mt-8 space-y-10">
          {BAND_ORDER.map((band) => {
            const rows = results.filter((r) => r.band === band);
            if (!rows.length) return null;
            return <Band key={band} band={band} rows={rows} />;
          })}
        </div>
      )}

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Nothing here is a promise. Everything here is a real person or a real posting.
      </p>
    </Shell>
  );
}

function Band({ band, rows }: { band: SupplyBand; rows: SupplyResult[] }) {
  return (
    <section>
      <h2 className="text-2xl leading-tight">{BAND_HEADING[band]}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{rows[0]?.caveat}</p>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="card-paper p-4">
            <p className="text-lg leading-tight">{r.title}</p>
            <p className="mt-1 text-sm">{r.what}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {r.where} · {r.when}
            </p>
            {r.why.length ? (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {r.why.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
