import { privatePage } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useSession } from "@/hooks/use-session";
import { getMyOpportunities } from "@/lib/needs.functions";
import { getMyCapabilityProfile } from "@/lib/capability.functions";
import { describePay, isPaidNeed, skillGaps } from "@/lib/earning";
import { DataErrorState } from "@/components/data-state";
import { eventDate } from "@/components/layer-colour";

const title = "Ways to earn — The Living World";
const description =
  "Paid work people near you have actually asked for, matched to what you've said you can do, and the skills those asks name that you haven't added yet.";

export const Route = createFileRoute("/earn")({
  head: () => privatePage({ path: "", title, description }),
  component: EarnPage,
});

function EarnPage() {
  const { user, ready } = useSession();
  const loadOpps = useServerFn(getMyOpportunities);
  const loadProfile = useServerFn(getMyCapabilityProfile);
  const opps = useQuery({
    queryKey: ["opportunities", "mine"],
    queryFn: () => loadOpps(),
    enabled: Boolean(user),
  });
  const profile = useQuery({
    queryKey: ["capability-profile", "mine"],
    queryFn: () => loadProfile(),
    enabled: Boolean(user),
  });

  const paid = (opps.data ?? []).filter((o) => isPaidNeed(o.need));
  const gaps = skillGaps(
    paid.map((o) => o.need),
    (profile.data?.capabilities ?? []).map((c) => c.label),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl">Ways to earn</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Only real, paid asks from people near you, matched against what you've said you can do.
        Nothing here is an estimate of what you'll earn, and no income is promised.
      </p>

      {ready && !user ? (
        <p className="card-paper mt-6 p-5 text-sm">
          <Link to="/auth" className="focus-ink underline">
            Sign in
          </Link>{" "}
          to see this. It's built from your own words.
        </p>
      ) : null}

      {user && opps.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Looking…</p>
      ) : null}
      {user && opps.isError ? <DataErrorState retry={() => void opps.refetch()} /> : null}

      {user && opps.data ? (
        <section className="mt-8">
          <h2 className="text-xl">Paid work you could do</h2>
          {paid.length === 0 ? (
            <div className="card-paper mt-3 p-5 text-sm">
              <p>No paid asks near you fit what you've said, right now. That's a real answer.</p>
              <p className="mt-2 text-muted-foreground">
                <Link to="/profile" className="focus-ink underline">
                  Add what you can do, where you'll go and when you're free
                </Link>{" "}
                and this will change when real asks appear.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {paid.map((o) => (
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
                    · {describePay(o.need)}
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
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {user && opps.data && profile.data ? (
        <section className="mt-10">
          <h2 className="text-xl">Skills these asks name that you haven't added</h2>
          {gaps.length === 0 ? (
            <p className="card-paper mt-3 p-5 text-sm text-muted-foreground">
              None yet. This only counts skills named in real paid asks above.
            </p>
          ) : (
            <ul className="card-paper mt-3 space-y-1 p-5 text-sm">
              {gaps.map((g) => (
                <li key={g.label}>
                  · {g.label}{" "}
                  <span className="text-muted-foreground">
                    — named in {g.askedBy} {g.askedBy === 1 ? "ask" : "asks"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            If you already have one, add it on your{" "}
            <Link to="/profile" className="focus-ink underline">
              profile
            </Link>
            . Training suggestions aren't connected yet.
          </p>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl">Still to come</h2>
        <ul className="card-paper mt-3 space-y-2 p-5 text-sm text-muted-foreground">
          <li>· Training and courses — no verified providers connected yet.</li>
          <li>· Starting something of your own — not built yet.</li>
          <li>
            · Community and housing support — for now you can{" "}
            <Link to="/give" className="focus-ink underline">
              offer an hour
            </Link>
            .
          </li>
        </ul>
      </section>
    </main>
  );
}
