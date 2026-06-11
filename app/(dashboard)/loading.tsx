function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/20 p-6 md:p-8 animate-pulse">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-surface-container-high rounded-full" />
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="h-6 w-64 bg-surface-container-high rounded mx-auto md:mx-0" />
          <div className="h-4 w-48 bg-surface-container-high rounded mx-auto md:mx-0" />
          <div className="flex items-center gap-4 justify-center md:justify-start mt-2">
            <div className="h-3 w-20 bg-surface-container-high rounded" />
            <div className="h-3 w-20 bg-surface-container-high rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
        <div className="h-5 w-28 bg-surface-container-high rounded" />
      </div>
      <div className="h-4 w-full bg-surface-container-high rounded mb-2" />
      <div className="h-4 w-3/4 bg-surface-container-high rounded" />
    </div>
  );
}

function ResultRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 animate-pulse">
      <div className="flex-1 flex items-center gap-2">
        <div className="w-5 h-5 bg-surface-container-high rounded-full" />
        <div className="h-4 w-20 bg-surface-container-high rounded" />
      </div>
      <div className="h-5 w-12 bg-surface-container-high rounded text-center" />
      <div className="flex-1 flex items-center gap-2 justify-end">
        <div className="h-4 w-20 bg-surface-container-high rounded" />
        <div className="w-5 h-5 bg-surface-container-high rounded-full" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <main className="flex-1 p-4 md:p-8 space-y-6">
      <HeroSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StepCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-low rounded-2xl border border-outline-variant/20 p-4 animate-pulse">
          <div className="h-5 w-36 bg-surface-container-high rounded mb-4" />
          <div className="h-48 bg-surface-container-high rounded-xl" />
        </div>
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-4">
          <div className="h-5 w-28 bg-surface-container-high rounded animate-pulse mb-3" />
          <div className="divide-y divide-outline-variant/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <ResultRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
