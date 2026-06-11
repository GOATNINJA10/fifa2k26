function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 animate-pulse">
      <div className="w-6 h-4 bg-surface-container-high rounded" />
      <div className="w-8 h-8 bg-surface-container-high rounded-full" />
      <div className="h-4 flex-1 bg-surface-container-high rounded" />
      <div className="w-6 h-4 bg-surface-container-high rounded" />
      <div className="w-6 h-4 bg-surface-container-high rounded" />
      <div className="w-6 h-4 bg-surface-container-high rounded" />
    </div>
  );
}

function ChartBarSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-6 h-6 bg-surface-container-high rounded-full shrink-0" />
      <div className="h-4 w-24 bg-surface-container-high rounded shrink-0" />
      <div className="flex-1 h-4 bg-surface-container-high rounded" />
      <div className="w-6 h-4 bg-surface-container-high rounded shrink-0" />
    </div>
  );
}

export default function StatisticsLoading() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="h-8 w-52 bg-surface-container-high rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="h-6 w-32 bg-surface-container-high rounded animate-pulse m-4" />
          <div className="border-t border-outline-variant/20">
            <div className="flex items-center gap-3 px-4 py-2 text-xs text-on-surface-variant">
              <div className="w-6" />
              <div className="w-8" />
              <div className="flex-1">Player</div>
              <div className="w-6 text-right">G</div>
              <div className="w-6 text-right">A</div>
              <div className="w-6 text-right">R</div>
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-4">
          <div className="h-6 w-40 bg-surface-container-high rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ChartBarSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
