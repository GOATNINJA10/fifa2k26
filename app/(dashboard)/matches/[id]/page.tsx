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
    api.getMatch(parseInt(id, 10))
      .then(setMatch)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg">{error || "Match not found"}</p>
        <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const homeName = match.homeTeam?.name || match.homeLabel || "Home";
  const awayName = match.awayTeam?.name || match.awayLabel || "Away";
  const homeScore = match.liveScore?.homeScore ?? match.homeGoals;
  const awayScore = match.liveScore?.awayScore ?? match.awayGoals;
  const played = match.liveScore?.played ?? match.played;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-blue-300 hover:text-white text-sm mb-4 inline-block">
            &larr; Back to Dashboard
          </Link>

          <div className="flex flex-col items-center gap-2 mt-4">
            {match.stage && (
              <span className="text-xs uppercase tracking-widest text-blue-300">{match.stage.replace(/([A-Z])/g, " $1").trim() || match.stage}</span>
            )}
            <div className="flex items-center justify-center gap-6 md:gap-12 w-full">
              <div className="flex flex-col items-center flex-1 text-right">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl mb-2">
                  {homeName.charAt(0)}
                </div>
                <h2 className="text-lg md:text-2xl font-bold">{homeName}</h2>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className="text-5xl md:text-7xl font-extrabold tabular-nums">
                  {played ? `${homeScore} - ${awayScore}` : "vs"}
                </div>
                <div className="text-xs text-blue-300 mt-2">{match.venue || "Venue TBD"}</div>
                {match.date && (
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(match.date)} • {formatTime(match.date)}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center flex-1 text-left">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl mb-2">
                  {awayName.charAt(0)}
                </div>
                <h2 className="text-lg md:text-2xl font-bold">{awayName}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {match.goalTimeline.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-blue-300">Goal Timeline</h3>
            <div className="space-y-2">
              {match.goalTimeline.map((g: GoalTimelineEntry, i: number) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${g.team === "home" ? "bg-blue-900/30 border-l-4 border-blue-500" : "bg-purple-900/30 border-l-4 border-purple-500"}`}>
                  <span className="text-sm font-mono text-gray-400 w-10 text-right">{g.minute}&apos;</span>
                  <span className="text-sm text-gray-300">{g.team === "home" ? homeName : awayName}</span>
                  <span className="font-medium">{g.scorer}</span>
                  {g.ownGoal && <span className="text-xs bg-red-600/30 text-red-300 px-2 py-0.5 rounded-full">OG</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {match.goalTimeline.length === 0 && played && (
          <section className="mb-8 text-center py-8 text-gray-500">
            <p>No goal details available for this match.</p>
          </section>
        )}

        {match.matchNumber && (
          <section className="glass-panel p-4 rounded-lg bg-gray-800/50">
            <h3 className="text-sm text-gray-400 mb-2">Match Info</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-400">Match Number:</span>
              <span>{match.matchNumber}</span>
              {match.stage && <><span className="text-gray-400">Stage:</span><span>{match.stage}</span></>}
              {match.venue && <><span className="text-gray-400">Venue:</span><span>{match.venue}</span></>}
              {match.date && <><span className="text-gray-400">Date:</span><span>{formatDate(match.date)}</span></>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
