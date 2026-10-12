import { Link } from "@tanstack/react-router";

import type { LocalityQuestion } from "@/lib/locality";

/**
 * The questions a locality answers, in one place. Not tabs, not a dashboard —
 * a short honest index of what is actually here, including the zeros.
 */
export function LocalityQuestions({
  questions,
  placeName,
}: {
  questions: LocalityQuestion[];
  placeName: string;
}) {
  return (
    <section aria-labelledby="locality-questions" className="mt-6">
      <h2 id="locality-questions" className="text-xl">
        {placeName}, as it actually is
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Five questions, answered from what is stored. A nought means nothing is recorded yet.
        {questions.some((q) => q.count === null)
          ? " “Not known” means that count was not checked — it is not a zero."
          : " A nought is not something we are hiding."}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-5">
        {questions.map((q) => {
          const body = (
            <>
              <p className="text-sm leading-snug">{q.question}</p>
              <p className="mt-2 text-2xl leading-none">
                {q.count === null ? <span className="text-base">Not known</span> : q.count}
              </p>
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
