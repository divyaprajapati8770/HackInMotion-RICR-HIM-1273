/**
 * Shared shell shown by each route segment's loading.tsx while that
 * segment's RSC payload/JS chunk is being fetched. Next.js renders this
 * automatically on navigation (App Router Suspense boundary per segment),
 * so switching between dashboard routes shows an instant skeleton instead
 * of a blank frame while the destination route loads.
 */
export function RouteSkeleton() {
  return (
    <div className="px-4 py-6 lg:px-8 space-y-5 max-w-[1400px] animate-pulse">
      <div className="h-6 w-40 rounded bg-slate-100" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl2 bg-slate-100" />
        ))}
      </div>
      <div className="h-64 rounded-xl2 bg-slate-100" />
    </div>
  );
}
