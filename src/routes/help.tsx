import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { sendConnectionRequest } from "@/lib/connection.functions";

import { useSession } from "@/hooks/use-session";
import { getMyOpportunities } from "@/lib/needs.functions";
import { OPPORTUNITY_HEADING, OPPORTUNITY_ORDER } from "@/lib/reciprocal";
import { PAYMENT_MODELS } from "@/lib/needs";
import { privatePage } from "@/lib/seo";

const title = "What could you help with? — The Living World";
const description =
  "Real things people near you have asked for, matched only against what you've actually said you can do, where you'd go and when you're free.";

export const Route = createFileRoute("/help")({
  head: () => privatePage({ path: "", title, description }),
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
  const load = useServerFn(getMyOpportunities);
  const { data, isLoading } = useQuery({
    queryKey: ["opportunities", "mine"],
    queryFn: () => load(),
    enabled: Boolean(user),
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl">What could you help with?</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Nothing here is guessed. It comes from what you've said you can do, the places you said
        you'd go, and the times you said you're free. Change any of those and this changes.
      </p>

      {ready && !user ? (
        <p className="card-paper mt-6 p-5 text-sm">
          <Link to="/auth" className="focus-ink underline">
            Sign in
          </Link>{" "}
          to see this. It's built from your own words, so it's yours alone.
        </p>
      ) : null}

      {user && isLoading ? <p className="mt-6 text-sm text-muted-foreground">Looking…</p> : null}

      {user && data && data.length === 0 ? (
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
        const group = (data ?? []).filter((o) => o.kind === kind);
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
                      ? new Date(o.need.startsAt).toLocaleString()
                      : "Time still to agree"}{" "}
                    ·{" "}
                    {PAYMENT_MODELS.find((p) => p.id === o.need.paymentModel)?.label ?? "Not said"}
                    {o.need.budget ? ` (${o.need.budget} ${o.need.currency})` : ""}
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
