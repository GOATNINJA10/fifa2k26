import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
        <p className="text-on-surface font-headline-md">Page not found</p>
        <p className="text-on-surface-variant text-sm">The page you are looking for does not exist.</p>
        <Link href="/" className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
