import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/**
 * A quiet place, presented honestly: what is known, what isn't, and real next
 * steps through existing routes. Never shows invented activity.
 */
export function EmptyPlace({
  placeName,
  needCount,
  ancestors,
  onStepOut,
}: {
  placeName: string;
  needCount: number;
  ancestors: { id: string; slug: string; name: string }[];
  onStepOut: (slug: string) => void;
}) {
  const actions = [
    { to: "/make", label: "Add something real", hint: "A place, event, project or service" },
    { to: "/need", label: "Ask for help", hint: "Post something you need" },
    { to: "/give", label: "Offer an hour", hint: "Say when you're free to help" },
  ] as const;
  return (
    <section aria-labelledby="quiet-heading" className="card-paper mt-6 p-5 sm:p-6">
      <h2 id="quiet-heading" className="text-2xl">
        {placeName} is quiet so far
      </h2>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">What we know</dt>
          <dd className="text-muted-foreground">
            Nothing has been recorded here yet
            {needCount ? `, apart from ${needCount === 1 ? "1 open need" : `${needCount} open needs`}` : ""}.
            We'd rather say that than invent something.
          </dd>
        </div>
        <div>
          <dt className="font-medium">What isn't known yet</dt>
          <dd className="text-muted-foreground">
            Who's around, what's on, and who could help. That appears only once real people add it.
          </dd>
        </div>
      </dl>
      <ul className="mt-5 grid gap-2 sm:grid-cols-3">
        {actions.map((a, i) => (
          <li key={a.to}>
            <Link
              to={a.to}
              className={`focus-ink flex min-h-11 flex-col rounded-lg border px-4 py-3 text-sm ${i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-card"}`}
            >
              <span className="font-medium">{a.label}</span>
              <span className={i === 0 ? "opacity-90" : "text-muted-foreground"}>{a.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Nothing is published until you choose to post it.
      </p>
      {ancestors.length ? (
        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Or look wider:</span>
          {ancestors.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onStepOut(a.slug)}
              className="focus-ink min-h-11 rounded-full border border-border bg-background px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {a.name}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function DataErrorState({
  retry,
  className = "mt-6",
}: {
  retry?: () => void;
  className?: string;
}) {
  return (
    <div className={`card-paper p-4 text-sm ${className}`} role="alert">
      <p>We couldn't load this right now. Please try again.</p>
      {retry ? (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function DataLoadingState({
  label = "Looking…",
  className = "mt-6",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <p className={`${className} text-sm text-muted-foreground`} role="status">
      {label}
    </p>
  );
}
