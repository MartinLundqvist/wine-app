export function LoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center p-6 text-muted-foreground font-sans"
      role="status"
      aria-label="Loading"
    >
      <span className="animate-pulse">Loading…</span>
    </div>
  );
}
