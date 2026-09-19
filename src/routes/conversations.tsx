import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { useSession } from "@/hooks/use-session";
import {
  getConnection,
  getMyConnections,
  moveConnectionRequest,
  sendConnectionMessage,
  type ConnectionSummary,
} from "@/lib/connection.functions";
import { GROUP_HEADING, STATUS_LABEL, isOpen } from "@/lib/connection";

const title = "Your conversations — The Living World";
const description =
  "Quiet, contextual conversations about real things: what someone needed, where, and when. No inbox to keep up with, no contact details handed over.";

export const Route = createFileRoute("/conversations")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Conversations,
});

function Conversations() {
  const { user, ready } = useSession();
  const load = useServerFn(getMyConnections);
  const { data, isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: () => load(),
    enabled: Boolean(user),
  });

  const asked = (data ?? []).filter((c) =>
    c.direction === "offer" ? c.recipientId === user?.id : c.senderId === user?.id,
  );
  const offered = (data ?? []).filter((c) => !asked.includes(c));

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl">Your conversations</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Each one carries the thing it's about, so nobody has to explain themselves twice. Nothing is
        ever sent for you, and no contact details are shared by us.
      </p>

      {ready && !user ? (
        <p className="card-paper mt-6 p-5 text-sm">
          <Link to="/auth" className="focus-ink underline">
            Sign in
          </Link>{" "}
          to see these.
        </p>
      ) : null}

      {user && isLoading ? <p className="mt-6 text-sm text-muted-foreground">Looking…</p> : null}

      {user && data && data.length === 0 ? (
        <div className="card-paper mt-6 p-5 text-sm">
          <p>Nothing here yet. That's just how it is today.</p>
          <p className="mt-2 text-muted-foreground">
            You could{" "}
            <Link to="/need" className="focus-ink underline">
              ask for something
            </Link>{" "}
            or{" "}
            <Link to="/help" className="focus-ink underline">
              see what you could help with
            </Link>
            .
          </p>
        </div>
      ) : null}

      {asked.length ? <Group heading={GROUP_HEADING.asked} rows={asked} /> : null}
      {offered.length ? <Group heading={GROUP_HEADING.offered} rows={offered} /> : null}
    </main>
  );
}

function Group({ heading, rows }: { heading: string; rows: ConnectionSummary[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl">{heading}</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((c) => (
          <li key={c.id}>
            <Conversation summary={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Conversation({ summary }: { summary: ConnectionSummary }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const loadOne = useServerFn(getConnection);
  const { data } = useQuery({
    queryKey: ["connection", summary.id],
    queryFn: () => loadOne({ data: { id: summary.id } }),
    enabled: open,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["connection", summary.id] });
    void qc.invalidateQueries({ queryKey: ["connections"] });
  };
  const reply = useMutation({ mutationFn: useServerFn(sendConnectionMessage), onSuccess: refresh });
  const move = useMutation({ mutationFn: useServerFn(moveConnectionRequest), onSuccess: refresh });

  const youAre = data?.youAre;
  const live = isOpen(summary.status);

  return (
    <div className="card-paper p-5">
      <p className="text-lg leading-tight">{summary.context.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {summary.context.place} · {summary.context.when}
      </p>
      <p className="mt-2 text-sm">
        {summary.direction === "offer" ? "Offer of help" : "Invitation"} with {summary.otherName} ·{" "}
        {STATUS_LABEL[summary.status]}
      </p>
      {summary.note ? <p className="mt-2 text-sm">“{summary.note}”</p> : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ink mt-3 text-sm underline"
      >
        {open ? "Close" : summary.messageCount ? `Read (${summary.messageCount})` : "Open"}
      </button>

      {open && data ? (
        <div className="mt-3 border-t border-border pt-3">
          <ul className="space-y-2 text-sm">
            {data.messages.map((m) => (
              <li key={m.id}>
                <span className="text-muted-foreground">
                  {m.senderId === data.request.senderId
                    ? youAre === "sender"
                      ? "You"
                      : data.otherName
                    : youAre === "sender"
                      ? data.otherName
                      : "You"}
                  :{" "}
                </span>
                {m.body}
              </li>
            ))}
            {data.messages.length === 0 ? (
              <li className="text-muted-foreground">Nothing said yet.</li>
            ) : null}
          </ul>

          {live ? (
            <div className="mt-3">
              <label className="grid gap-1 text-sm">
                Reply
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={2}
                  className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!body.trim() || reply.isPending}
                  onClick={() => {
                    reply.mutate({ data: { requestId: summary.id, body: body.trim() } });
                    setBody("");
                  }}
                  className="focus-ink rounded-full border border-border bg-card px-4 py-1.5 text-sm disabled:opacity-60"
                >
                  Send
                </button>
                {youAre === "recipient" && summary.status === "sent" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => move.mutate({ data: { id: summary.id, status: "accepted" } })}
                      className="focus-ink rounded-full border border-border bg-card px-4 py-1.5 text-sm"
                    >
                      Yes, let's do it
                    </button>
                    <button
                      type="button"
                      onClick={() => move.mutate({ data: { id: summary.id, status: "declined" } })}
                      className="focus-ink rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
                    >
                      No thanks
                    </button>
                  </>
                ) : null}
                {youAre === "sender" && summary.status === "sent" ? (
                  <button
                    type="button"
                    onClick={() => move.mutate({ data: { id: summary.id, status: "withdrawn" } })}
                    className="focus-ink rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
                  >
                    Take it back
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              This one is closed. {STATUS_LABEL[summary.status]}.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
