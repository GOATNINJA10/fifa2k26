function MatchCardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-3 min-w-[180px] animate-pulse">
      <div className="h-3 w-16 bg-surface-container-high rounded mb-3 mx-auto" />
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="h-4 w-16 bg-surface-container-high rounded" />
        <div className="h-6 w-6 bg-surface-container-high rounded" />
        <div className="h-4 w-16 bg-surface-container-high rounded" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 w-16 bg-surface-container-high rounded" />
        <div className="h-6 w-6 bg-surface-container-high rounded" />
        <div className="h-4 w-16 bg-surface-container-high rounded" />
      </div>
    </div>
  );
}

function BracketRoundSkeleton({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="h-5 w-24 bg-surface-container-high rounded animate-pulse" />
      <div className="flex flex-col gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <MatchCardSkeleton />
            <div className="w-0.5 h-6 bg-outline/30 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KnockoutLoading() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-56 bg-surface-container-high rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-surface-container-high rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-surface-container-high rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-8 min-w-[900px] px-4">
          <BracketRoundSkeleton label="Round of 32" count={8} />
          <BracketRoundSkeleton label="Round of 16" count={4} />
          <BracketRoundSkeleton label="Quarter-finals" count={2} />
          <BracketRoundSkeleton label="Semi-finals" count={1} />
          <BracketRoundSkeleton label="Final" count={1} />
        </div>
      </div>
    </main>
  );
}
