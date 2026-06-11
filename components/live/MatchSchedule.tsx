"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Match } from "@/lib/api";

const STAGE_LABELS: Record<string, string> = {
  Group: "Group Stage",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3P": "Third Place",
  F: "Final",
};

const STAGE_ORDER = ["Group", "R32", "R16", "QF", "SF", "3P", "F"];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  if (!dateStr.includes("T")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, ${parts[0]}`;
    }
    return dateStr;
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" });
}

function formatTime(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  if (!dateStr.includes("T")) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST";
}

export default function MatchSchedule() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.getMatches();
      setMatches(data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const stage of STAGE_ORDER) {
      const stageMatches = matches
        .filter((m) => m.stage === stage)
        .sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
      if (stageMatches.length > 0) map.set(stage, stageMatches);
    }
    return map;
  }, [matches]);

  if (loading) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="text-center text-on-surface-variant">Loading schedule...</div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <p className="text-error font-headline-md">Failed to load schedule</p>
          <p className="text-on-surface-variant text-sm">{loadError}</p>
          <button onClick={load} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md">Retry</button>
        </div>
      </main>
    );
  }

  if (matches.length === 0) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-outline">calendar_month</span>
          <p className="text-on-surface font-headline-md">No matches scheduled</p>
          <p className="text-on-surface-variant text-sm">Matches will appear here once the tournament data is loaded.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface mb-1">Match Schedule</h1>
        <p className="font-body-md text-sm md:text-body-md text-on-surface-variant">{matches.length} matches across {grouped.size} rounds</p>
      </div>

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([stage, stageMatches]) => (
          <section key={stage}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-headline-sm text-headline-sm text-primary-container">{STAGE_LABELS[stage] || stage}</h2>
              <span className="text-xs text-outline bg-surface-container-high px-2 py-0.5 rounded-full">{stageMatches.length} match{stageMatches.length !== 1 ? "es" : ""}</span>
            </div>
            <div className="grid gap-2">
              {stageMatches.map((match, idx) => {
                const homeName = match.homeTeam?.name ?? match.homeLabel ?? "TBD";
                const awayName = match.awayTeam?.name ?? match.awayLabel ?? "TBD";
                return (
                  <div
                    key={match.id}
                    className={`flex items-center gap-3 md:gap-4 rounded-xl border px-3 py-2.5 md:px-5 md:py-3 transition-colors ${
                      match.played
                        ? "bg-surface-container border-outline-variant"
                        : "bg-surface-container-low border-outline-variant/40"
                    }`}
                  >
                    <span className="text-[10px] md:text-xs text-outline w-5 md:w-7 shrink-0 tabular-nums">{idx + 1}</span>
                    <div className="hidden md:block w-20 shrink-0">
                      <p className="text-[10px] text-outline font-medium">{formatDate(match.date)}</p>
                      <p className="text-[10px] text-outline/60">{formatTime(match.date)}</p>
                    </div>
                    <div className="hidden md:block w-28 shrink-0 truncate">
                      <p className="text-[10px] text-outline truncate">{match.venue || "Venue TBD"}</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-2 md:gap-4 min-w-0">
                      <span className={`text-xs md:text-sm truncate text-right flex-1 ${match.played ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                        {homeName}
                      </span>
                      <span className={`shrink-0 font-bold tabular-nums text-sm md:text-base min-w-[3ch] text-center ${
                        match.played ? "text-secondary" : "text-outline"
                      }`}>
                        {match.played ? `${match.homeGoals} - ${match.awayGoals}` : "vs"}
                      </span>
                      <span className={`text-xs md:text-sm truncate flex-1 ${match.played ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                        {awayName}
                      </span>
                    </div>
                    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
                      match.played
                        ? "bg-primary-container/10 text-primary-container"
                        : "bg-surface-variant text-outline"
                    }`}>
                      {match.played ? "FT" : "UPCOMING"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
