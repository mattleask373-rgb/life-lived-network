import { privatePage } from "@/lib/seo";
import { FrontDoorContext } from "@/components/front-door-context";
import { parseQuerySearch } from "@/lib/search-context";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { sendConnectionRequest } from "@/lib/connection.functions";

import { useSession } from "@/hooks/use-session";
import { getMyOpportunities } from "@/lib/needs.functions";
import { OPPORTUNITY_HEADING, OPPORTUNITY_ORDER } from "@/lib/reciprocal";
import { PAYMENT_MODELS } from "@/lib/needs";
import { DataErrorState } from "@/components/data-state";
import { isDataErrorCode } from "@/lib/data/errors";
import { eventDate, money } from "@/components/layer-colour";

const title = "What could you help with? — Real World Atlas";
const description =
  "Real things people near you have asked for, matched only against what you've actually said you can do, where you'd go and when you're free.";

export const Route = createFileRoute("/help")({
  head: () => privatePage({ path: "", title, description }),
  validateSearch: parseQuerySearch,
  component: HelpPage,
});

function Offer({ needId, askerId }: { needId: string; askerId: string }) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const send = useMutation({ mutationFn: useServerFn(sendConnectionRequest) });

  if (send.isSuccess) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Sent. It's in your{" "}
        <Link to="/conversations" className="focus-ink underline">
          conversations
        </Link>
        , along with what it was about.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ink mt-3 rounded-full border border-border bg-card px-4 py-1.5 text-sm"
      >
        I could help with this
      </button>
    );
  }

  return (
    <div className="mt-3">
      <label className="grid gap-1 text-sm">
        In your own words
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Optional. Why you could help, or when you're free."
          className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>
      <button
        type="button"
        disabled={send.isPending}
        onClick={() =>
          send.mutate({
            data: { needId, recipientId: askerId, direction: "offer", note: note.trim() },
          })
        }
        className="focus-ink mt-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm disabled:opacity-60"
      >
        Send it
      </button>
      {send.isError ? (
        <p className="mt-2 text-xs text-muted-foreground">
          That didn't send. Try again in a moment.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        They'll see what you wrote and the thing it's about. No contact details are shared.
      </p>
    </div>
  );
}

function HelpPage() {
  const { user, ready } = useSession();
  const { from } = Route.useSearch();
  const load = useServerFn(getMyOpportunities);
  const {
    data,
    isLoading,
    isError,
    error: dataErrorForScope,
    refetch,
  } = useQuery({
    queryKey: ["opportunities", "mine"],
    queryFn: () => load(),
    enabled: Boolean(user),
  });
  const opportunities = data?.opportunities ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl">What could you help with?</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Nothing here is guessed. It comes from what you've said you can do, the places you said
        you'd go, and the times you said you're free. Change any of those and this changes.
      </p>

      <FrontDoorContext
        from={from}
        guidance="These words are context only. They have not changed your profile or implied availability; your suggestions still come from what you have actually recorded."
      />

      {ready && !user ? (
        <p className="card-paper mt-6 p-5 text-sm">
          <Link to="/auth" className="focus-ink underline">
            Sign in
          </Link>{" "}
          to see this. It's built from your own words, so it's yours alone.
        </p>
      ) : null}

      {user && isLoading ? <p className="mt-6 text-sm text-muted-foreground">Looking…</p> : null}
      {user && isError ? (
        isDataErrorCode(dataErrorForScope, "SCOPE_TOO_WIDE") ? (
          <div className="card-paper mt-6 p-4 text-sm" role="alert">
            <p>This search covers more places than can be checked in one request.</p>
            <p className="mt-1 text-muted-foreground">
              Narrow the places on your profile, then try again.
            </p>
            <Link to="/profile" className="focus-ink mt-2 inline-block underline">
              Review your places
            </Link>
          </div>
        ) : (
          <DataErrorState retry={() => void refetch()} />
        )
      ) : null}

      {user && data?.status === "needs_places" ? (
        <div className="card-paper mt-6 p-5 text-sm" role="status">
          <p>We need a place to start from before we can check nearby asks.</p>
          <p className="mt-2 text-muted-foreground">
            Add a home locality or service area to your{" "}
            <Link to="/profile" className="focus-ink underline">
              profile
            </Link>
            . We won't treat a missing place as proof that no opportunities exist.
          </p>
        </div>
      ) : null}

      {user && data?.status === "partial" ? (
        <div className="card-paper mt-6 p-4 text-sm" role="status">
          <p className="font-medium">
            {opportunities.length === 0
              ? "We couldn't confirm that no suitable ask exists."
              : "These are possible matches from a bounded recent search."}
          </p>
          <p className="mt-1 text-muted-foreground">
            At least {data.cappedChunks} part{data.cappedChunks === 1 ? "" : "s"} of this search reached
            the candidate limit, so older asks may exist beyond the results checked. Narrow your home
            or service areas in your{" "}
            <Link to="/profile" className="focus-ink underline">
              profile
            </Link>{" "}
            to search a smaller scope.
          </p>
        </div>
      ) : null}

      {user && data?.status === "complete" && opportunities.length === 0 ? (
        <div className="card-paper mt-6 p-5 text-sm">
          <p>Nothing near you that fits what you've said, right now. That's a real answer.</p>
          <p className="mt-2 text-muted-foreground">
            You could{" "}
            <Link to="/profile" className="focus-ink underline">
              say a bit more about what you can do
            </Link>
            , or close this and get on with your day.
          </p>
        </div>
      ) : null}

      {OPPORTUNITY_ORDER.map((kind) => {
        const group = opportunities.filter((o) => o.kind === kind);
        if (!group.length) return null;
        return (
          <section key={kind} className="mt-8">
            <h2 className="text-xl">{OPPORTUNITY_HEADING[kind]}</h2>
            <ul className="mt-3 space-y-3">
              {group.map((o) => (
                <li key={o.id} className="card-paper p-5">
                  <Link
                    to="/need/$id"
                    params={{ id: o.need.id }}
                    className="focus-ink text-lg underline"
                  >
                    {o.need.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.need.placeText} ·{" "}
                    {o.need.startsAt
                      ? eventDate(o.need.startsAt, o.need.timezone)
                      : "Time still to agree"}{" "}
                    ·{" "}
                    {PAYMENT_MODELS.find((p) => p.id === o.need.paymentModel)?.label ?? "Not said"}
                    {o.need.budget ? ` (${money(o.need.budget, o.need.currency)})` : ""}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {o.why.map((w) => (
                      <li key={w}>· {w}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">{o.caveat}</p>
                  {o.notes.map((n) => (
                    <p key={n} className="mt-1 text-xs text-muted-foreground">
                      {n}
                    </p>
                  ))}
                  <Offer needId={o.need.id} askerId={o.need.creatorId} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
