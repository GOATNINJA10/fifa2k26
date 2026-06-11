"use client";

import { useEffect, useState } from "react";
import StatisticsBoard from "@/components/live/StatisticsBoard";

export default function StatisticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-outline">sports_soccer</span>
          <p className="text-on-surface font-headline-md">No top scorers yet</p>
          <p className="text-on-surface-variant text-sm">Leaderboards will populate once the tournament begins.</p>
        </div>
      </main>
    );
  }
  return <StatisticsBoard />;
}
