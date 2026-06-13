"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Player, StandingsGroup } from "@/lib/api";

export default function StatisticsBoard() {
  const [topScorers, setTopScorers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<StandingsGroup[]>([]);
  const [scorerSource, setScorerSource] = useState<"live" | "local">("local");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function load({ silent = false }: { silent?: boolean } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setLoadError(null);
    }

    try {
      const [scorers, standingsResult] = await Promise.all([api.getTopScorers(), api.getStandings()]);
      setTopScorers(scorers.data);
      setScorerSource(scorers.source);
      setStandings(standingsResult.data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load statistics");
    }
    setLastUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }),
    );
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();

    const intervalId = window.setInterval(() => {
      load({ silent: true });
    }, 43200000);

    return () => window.clearInterval(intervalId);
  }, []);

  const hasStats = topScorers.some((p) => p.goals > 0) || standings.some((g) => g.teams.some((t) => t.played > 0));
  const highestScorer = topScorers[0];

  const totalGoals = useMemo(() => topScorers.reduce((s, p) => s + p.goals, 0), [topScorers]);
  const teamGoals = useMemo(() => {
    const totals = new Map<string, { name: string; flagUrl: string | null; goals: number }>();
    for (const p of topScorers) {
      if (!p.team) continue;
      const key = p.team.name;
      const cur = totals.get(key);
      if (cur) cur.goals += p.goals;
      else totals.set(key, { name: key, flagUrl: p.team.flagUrl ?? null, goals: p.goals });
    }
    return [...totals.values()].sort((a, b) => b.goals - a.goals).slice(0, 5);
  }, [topScorers]);

  if (loadError && topScorers.length === 0) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <p className="text-error font-headline-md">Failed to load statistics</p>
          <p className="text-on-surface-variant text-sm">{loadError}</p>
          <button onClick={() => load()} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md">Retry</button>
        </div>
      </main>
    );
  }

  if (!loading && !hasStats) {
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

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display-lg text-2xl md:text-5xl text-on-surface tracking-tight font-extrabold">
            Tournament <span className="text-primary-container">Analytics</span>
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1 md:mt-2 md:text-body-lg max-w-2xl">
            Live scoring leaders and distribution charts that auto-refresh from the tournament database.
          </p>
        </div>
        <div className="flex flex-row flex-wrap items-center md:flex-col md:items-end gap-1.5 md:gap-2">
          <button onClick={() => load({ silent: true })} className="px-2.5 py-1 md:px-4 md:py-2 bg-surface-container rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-1.5 md:gap-2 shrink-0 text-xs md:text-sm">
            <span className={`material-symbols-outlined text-sm ${refreshing ? "animate-spin" : ""}`}>refresh</span>
            {refreshing ? "Refreshing..." : "Refresh Stats"}
          </button>
          <p className="text-[10px] md:text-xs text-on-surface-variant">
            {lastUpdated ? `Updated ${lastUpdated} IST` : "Auto-refresh every 12h"}
          </p>
          <span className={`text-[10px] md:text-xs font-label-md px-1.5 py-0.5 md:px-2 rounded-full ${scorerSource === "live" ? "bg-green-900/40 text-green-400 border border-green-700" : "bg-yellow-900/40 text-yellow-400 border border-yellow-700"}`}>
            {scorerSource === "live" ? "Live API" : "Local DB"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6">
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-surface-container rounded-xl border border-white/5 p-4 md:p-6 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors duration-500" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>sports_score</span>
                Golden Boot Race
              </h3>
              <div className="flex items-center gap-2 text-primary-container text-sm font-label-md">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary-container animate-pulse" />
                <span>Live</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {loading && <div className="text-sm text-on-surface-variant">Loading scorers...</div>}
              {topScorers.slice(0, 5).map((player, index) => (
                <div key={player.id} className={`flex items-center p-2 md:p-3 rounded-lg transition-colors ${index < 3 ? "bg-surface-container-high/50 border border-outline-variant/20 hover:bg-surface-container-high" : "hover:bg-surface-container-lowest/50"}`}>
                  <span className={`font-tabular-nums text-tabular-nums font-bold w-5 md:w-6 text-xs md:text-base ${index < 3 ? "text-secondary" : "text-on-surface-variant"}`}>{index + 1}</span>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center mr-2 md:mr-4 shrink-0 overflow-hidden">
                    {player.team?.flagUrl ? (
                      <img src={player.team.flagUrl} alt={`${player.team.name} flag`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-body-md md:font-body-md text-on-surface font-semibold truncate">{player.name}</p>
                    <p className="text-[10px] md:text-xs font-label-md text-on-surface-variant uppercase tracking-wider">{player.team?.name || "Unknown team"}</p>
                  </div>
                  {player.goals > 0 ? (
                  <div className="text-right">
                    <p className={`font-tabular-nums font-bold text-sm md:text-xl ${index < 3 ? "text-primary-container" : "text-on-surface"}`}>{player.goals}</p>
                    <p className="text-[10px] md:text-xs font-label-md text-on-surface-variant uppercase">Goals</p>
                  </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="bg-surface-container rounded-xl border border-white/5 p-4 md:p-6 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>leaderboard</span>
                Group Standings
              </h3>
              <div className="flex items-center gap-2 text-primary-container text-sm font-label-md">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary-container animate-pulse" />
                <span>Live</span>
              </div>
            </div>
            <div className="flex flex-col gap-6 overflow-y-auto max-h-[520px] pr-1">
              {standings.length === 0 ? (
                <p className="text-sm text-on-surface-variant col-span-full">No matches played yet.</p>
              ) : standings.map((group) => (
                <div key={group.group}>
                  <p className="font-label-md text-xs text-on-surface-variant/70 uppercase tracking-wider mb-2">Group {group.group}</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-on-surface-variant/60 font-label-md uppercase tracking-wider text-[10px] border-b border-outline-variant/20">
                        <th className="text-left pb-1.5 font-normal w-5">#</th>
                        <th className="text-left pb-1.5 font-normal">Team</th>
                        <th className="text-center pb-1.5 font-normal w-6">P</th>
                        <th className="text-center pb-1.5 font-normal w-6">W</th>
                        <th className="text-center pb-1.5 font-normal w-6">D</th>
                        <th className="text-center pb-1.5 font-normal w-6">L</th>
                        <th className="text-center pb-1.5 font-normal w-8">GF</th>
                        <th className="text-center pb-1.5 font-normal w-8">GA</th>
                        <th className="text-center pb-1.5 font-normal w-8">GD</th>
                        <th className="text-center pb-1.5 font-normal w-8">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.teams.map((team) => (
                        <tr key={team.name} className={`group/row border-b border-outline-variant/5 ${team.position <= 2 ? "bg-emerald-900/5" : ""} hover:bg-surface-container-lowest/50 transition-colors`}>
                          <td className="py-1.5">
                            <span className={`font-tabular-nums font-bold w-5 block text-center text-xs ${team.position <= 2 ? "text-emerald-400" : "text-on-surface-variant/60"}`}>
                              {team.position === 1 ? "①" : team.position === 2 ? "②" : team.position === 3 ? "③" : `④`}
                            </span>
                          </td>
                          <td className="py-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-3.5 rounded-sm overflow-hidden shrink-0 border border-outline-variant/20 bg-surface-container-highest flex items-center justify-center shadow-sm">
                                {team.flagUrl ? (
                                  <img src={team.flagUrl} alt="" className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                              <span className={`font-medium truncate ${team.position <= 2 ? "text-on-surface" : "text-on-surface/80"}`}>{team.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-1.5 font-tabular-nums text-on-surface-variant/80">{team.played}</td>
                          <td className="text-center py-1.5 font-tabular-nums text-on-surface-variant/80">{team.won}</td>
                          <td className="text-center py-1.5 font-tabular-nums text-on-surface-variant/80">{team.drawn}</td>
                          <td className="text-center py-1.5 font-tabular-nums text-on-surface-variant/80">{team.lost}</td>
                          <td className="text-center py-1.5 font-tabular-nums text-on-surface-variant/80">{team.goalsFor}</td>
                          <td className="text-center py-1.5 font-tabular-nums text-on-surface-variant/80">{team.goalsAgainst}</td>
                          <td className={`text-center py-1.5 font-tabular-nums font-semibold tabular-nums ${team.goalDifference > 0 ? "text-emerald-400" : team.goalDifference < 0 ? "text-red-400" : "text-on-surface-variant/80"}`}>
                            {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                          </td>
                          <td className={`text-center py-1.5 font-tabular-nums font-bold text-sm ${team.position <= 2 ? "text-emerald-400" : "text-on-surface"}`}>{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>

        {teamGoals.length > 0 ? (
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container rounded-xl border border-white/5 p-4 md:p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Team Offensive Output</h3>
                <p className="font-label-md text-sm text-on-surface-variant">Teams sorted by total goals scored.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-container rounded-sm" />
                <span className="font-label-md text-xs text-on-surface-variant uppercase">Goals</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {teamGoals.map((t) => {
                const maxGoal = teamGoals[0].goals || 1;
                const pct = Math.max(8, Math.round((t.goals / maxGoal) * 100));
                return (
                  <div key={t.name} className="flex items-center gap-3">
                    <div className="w-6 h-4 rounded-sm overflow-hidden shrink-0 border border-outline-variant/20 bg-surface-container-highest">
                      {t.flagUrl ? <img src={t.flagUrl} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <span className="w-28 md:w-40 text-xs font-medium text-on-surface truncate shrink-0">{t.name}</span>
                    <div className="flex-1 h-5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right font-tabular-nums font-bold text-sm text-on-surface">{t.goals}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        ) : null}

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container rounded-xl border border-white/5 p-4 md:p-6 h-full flex flex-col">
            <h3 className="text-sm md:text-headline-md md:font-headline-md text-on-surface mb-4 md:mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">data_usage</span>
              Control Metrics
            </h3>
            <div className="flex flex-col gap-6 flex-1 justify-center">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Top Scorer</span>
                  <span className="font-tabular-nums text-sm text-primary-container font-bold">{highestScorer ? `${highestScorer.name} (${highestScorer.goals})` : "None"}</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container transition-all" style={{ width: `${Math.min(100, highestScorer?.goals ? highestScorer.goals * 12 : 10)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Goals</span>
                  <span className="font-tabular-nums text-sm text-secondary font-bold">{totalGoals}</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-secondary transition-all" style={{ width: `${Math.min(100, totalGoals * 6)}%` }} />
                </div>
              </div>
              <div className="mt-2 p-4 rounded-lg bg-surface-container/50 border border-outline-variant/30 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-0.5 shrink-0">insights</span>
                  <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                    Group standings auto-refresh from live match data. More groups will appear as games finish.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
