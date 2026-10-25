// Placeholder shown while a page's data streams in.
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-48 rounded bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-surface" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-surface" />
    </div>
  );
}
