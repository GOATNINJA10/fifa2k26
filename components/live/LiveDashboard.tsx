"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, Match, Player, Team } from "@/lib/api";

function scoreText(match: Match) {
  return `${match.homeGoals} - ${match.awayGoals}`;
}

const COLORS = [
  "#00ff41", "#e9c349", "#4fc3f7", "#ff7043", "#ab47bc",
  "#26a69a", "#ef5350", "#7e57c2", "#66bb6a", "#ffa726",
  "#42a5f5", "#ec407a", "#8d6e63", "#78909c", "#5c6bc0",
  "#ffcc02", "#29b6f6", "#f06292", "#a5d6a7", "#ce93d8",
  "#ffab91", "#80cbc4", "#c5e1a5", "#b39ddb", "#ffe082",
  "#90a4ae", "#ef9a9a", "#81d4fa", "#a1887f", "#b0bec5",
  "#ffcc80", "#c8e6c9",
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

function PieChart({ data }: { data: { name: string; goals: number }[] }) {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((sum, d) => sum + d.goals, 0);
  const cx = 100;
  const cy = 100;
  const r = 80;
  let currentAngle = 0;

  const segments = data.map((d, i) => {
    const sliceAngle = (d.goals / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;
    const midAngle = startAngle + sliceAngle / 2;
    const midRad = (midAngle - 90) * (Math.PI / 180);
    const labelR = r * 0.65;
    const lx = cx + labelR * Math.cos(midRad);
    const ly = cy + labelR * Math.sin(midRad);
    return { i, ...d, startAngle, endAngle, lx, ly, color: COLORS[i % COLORS.length], sliceAngle };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-3 mt-2">
      <svg viewBox="0 0 200 200" className="w-32 h-32 md:w-40 md:h-40 shrink-0">
        {segments.map((seg) => {
          const scale = hovered === seg.i ? 1.05 : 1;
          const tx = cx * (1 - scale);
          const ty = cy * (1 - scale);
          return (
            <g
              key={seg.i}
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                transformOrigin: `${cx}px ${cy}px`,
                transition: "transform 0.3s ease",
                opacity: animated ? 1 : 0,
                transitionDelay: `${seg.i * 60}ms`,
              }}
              onMouseEnter={() => setHovered(seg.i)}
              onMouseLeave={() => setHovered(null)}
            >
              <path
                d={describeArc(cx, cy, r, seg.startAngle, seg.endAngle)}
                fill={seg.color}
                stroke="#111316"
                strokeWidth="1.5"
                style={{ transition: "opacity 0.3s", opacity: hovered === null || hovered === seg.i ? 1 : 0.4 }}
              />
              {seg.sliceAngle > 15 && (
                <text
                  x={seg.lx}
                  y={seg.ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#111316"
                  fontSize="8"
                  fontWeight="700"
                  style={{ pointerEvents: "none" }}
                >
                  {seg.goals}
                </text>
              )}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={r * 0.45} fill="#1e2023" />
      </svg>
      <div className="flex-1 w-full space-y-1 max-h-32 overflow-y-auto pr-1">
        {segments.map((seg) => (
          <div
            key={seg.i}
            className="flex items-center gap-1.5 text-[10px] md:text-xs py-0.5 cursor-pointer"
            onMouseEnter={() => setHovered(seg.i)}
            onMouseLeave={() => setHovered(null)}
            style={{ opacity: hovered === null || hovered === seg.i ? 1 : 0.4, transition: "opacity 0.3s" }}
          >
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-on-surface truncate flex-1 min-w-0">{seg.name}</span>
            <span className="text-secondary font-bold shrink-0">{seg.goals}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveSource, setLiveSource] = useState<"live" | "local">("local");
  const [topScorers, setTopScorers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [teamData, matchData, scorerData] = await Promise.all([
        api.getTeams(),
        api.getMatches(),
        api.getTopScorers(),
      ]);
      setTeams(teamData);
      setMatches(matchData);
      setTopScorers(scorerData.data);

      const live = await api.getLiveMatches();
      if (live.source === "live" && live.matches.length > 0) {
        setMatches(live.matches as Match[]);
        setLiveSource("live");
      }
    } catch {
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const playedMatches = matches.filter((match) => match.played);
  const totalGoals = playedMatches.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0);

  const goalsByCountry = useMemo(() => {
    const map = new Map<string, number>();
    for (const match of playedMatches) {
      if (match.stage !== "Group") continue;
      const homeName = match.homeTeam?.name || match.homeLabel || "";
      const awayName = match.awayTeam?.name || match.awayLabel || "";
      if (homeName) map.set(homeName, (map.get(homeName) || 0) + match.homeGoals);
      if (awayName) map.set(awayName, (map.get(awayName) || 0) + match.awayGoals);
    }
    return Array.from(map.entries())
      .map(([name, goals]) => ({ name, goals }))
      .sort((a, b) => b.goals - a.goals);
  }, [playedMatches]);

  const recentResults = useMemo(
    () => playedMatches.slice().sort((a, b) => (b.matchNumber ?? b.id) - (a.matchNumber ?? a.id)).slice(0, 5),
    [playedMatches]
  );

  if (error) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <p className="text-error font-headline-md text-sm md:text-base">Loading...</p>
          <p className="text-on-surface-variant text-xs md:text-sm">Could not connect to server. Retrying...</p>
          <button onClick={load} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md">Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 overflow-y-auto md:p-8">
      <section className="relative w-full rounded-xl overflow-hidden mb-6 border border-outline-variant glass-panel flex items-end p-4 md:min-h-80 md:mb-8 md:p-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-br from-surface-container via-background to-surface-container-lowest" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary-container" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-primary-container" />
            <div className="absolute inset-y-0 left-0 w-[15%] border-r border-primary-container" />
            <div className="absolute inset-y-0 right-0 w-[15%] border-l border-primary-container" />
          </div>
          <span className="material-symbols-outlined absolute top-[10%] left-[8%] text-4xl md:text-5xl text-primary-container/55 animate-float-1">sports_soccer</span>
          <span className="material-symbols-outlined absolute bottom-[15%] right-[12%] text-3xl md:text-4xl text-primary/45 animate-float-2">sports_soccer</span>
          <span className="material-symbols-outlined absolute top-[35%] right-[25%] text-2xl md:text-3xl text-secondary/40 animate-float-3">sports_soccer</span>
          <span className="material-symbols-outlined absolute bottom-[30%] left-[20%] text-xl md:text-2xl text-primary-container/45 animate-float-2" style={{ animationDelay: "-3s" }}>sports_soccer</span>
          <span className="material-symbols-outlined absolute top-[60%] left-[60%] text-2xl md:text-3xl text-white/30 animate-float-1" style={{ animationDelay: "-5s" }}>sports_soccer</span>
          <span className="hidden md:inline material-symbols-outlined absolute top-[5%] right-[35%] text-2xl text-primary/35 animate-float-2" style={{ animationDelay: "-7s" }}>sports_soccer</span>
          <span className="hidden md:inline material-symbols-outlined absolute bottom-[10%] left-[35%] text-xl text-secondary/35 animate-float-1" style={{ animationDelay: "-2s" }}>sports_soccer</span>
          <span className="hidden md:inline material-symbols-outlined absolute top-[50%] left-[3%] text-3xl text-primary-container/40 animate-float-3" style={{ animationDelay: "-4s" }}>sports_soccer</span>
          <span className="hidden md:inline material-symbols-outlined absolute bottom-[40%] right-[5%] text-2xl text-white/25 animate-float-2" style={{ animationDelay: "-6s" }}>sports_soccer</span>
          <span className="hidden md:inline material-symbols-outlined absolute top-[20%] left-0 text-2xl text-primary-container/60 animate-kick" style={{ animationDelay: "0s" }}>sports_soccer</span>
          <span className="hidden md:inline material-symbols-outlined absolute top-[55%] left-0 text-xl text-secondary/50 animate-kick" style={{ animationDelay: "-4s", animationDuration: "11s" }}>sports_soccer</span>
          <span className="hidden md:inline material-symbols-outlined absolute top-[75%] left-0 text-3xl text-primary/40 animate-kick" style={{ animationDelay: "-8s", animationDuration: "8s" }}>sports_soccer</span>
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-display-lg md:font-display-lg text-primary-container tracking-tighter mb-2 leading-none">
              FIFA WORLD CUP<br />2026 SIMULATOR
            </h1>
            <p className="text-sm md:text-headline-md md:font-headline-md text-secondary">
              {loading ? "Loading live tournament data..." : `${playedMatches.length} matches played • ${teams.length} teams loaded`}
            </p>
          </div>
          <div className="flex gap-2 md:gap-4 w-full md:w-auto overflow-x-auto pb-1">
            <div className="shrink-0 glass-panel px-3 py-2 md:px-6 md:py-4 rounded-lg flex flex-col items-center border-t-2 border-t-primary-container min-w-0">
              <span className="text-[10px] md:text-label-md md:font-label-md text-outline">Step 1</span>
              <span className="text-sm md:text-headline-md md:font-headline-md text-on-surface whitespace-nowrap">Set Groups</span>
            </div>
            <div className="shrink-0 glass-panel px-3 py-2 md:px-6 md:py-4 rounded-lg flex flex-col items-center border-t-2 border-t-secondary min-w-0">
              <span className="text-[10px] md:text-label-md md:font-label-md text-outline">Step 2</span>
              <span className="text-sm md:text-headline-md md:font-headline-md text-on-surface whitespace-nowrap">Build Bracket</span>
            </div>
            <div className="shrink-0 glass-panel px-3 py-2 md:px-6 md:py-4 rounded-lg flex flex-col items-center border-t-2 border-t-primary min-w-0">
              <span className="text-[10px] md:text-label-md md:font-label-md text-outline">Step 3</span>
              <span className="text-sm md:text-headline-md md:font-headline-md text-on-surface whitespace-nowrap">Claim Victory</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 glass-panel p-4 md:p-6 rounded-xl border border-primary/30 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-primary/10 to-transparent pointer-events-none" />
            <div className="flex flex-col relative z-10 gap-3 md:gap-4">
              <div>
                <h2 className="text-base md:text-headline-lg md:font-headline-lg text-primary-container mb-1">How to Build Your Bracket</h2>
                <p className="text-sm md:text-body-md md:font-body-md text-on-surface-variant">1. Go to <strong>Group Stage</strong> and set team positions for each group &mdash; 2. Click <strong>Lock &amp; Generate Bracket</strong> &mdash; 3. Move to <strong>Knockout</strong> and click teams to advance them &mdash; 4. Proceed through all rounds to crown your champion</p>
              </div>
              <div className="text-xs md:text-sm text-on-surface-variant">
                <p><strong>No random simulations</strong> — you control every team placement and match result.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 md:p-6 rounded-xl border border-outline-variant hover:bg-surface-variant/50 transition-colors flex flex-col justify-between">
            <div>
              <h3 className="text-sm md:text-headline-md md:font-headline-md text-on-surface mb-1">Start Here</h3>
              <p className="text-xs md:text-label-md md:font-label-md text-outline">Ready to build the bracket?</p>
            </div>
            <div className="mt-3 md:mt-4">
              <Link href="/group-stage" className="inline-block bg-primary-container text-on-primary-container px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-label-md md:font-label-md hover:scale-105 transition-transform">
                Go to Group Stage
              </Link>
            </div>
          </div>

          <div className="glass-panel p-4 md:p-6 rounded-xl border border-outline-variant flex flex-col">
            <div>
              <h3 className="text-sm md:text-headline-md md:font-headline-md text-on-surface mb-1">Goals by Country</h3>
              <p className="text-xs md:text-label-md md:font-label-md text-outline">{goalsByCountry.length ? `${goalsByCountry.length} countries scored` : "No goals yet"}</p>
            </div>
            {goalsByCountry.length > 0 ? (
              <PieChart data={goalsByCountry} />
            ) : !loading && (
              <div className="text-center py-8">
                <p className="text-on-surface-variant text-[10px] md:text-xs">No group stage goals scored yet</p>
              </div>
            )}
          </div>
        </div>

        <aside className="glass-panel rounded-xl p-4 md:p-6 border border-outline-variant flex flex-col">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-sm md:text-headline-md md:font-headline-md text-on-surface">Recent Results</h3>
            <span className="text-xs md:text-label-md md:font-label-md text-primary-container flex items-center gap-1">
              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${liveSource === "live" ? "bg-green-400 animate-pulse" : "bg-yellow-500"}`} />
              {liveSource === "live" ? "Live" : "Local"}
            </span>
          </div>
          <div className="flex flex-col gap-2 md:gap-3 overflow-y-auto pr-1">
            {recentResults.length === 0 && !loading && (
              <div className="text-center py-4">
                <p className="text-on-surface-variant text-xs md:text-sm">World Cup starts June 12, 2026</p>
                <p className="text-on-surface-variant text-[10px] md:text-xs mt-1">Matches will appear here once the tournament begins.</p>
              </div>
            )}
            {recentResults.map((match) => (
              <div key={match.id} className="bg-surface p-2 md:p-4 rounded-lg border border-outline-variant flex justify-between items-center hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-end w-[35%] md:w-[40%]">
                  <span className="text-xs md:text-body-md md:font-body-md text-on-surface font-semibold truncate max-w-full">{match.homeLabel || match.homeTeam?.name || "TBD"}</span>
                  <span className="text-[10px] md:text-label-md md:font-label-md text-outline">{match.stage}</span>
                </div>
                <div className="flex flex-col items-center px-1 md:px-2 w-[20%] md:w-[20%]">
                  <span className="text-sm md:text-headline-md md:font-headline-md text-secondary whitespace-nowrap">{scoreText(match)}</span>
                  <span className="text-[10px] md:text-tabular-nums md:font-tabular-nums text-on-surface-variant">FT</span>
                </div>
                <div className="flex flex-col items-start w-[35%] md:w-[40%]">
                  <span className="text-xs md:text-body-md md:font-body-md font-semibold text-primary-container truncate max-w-full">{match.awayLabel || match.awayTeam?.name || "TBD"}</span>
                  <span className="text-[10px] md:text-label-md md:font-label-md text-outline truncate max-w-full">{match.venue || "Venue TBD"}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
