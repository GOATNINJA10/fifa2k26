import Link from "next/link";

export default function StatisticsNotFound() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-outline">bar_chart</span>
        <p className="text-on-surface font-headline-md">Statistics not found</p>
        <p className="text-on-surface-variant text-body-md">The statistics page is currently unavailable.</p>
        <Link
          href="/"
          className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-label-md hover:brightness-110 transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
