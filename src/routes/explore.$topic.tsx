import { PlacePicker } from "@/components/place-picker";
import { getExploreTopic } from "@/lib/explore-topics";
import { privatePage, publicPage } from "@/lib/seo";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useWorldContext } from "@/lib/world-context";

export const Route = createFileRoute("/explore/$topic")({
  loader: ({ params }) => {
    const topic = getExploreTopic(params.topic);
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return privatePage({
        path: "",
        title: "Explore a theme — Real World Atlas",
        description: "Choose a supported topic to explore the real world.",
      });
    }
    const { topic } = loaderData;
    return publicPage({
      path: `/explore/${topic.slug}`,
      title: `${topic.label} — Real World Atlas`,
      description: topic.description,
    });
  },
  component: ExploreTopicPage,
});

function ExploreTopicPage() {
  const { topic } = Route.useLoaderData();
  const { place } = useWorldContext();

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Real World Atlas
          </Link>
          <span aria-hidden="true"> / </span>
          <Link to="/explore" className="underline-offset-4 hover:underline">
            Explore
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{topic.label}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Explore by interest
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">{topic.heading}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{topic.introduction}</p>
        </header>

        <section aria-labelledby="topic-place-heading" className="mt-7 max-w-2xl">
          <h2 id="topic-place-heading" className="font-display text-xl">
            Start with a place
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            {place
              ? `Your currently selected place is ${place.name}. You can change it before opening the map.`
              : "Choose a supported place to explore its real records."}
          </p>
          <PlacePicker />
        </section>

        <section
          aria-labelledby="topic-possibilities-heading"
          className="mt-9 card-paper p-5 sm:p-7"
        >
          <h2 id="topic-possibilities-heading" className="font-display text-2xl">
            A good place to start
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {topic.goodFor.map((item) => (
              <li key={item} className="rounded-xl border border-border bg-background p-4 text-sm">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted-foreground">{topic.nextStep}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              search={{ layer: topic.layer }}
              className="focus-ink inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              Open {topic.label.toLowerCase()} on the live map
            </Link>
            <Link
              to="/make"
              className="focus-ink inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm"
            >
              Add a real contribution
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            A category page is a starting point, not evidence of current stock, availability,
            bookings or a person's live location. Check the record's source and freshness.
          </p>
        </section>

        <div className="mt-9 flex flex-wrap gap-4 text-sm">
          <Link to="/explore" className="focus-ink underline underline-offset-4">
            Explore all themes
          </Link>
          <Link to="/journey" className="focus-ink underline underline-offset-4">
            Plan a journey
          </Link>
          <Link to="/road-trip" className="focus-ink underline underline-offset-4">
            Plan a road trip
          </Link>
        </div>
      </div>
    </main>
  );
}
