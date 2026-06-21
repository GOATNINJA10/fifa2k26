"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, TournamentStats } from "@/lib/api";

export default function TournamentStatsBoard() {
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTournamentStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-outline-variant">
        <h2 className="text-lg font-bold text-primary-container mb-4">Tournament Stats</h2>
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.totalMatches === 0) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-outline-variant">
        <h2 className="text-lg font-bold text-primary-container mb-2">Tournament Stats</h2>
        <p className="text-sm text-gray-400">Stats will appear once matches are played.</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Matches Played",
      value: stats.totalMatches,
      icon: "sports_soccer",
      color: "text-blue-400",
    },
    {
      label: "Total Goals",
      value: stats.totalGoals,
      icon: "scoreboard",
      color: "text-green-400",
    },
    {
      label: "Avg Goals/Match",
      value: stats.avgGoals,
      icon: "show_chart",
      color: "text-yellow-400",
    },
    {
      label: "Biggest Win",
      value: `${stats.biggestWin.homeScore}-${stats.biggestWin.awayScore}`,
      subtitle: `${stats.biggestWin.home} vs ${stats.biggestWin.away}`,
      icon: "star",
      color: "text-purple-400",
    },
    {
      label: "Most Goals in a Match",
      value: stats.mostGoalsMatch.total,
      subtitle: `${stats.mostGoalsMatch.home} ${stats.mostGoalsMatch.homeScore}-${stats.mostGoalsMatch.awayScore} ${stats.mostGoalsMatch.away}`,
      icon: "whatshot",
      color: "text-red-400",
    },
    {
      label: "Top Scoring Team",
      value: stats.topScoringTeam?.name || "N/A",
      subtitle: `${stats.topScoringTeam?.goalsFor || 0} goals`,
      icon: "emoji_events",
      color: "text-orange-400",
    },
    {
      label: "Most Clean Sheets",
      value: stats.mostCleanSheets?.name || "N/A",
      subtitle: `${stats.mostCleanSheets?.cleanSheets || 0} clean sheets`,
      icon: "security",
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="glass-panel p-6 rounded-xl border border-outline-variant">
      <h2 className="text-lg font-bold text-primary-container mb-4">Tournament Stats</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Link
            key={i}
            href="/schedule"
            className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-lg ${card.color}`}>{card.icon}</span>
              <span className="text-xs text-gray-400">{card.label}</span>
            </div>
            <div className={`text-xl md:text-2xl font-bold ${card.color}`}>{card.value}</div>
            {card.subtitle && (
              <div className="text-xs text-gray-500 mt-1 truncate">{card.subtitle}</div>
            )}
          </Link>
        ))}
      </div>

    </div>
  );
}
