import { Button } from "@/components/ui/button";

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
