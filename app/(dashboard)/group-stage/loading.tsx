function GroupCardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-3">
        <div className="w-8 h-8 bg-surface-container-high rounded-lg" />
        <div className="h-5 w-20 bg-surface-container-high rounded" />
      </div>
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-5 h-5 bg-surface-container-high rounded" />
            <div className="w-6 h-6 bg-surface-container-high rounded-full" />
            <div className="h-4 flex-1 bg-surface-container-high rounded" />
            <div className="w-8 h-4 bg-surface-container-high rounded" />
            <div className="w-8 h-4 bg-surface-container-high rounded" />
            <div className="w-8 h-4 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-outline-variant/20 flex gap-2">
        <div className="h-9 flex-1 bg-surface-container-high rounded-lg" />
        <div className="h-9 flex-1 bg-surface-container-high rounded-lg" />
      </div>
    </div>
  );
}

export default function GroupStageLoading() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-surface-container-high rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-surface-container-high rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <GroupCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
