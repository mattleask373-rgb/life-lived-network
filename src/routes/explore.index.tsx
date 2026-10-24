import { publicPage } from "@/lib/seo";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PlacePicker } from "@/components/place-picker";
import { EXPLORE_TOPICS } from "@/lib/explore-topics";

const title = "Explore the real world — Real World Atlas";
const description =
  "Explore work, experiences, music, artists, community, people, nature and food through one locality-aware living map.";

export const Route = createFileRoute("/explore/")({
  head: () => publicPage({ path: "/explore", title, description }),
  component: ExploreHub,
});

function ExploreHub() {
  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Real World Atlas
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Explore</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            A map of possibilities
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">
            Explore the <span className="italic text-primary">real world.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose a theme, choose a place, and discover what people have actually recorded there.
            The map stays the source of truth; these pages help you start with what matters to you.
          </p>
        </header>

        <section aria-labelledby="explore-place-heading" className="mt-7 max-w-2xl">
          <h2 id="explore-place-heading" className="sr-only">
            Choose a place
          </h2>
          <PlacePicker />
        </section>

        <section aria-labelledby="explore-topics-heading" className="mt-10">
          <div className="max-w-2xl">
            <h2 id="explore-topics-heading" className="font-display text-2xl sm:text-3xl">
              What would you like to find?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Each theme opens the same live map with its corresponding layer selected. We do not
              invent listings or imply that a category is available in every locality.
            </p>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPLORE_TOPICS.map((topic) => (
              <li key={topic.slug}>
                <Link
                  to="/explore/$topic"
                  params={{ topic: topic.slug }}
                  className="focus-ink card-paper flex h-full min-h-44 flex-col p-5 transition-colors hover:border-primary/40"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                    {topic.label}
                  </span>
                  <span className="mt-3 font-display text-xl leading-snug">{topic.heading}</span>
                  <span className="mt-2 text-sm text-muted-foreground">{topic.description}</span>
                  <span className="mt-auto pt-4 text-sm font-medium underline underline-offset-4">
                    Explore this theme
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="explore-actions-heading"
          className="mt-12 border-t border-border pt-8"
        >
          <h2 id="explore-actions-heading" className="font-display text-2xl sm:text-3xl">
            Make something happen
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Explore is the front door, not a second discovery engine. These existing journeys take
            you from curiosity to a real action.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              title="Offer something"
              body="Share work, an experience, an event, a project or a local service."
              to="/make"
            />
            <ActionCard
              title="Give an hour"
              body="Offer a practical skill or ask to learn something from someone."
              to="/give"
            />
            <ActionCard
              title="Build a journey"
              body="Shape a route around time, interests and real recorded possibilities."
              to="/journey"
            />
            <ActionCard
              title="Plan a road trip"
              body="Look for recorded discoveries along a route and verify details before travelling."
              to="/road-trip"
            />
          </div>
        </section>

        <p className="mt-10 max-w-3xl border-l-2 border-border pl-4 text-sm text-muted-foreground">
          A quiet place is a valid result. If nothing is recorded, we will say so and offer a way to
          contribute rather than fabricate local activity or publish a thin location page.
        </p>
      </div>
    </main>
  );
}

function ActionCard({
  title,
  body,
  to,
}: {
  title: string;
  body: string;
  to: "/make" | "/give" | "/journey" | "/road-trip";
}) {
  return (
    <Link
      to={to}
      className="focus-ink card-paper flex min-h-36 flex-col p-4 transition-colors hover:border-primary/40"
    >
      <span className="font-medium">{title}</span>
      <span className="mt-2 text-sm text-muted-foreground">{body}</span>
      <span className="mt-auto pt-4 text-sm underline underline-offset-4">Open</span>
    </Link>
  );
}
