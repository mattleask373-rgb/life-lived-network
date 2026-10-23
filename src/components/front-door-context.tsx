type FrontDoorContextProps = {
  from?: string;
  guidance: string;
};

/**
 * Shows the original front-door phrase after navigation. The phrase is context,
 * not a verified profile fact or an instruction to create anything.
 */
export function FrontDoorContext({ from, guidance }: FrontDoorContextProps) {
  if (!from) return null;

  return (
    <section role="status" aria-label="Your original search" className="card-paper mt-4 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">From your search</p>
      <p className="mt-1 text-sm font-medium">{from}</p>
      <p className="mt-2 text-xs text-muted-foreground">{guidance}</p>
    </section>
  );
}
