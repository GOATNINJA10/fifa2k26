export default function ScheduleLoading() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="h-8 w-48 bg-surface-container-high rounded-lg animate-pulse mb-6" />
      <div className="space-y-6">
        {[1, 2, 3].map((round) => (
          <div key={round}>
            <div className="h-5 w-36 bg-surface-container-high rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((m) => (
                <div key={m} className="flex items-center gap-4 rounded-xl border border-outline-variant/20 px-5 py-3 animate-pulse">
                  <div className="w-5 h-4 bg-surface-container-high rounded" />
                  <div className="flex-1 flex items-center justify-center gap-4">
                    <div className="h-4 w-24 bg-surface-container-high rounded" />
                    <div className="h-5 w-10 bg-surface-container-high rounded" />
                    <div className="h-4 w-24 bg-surface-container-high rounded" />
                  </div>
                  <div className="w-16 h-5 bg-surface-container-high rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
