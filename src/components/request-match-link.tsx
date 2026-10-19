import { Link } from "@tanstack/react-router";

import { parseNeedSearch } from "@/lib/need-prefill";

interface RequestMatchLinkProps {
  title: string;
  category: string;
  label?: string;
}

/**
 * Starts a user-authored request in the canonical need → findSupply flow.
 * It does not send a message to, or assert contact with, the listed source.
 */
export function RequestMatchLink({
  title,
  category,
  label = "Request a match",
}: RequestMatchLinkProps) {
  const search = parseNeedSearch({
    from: title.trim().slice(0, 200),
    category: category.trim().slice(0, 100),
  });

  return (
    <div className="mt-3">
      <Link
        to="/need"
        search={search}
        className="focus-ink inline-flex min-h-11 items-center rounded-full border border-border px-4 py-2 text-sm underline-offset-4 hover:underline"
      >
        {label}
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">
        Opens the existing local matching flow. This does not message the listed source directly.
      </p>
    </div>
  );
}
