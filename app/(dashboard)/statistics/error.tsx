"use client";

export default function StatisticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="text-error font-headline-md">Failed to load statistics</p>
        <p className="text-on-surface-variant text-body-md max-w-md">{error.message}</p>
        <button
          onClick={reset}
          className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-label-md hover:brightness-110 transition-all"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
