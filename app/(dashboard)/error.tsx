"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <span className="material-symbols-outlined text-4xl text-error">error</span>
        <p className="text-error font-headline-md">Something went wrong</p>
        <p className="text-on-surface-variant text-sm max-w-md">{error.message}</p>
        <button
          onClick={reset}
          className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
