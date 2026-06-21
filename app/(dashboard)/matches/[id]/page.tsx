"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, MatchDetail, GoalTimelineEntry } from "@/lib/api";

function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString("en-IN", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatTime(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  }) + " IST";
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const numId = parseInt(id, 10);
    Promise.all([
      api.getMatch(numId),
      api.getWcSchedule().catch(() => ({}) as Record<number, { dateTime: string; orderIndex: number }>),
    ]).then(([m, schedule]) => {
      const s = schedule[numId];
      if (s?.dateTime) m.date = s.dateTime;
      setMatch(m);
    }).catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container" />
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-4xl text-error">error</span>
        <p className="text-error font-headline-md">{error || "Match not found"}</p>
        <Link href="/" className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-label-md hover:scale-105 transition-transform">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const homeName = match.homeTeam?.name || match.homeLabel || "Home";
  const awayName = match.awayTeam?.name || match.awayLabel || "Away";
  const homeScore = match.liveScore?.homeScore ?? match.homeGoals;
  const awayScore = match.liveScore?.awayScore ?? match.awayGoals;
  const played = match.liveScore?.played ?? match.played;

  return (
    <main className="flex-1 p-4 md:p-8">
      <section className="relative w-full rounded-xl overflow-hidden mb-6 border border-outline-variant glass-panel flex flex-col items-center justify-center min-h-56 md:min-h-80 md:mb-8">
        <span className="material-symbols-outlined absolute top-[10%] left-[8%] text-4xl md:text-5xl text-primary-container/55 animate-float-1">sports_soccer</span>
        <span className="material-symbols-outlined absolute bottom-[30%] right-[15%] text-2xl md:text-3xl text-primary-container/40 animate-float-2" style={{ animationDelay: "-3s" }}>sports_soccer</span>
        <span className="material-symbols-outlined absolute top-[60%] left-[60%] text-xl md:text-2xl text-primary-container/35 animate-float-3" style={{ animationDelay: "-5s" }}>sports_soccer</span>
        <Link href="/" className="absolute top-4 left-4 md:top-6 md:left-6 text-primary-container hover:text-primary text-sm font-label-md flex items-center gap-1 z-10">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </Link>
        <div className="flex flex-col items-center gap-2 relative z-10">
            {match.stage && (
              <span className="text-xs uppercase tracking-widest text-outline">{match.stage.replace(/([A-Z])/g, " $1").trim() || match.stage}</span>
            )}
            <div className="flex items-center justify-center gap-4 md:gap-12 w-full max-w-2xl mx-auto">
              <div className="flex flex-col items-center flex-1 text-right">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden mb-1 md:mb-2 border border-outline-variant">
                  {match.homeTeam?.flagUrl ? (
                    <img src={match.homeTeam.flagUrl} alt={homeName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg md:text-2xl text-on-surface font-bold">{homeName.charAt(0)}</span>
                  )}
                </div>
                <h2 className="text-sm md:text-headline-md md:font-headline-md text-on-surface font-semibold">{homeName}</h2>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className="text-5xl md:text-7xl font-extrabold tabular-nums text-secondary">
                  {played ? `${homeScore} - ${awayScore}` : "vs"}
                </div>
                <div className="text-xs text-outline mt-1 md:mt-2">{match.venue || "Venue TBD"}</div>
                {match.date && (
                  <div className="text-[10px] md:text-xs text-outline/60 mt-0.5">
                    {formatDate(match.date)} • {formatTime(match.date)}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center flex-1 text-left">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden mb-1 md:mb-2 border border-outline-variant">
                  {match.awayTeam?.flagUrl ? (
                    <img src={match.awayTeam.flagUrl} alt={awayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg md:text-2xl text-on-surface font-bold">{awayName.charAt(0)}</span>
                  )}
                </div>
                <h2 className="text-sm md:text-headline-md md:font-headline-md text-on-surface font-semibold">{awayName}</h2>
              </div>
            </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        {match.goalTimeline.length > 0 && (
          <section className="glass-panel p-4 md:p-6 rounded-xl border border-outline-variant">
            <h3 className="font-headline-md text-headline-md text-primary-container mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">timeline</span>
              Goal Timeline
            </h3>
            <div className="space-y-2">
              {match.goalTimeline.map((g: GoalTimelineEntry, i: number) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${g.team === "home" ? "bg-primary-container/10 border-l-4 border-primary-container" : "bg-secondary/10 border-l-4 border-secondary"}`}>
                  <span className="text-sm font-mono text-outline w-10 text-right shrink-0">{g.minute}&apos;</span>
                  <span className="text-xs text-outline shrink-0">{g.team === "home" ? homeName : awayName}</span>
                  <span className="text-sm font-medium text-on-surface truncate">{g.scorer}</span>
                  {g.ownGoal && <span className="text-[10px] bg-error/20 text-error px-2 py-0.5 rounded-full shrink-0">OG</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {match.goalTimeline.length === 0 && played && (
          <section className="glass-panel p-6 rounded-xl border border-outline-variant text-center">
            <span className="material-symbols-outlined text-3xl text-outline mb-2">sports_soccer</span>
            <p className="text-on-surface-variant text-sm">No goal details available for this match.</p>
          </section>
        )}

        <section className="glass-panel p-4 md:p-6 rounded-xl border border-outline-variant">
          <h3 className="font-headline-md text-headline-md text-primary-container mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">info</span>
            Match Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {match.matchNumber && (
              <>
                <div className="text-outline">Match Number</div>
                <div className="text-on-surface">{match.matchNumber}</div>
              </>
            )}
            {match.stage && (
              <>
                <div className="text-outline">Stage</div>
                <div className="text-on-surface">{match.stage}</div>
              </>
            )}
            {match.venue && (
              <>
                <div className="text-outline">Venue</div>
                <div className="text-on-surface">{match.venue}</div>
              </>
            )}
            {match.date && (
              <>
                <div className="text-outline">Date</div>
                <div className="text-on-surface">{formatDate(match.date)}</div>
              </>
            )}
            {match.date && (
              <>
                <div className="text-outline">Time</div>
                <div className="text-on-surface">{formatTime(match.date)}</div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
