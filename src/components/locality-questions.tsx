import { Link } from "@tanstack/react-router";

import type { LocalityQuestion } from "@/lib/locality";

/**
 * The questions a locality answers, in one place. Not tabs, not a dashboard —
 * a short honest index of what is actually here, including the zeros.
 */
export function LocalityQuestions({
  questions,
  placeName,
  needsStatus = "ready",
  onRetryNeeds,
}: {
  questions: LocalityQuestion[];
  placeName: string;
  needsStatus?: "loading" | "error" | "ready";
  onRetryNeeds?: () => void;
}) {
  return (
    <section aria-labelledby="locality-questions" className="mt-6">
      <h2 id="locality-questions" className="text-xl">
        {placeName}, as it actually is
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Five questions, answered from what is stored. A zero means a successful check found no
        records; unverified counts are labelled rather than guessed.
      </p>
      {needsStatus === "loading" ? (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          Checking the open-needs count…
        </p>
      ) : needsStatus === "error" ? (
        <div role="alert" className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>We couldn't verify the open-needs count just now.</span>
          {onRetryNeeds ? (
            <button type="button" onClick={onRetryNeeds} className="focus-ink min-h-11 underline">
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
      <ul className="mt-3 grid gap-2 sm:grid-cols-5">
        {questions.map((q) => {
          const body = (
            <>
              <p className="text-sm leading-snug">{q.question}</p>
              <p className="mt-2 text-2xl leading-none">{q.count === null ? "Not confirmed" : q.count}</p>
              <p className="mt-1 text-xs text-muted-foreground">{q.unit}</p>
            </>
          );
          return (
            <li key={q.id}>
              {q.href.startsWith("#") ? (
                <a
                  href={q.href}
                  className="card-paper focus-ink block h-full p-3 transition-shadow hover:shadow-lift"
                >
                  {body}
                </a>
              ) : (
                <Link
                  to={q.href}
                  className="card-paper focus-ink block h-full p-3 transition-shadow hover:shadow-lift"
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
