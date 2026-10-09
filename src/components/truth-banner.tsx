export function TruthBanner({ placeName }: { placeName: string }) {
  return (
    <section
      aria-label="Truth and scope"
      className="card-paper mt-6 p-4 text-sm text-foreground"
    >
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Real, not guessed
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        This page is built from what people have actually said, where they said they would go, and
        what still looks current. We do not invent activity, availability, or local claims.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        If {placeName} is quiet, we say so. That is honest information, not a fake busier feed.
      </p>
    </section>
  );
}
