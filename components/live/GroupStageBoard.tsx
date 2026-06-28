"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, StandingsGroup, GroupStandingEntry } from "@/lib/api";

function qualStatus(pos: number): "winner" | "runner-up" | "third" | "eliminated" {
  if (pos === 1) return "winner";
  if (pos === 2) return "runner-up";
  if (pos === 3) return "third";
  return "eliminated";
}

const QUAL_ROW_STYLES: Record<string, string> = {
  winner: "bg-emerald-900/30 border-l-2 border-l-emerald-400",
  "runner-up": "bg-emerald-900/20 border-l-2 border-l-emerald-600",
  third: "bg-amber-900/20 border-l-2 border-l-amber-400",
  eliminated: "bg-surface-container border-l-2 border-l-transparent",
};

const RANK_BADGE: Record<string, { label: string; cls: string }> = {
  winner: { label: "Q", cls: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40" },
  "runner-up": { label: "Q", cls: "bg-emerald-700/20 text-emerald-500 ring-1 ring-emerald-600/40" },
  third: { label: "3rd", cls: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40" },
  eliminated: { label: "", cls: "" },
};

export default function GroupStageBoard() {
  const router = useRouter();
  const [standingsData, setStandingsData] = useState<StandingsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.getStandings();
      setStandingsData(res.data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load standings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGenerateBracket() {
    setGenError(null);
    setGenerating(true);
    try {
      // Fetch groups to get IDs, then map standings positions to team IDs
      const groupsData = await api.getGroups();
      const payload = {
        groups: groupsData.map((group) => {
          const standingGroup = standingsData.find(
            (sg) => sg.group === `Group ${group.name}`,
          );
          const teamsByName = new Map(group.teams.map((t) => [t.name, t.id]));
          const order = standingGroup?.teams ?? [];
          return {
            groupId: group.id,
            pos1: teamsByName.get(order[0]?.name ?? ""),
            pos2: teamsByName.get(order[1]?.name ?? ""),
            pos3: teamsByName.get(order[2]?.name ?? ""),
            pos4: teamsByName.get(order[3]?.name ?? ""),
          };
        }),
        bestThirdGroups: groupsData.map((g) => g.name),
      };
      await api.advanceTournament(payload);
      router.push("/knockout");
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Failed to generate bracket");
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 p-8">
        <div className="text-center text-on-surface-variant">Loading groups...</div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <p className="text-error font-headline-md">Failed to load groups</p>
          <p className="text-on-surface-variant text-sm">{loadError}</p>
          <button onClick={load} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md">
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface mb-1">
            Group Stage Standings
          </h1>
          <p className="font-body-md text-sm md:text-body-md text-on-surface-variant">
            Final standings — top 2 from each group qualify automatically.
          </p>
        </div>
        <button
          onClick={handleGenerateBracket}
          disabled={generating}
          className="bg-primary-container text-on-primary-container px-4 py-2 md:px-6 md:py-3 rounded-lg font-label-md text-xs md:text-label-md hover:bg-primary-fixed transition-colors glow-active disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto"
        >
          {generating ? "Generating…" : "Generate Knockout Bracket"}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/30 ring-1 ring-emerald-500/50" />
          <span>Group winner — qualified</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-700/30 ring-1 ring-emerald-600/40" />
          <span>Runner-up — qualified</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500/20 ring-1 ring-amber-500/40" />
          <span>3rd place — potential best-third</span>
        </div>
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {standingsData.map((sg) => (
          <article
            key={sg.group}
            className="bg-surface-container border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm"
          >
            {/* Group header */}
            <div className="px-4 py-3 md:px-5 md:py-4 border-b border-white/5">
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.35em] text-on-surface-variant mb-0.5">
                {sg.group}
              </p>
              <h2 className="text-sm md:text-base font-semibold text-on-surface">Final Standings</h2>
            </div>

            {/* Standings table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="text-[10px] md:text-xs text-outline uppercase tracking-wider border-b border-white/5">
                    <th className="text-left px-3 py-2 font-medium w-6">#</th>
                    <th className="text-left px-2 py-2 font-medium">Team</th>
                    <th className="text-center px-1.5 py-2 font-medium w-7" title="Played">P</th>
                    <th className="text-center px-1.5 py-2 font-medium w-7" title="Won">W</th>
                    <th className="text-center px-1.5 py-2 font-medium w-7" title="Drawn">D</th>
                    <th className="text-center px-1.5 py-2 font-medium w-7" title="Lost">L</th>
                    <th className="text-center px-1.5 py-2 font-medium w-8" title="Goals For">GF</th>
                    <th className="text-center px-1.5 py-2 font-medium w-8" title="Goals Against">GA</th>
                    <th className="text-center px-1.5 py-2 font-medium w-8" title="Goal Difference">GD</th>
                    <th className="text-center px-3 py-2 font-bold w-9" title="Points">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sg.teams.map((row: GroupStandingEntry) => {
                    const status = qualStatus(row.position);
                    const badge = RANK_BADGE[status];
                    return (
                      <tr key={row.name} className={`transition-colors ${QUAL_ROW_STYLES[status]}`}>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-outline tabular-nums">{row.position}</span>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 md:h-7 md:w-7 shrink-0 overflow-hidden rounded-md bg-surface-variant">
                              {row.flagUrl ? (
                                <img src={row.flagUrl} alt={`${row.name} flag`} className="h-full w-full object-cover" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-on-surface-variant">
                                  {row.name.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="truncate font-medium text-on-surface text-xs md:text-sm">{row.name}</span>
                            {badge.label && (
                              <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-1.5 py-2.5 text-center tabular-nums text-on-surface-variant">{row.played}</td>
                        <td className="px-1.5 py-2.5 text-center tabular-nums text-on-surface-variant">{row.won}</td>
                        <td className="px-1.5 py-2.5 text-center tabular-nums text-on-surface-variant">{row.drawn}</td>
                        <td className="px-1.5 py-2.5 text-center tabular-nums text-on-surface-variant">{row.lost}</td>
                        <td className="px-1.5 py-2.5 text-center tabular-nums text-on-surface-variant">{row.goalsFor}</td>
                        <td className="px-1.5 py-2.5 text-center tabular-nums text-on-surface-variant">{row.goalsAgainst}</td>
                        <td className={`px-1.5 py-2.5 text-center tabular-nums font-medium ${
                          row.goalDifference > 0 ? "text-emerald-400" : row.goalDifference < 0 ? "text-red-400" : "text-on-surface-variant"
                        }`}>
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums font-bold text-on-surface">{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>

      {genError && (
        <p className="mt-6 text-sm text-error text-center">{genError}</p>
      )}
    </main>
  );
}
