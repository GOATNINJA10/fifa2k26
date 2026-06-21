"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, Match, Player, Team, GoalScorerEntry } from "@/lib/api";

function scoreText(match: Match) {
  return `${match.homeGoals} - ${match.awayGoals}`;
}

const CONFED_COLORS: Record<string, string> = {
  UEFA: "#3b82f6",
  CONMEBOL: "#22c55e",
  AFC: "#ef4444",
  CAF: "#f59e0b",
  CONCACAF: "#a855f7",
  OFC: "#06b6d4",
};

const COLORS = [
  "#00ff41", "#e9c349", "#4fc3f7", "#ff7043", "#ab47bc",
  "#26a69a", "#ef5350", "#7e57c2", "#66bb6a", "#ffa726",
  "#42a5f5", "#ec407a", "#8d6e63", "#78909c", "#5c6bc0",
  "#ffcc02", "#29b6f6", "#f06292", "#a5d6a7", "#ce93d8",
  "#ffab91", "#80cbc4", "#c5e1a5", "#b39ddb", "#ffe082",
  "#90a4ae", "#ef9a9a", "#81d4fa", "#a1887f", "#b0bec5",
  "#ffcc80", "#c8e6c9",
];

function normalizeName(name: string | null | undefined) {
  if (!name) return "";
  const map: Record<string, string> = {
    "czech republic": "czechia",
    "bosnia and herzegovina": "bosnia-herzegovina",
    "turkiye": "turkey",
    "cape verde islands": "cape verde",
    "curacao": "curacao",
    "korea republic": "south korea",
    "congo dr": "dr congo",
  };
  const n = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "");
  return map[n] || n;
}

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
    return { i, ...d, startAngle, endAngle, lx, ly, color: CONFED_COLORS[d.name] || COLORS[i % COLORS.length], sliceAngle };
  });

  return (
    <div className="flex flex-col items-center gap-4 mt-2">
      <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-56 md:h-56">
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
      <div className="w-full max-w-xs space-y-1 max-h-48 overflow-y-auto pr-1">
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
  const [goalScorers, setGoalScorers] = useState<GoalScorerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [teamData, matchData, scorerData, goalScorerData] = await Promise.all([
        api.getTeams(),
        api.getMatches(),
        api.getTopScorers(),
        api.getGoalScorers(),
      ]);
      setTeams(teamData);
      setMatches(matchData);
      setTopScorers(scorerData.data);
      setGoalScorers(goalScorerData);

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
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const playedMatches = liveSource === "live" ? matches.filter((match) => match.played) : [];
  const inPlayMatches = liveSource === "live" ? matches.filter((match) => match.status === "IN_PLAY" || match.status === "PAUSED" || match.status === "LIVE") : [];
  const totalGoals = playedMatches.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0);

  const [countdown, setCountdown] = useState("");

  const nextMatches = useMemo(() => {
    const upcoming = matches
      .filter((m) => !m.played && m.status !== "IN_PLAY" && m.status !== "PAUSED" && m.status !== "LIVE" && m.date)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
      .slice(0, 5);
    return upcoming.map((m) => ({
      homeName: m.homeLabel || (m.homeTeam?.name ?? ""),
      awayName: m.awayLabel || (m.awayTeam?.name ?? ""),
      venue: m.venue || m.stage || "",
      date: m.date ?? "",
    }));
  }, [matches]);

  useEffect(() => {
    if (nextMatches.length === 0) return;
    const nm = nextMatches[0];
    function tick() {
      const diff = new Date(nm.date).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Starting soon"); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      if (days > 0) setCountdown(`${days}d ${hours}h`);
      else if (hours > 0) setCountdown(`${hours}h ${minutes}m`);
      else setCountdown(`${minutes}m`);
    }
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [nextMatches]);

  const teamNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) {
      const key = normalizeName(t.name);
      if (key) map.set(key, t.name);
    }
    return map;
  }, [teams]);

  function localName(apiName: string | null | undefined) {
    const n = normalizeName(apiName);
    return n ? teamNameMap.get(n) || apiName || "" : "";
  }

  const scorerMap = useMemo(() => {
    const map = new Map<string, GoalScorerEntry>();
    for (const s of goalScorers) {
      const key = `${normalizeName(s.homeTeam)}|${normalizeName(s.awayTeam)}`;
      map.set(key, s);
    }
    return map;
  }, [goalScorers]);

  function parseScorerDisplay(raw: string | null): string {
    if (!raw || raw === "null" || raw === "{}") return "";
    const normalized = raw.replace(/\u201c|\u201d/g, '"');
    const cleaned = normalized.replace(/^{|}$/g, "");
    const parts = cleaned.split('","').map(s => s.replace(/^"|"$/g, "").trim()).filter(Boolean);
    const entries = parts.map(p => {
      const idx = p.search(/\s+\d/);
      if (idx === -1) return null;
      return { name: p.slice(0, idx).trim(), minute: p.slice(idx).trim() };
    }).filter(Boolean) as { name: string; minute: string }[];
    const grouped = new Map<string, string[]>();
    for (const e of entries) {
      const existing = grouped.get(e.name) || [];
      existing.push(e.minute);
      grouped.set(e.name, existing);
    }
    return Array.from(grouped).map(([name, minutes]) => `${name} ${minutes.join(", ")}`).join("; ");
  }

  const confederationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) {
      const key = normalizeName(t.name);
      if (key) map.set(key, t.confederation || "Other");
    }
    return map;
  }, [teams]);

  const goalsByConfederation = useMemo(() => {
    const map = new Map<string, number>();
    for (const match of playedMatches) {
      if (match.stage !== "Group" && match.stage !== "GROUP_STAGE") continue;
      const homeName = normalizeName(match.homeTeam?.name || match.homeLabel);
      const awayName = normalizeName(match.awayTeam?.name || match.awayLabel);
      const homeConf = homeName ? confederationMap.get(homeName) : undefined;
      const awayConf = awayName ? confederationMap.get(awayName) : undefined;
      if (homeConf) map.set(homeConf, (map.get(homeConf) || 0) + match.homeGoals);
      if (awayConf) map.set(awayConf, (map.get(awayConf) || 0) + match.awayGoals);
    }
    return Array.from(map.entries())
      .map(([name, goals]) => ({ name, goals }))
      .sort((a, b) => b.goals - a.goals);
  }, [playedMatches, confederationMap]);

  const recentResults = useMemo(
    () => playedMatches.slice().sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, 5),
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

          <div className="glass-panel p-4 md:p-6 rounded-xl border border-outline-variant hover:bg-surface-variant/50 transition-colors relative overflow-hidden self-start">
            <div className="absolute top-2 left-6 text-lg md:text-xl opacity-[0.06] pointer-events-none select-none animate-float-1">⚽</div>
            <div className="absolute top-8 right-8 text-base md:text-lg opacity-[0.05] pointer-events-none select-none animate-float-2">⚽</div>
            <div className="absolute bottom-8 left-10 text-xl md:text-2xl opacity-[0.06] pointer-events-none select-none animate-float-3">⚽</div>
            <div className="absolute bottom-12 right-12 text-sm md:text-base opacity-[0.04] pointer-events-none select-none animate-float-1" style={{ animationDelay: "2s" }}>⚽</div>
            <div className="absolute top-1/3 left-3 text-base md:text-lg opacity-[0.05] pointer-events-none select-none animate-float-2" style={{ animationDelay: "4s" }}>⚽</div>
            <div className="absolute top-2/3 right-6 text-lg md:text-xl opacity-[0.04] pointer-events-none select-none animate-float-3" style={{ animationDelay: "1s" }}>⚽</div>
            <div className="absolute top-1/2 left-1/2 text-xs md:text-sm opacity-[0.03] pointer-events-none select-none animate-float-1" style={{ animationDelay: "3s" }}>⚽</div>
            <h3 className="text-sm md:text-headline-md md:font-headline-md text-on-surface mb-2">Next Match</h3>
            {nextMatches.length > 0 ? (
              <div className="relative z-10 space-y-1.5">
                <div className="bg-primary/10 p-2 md:p-4 rounded-lg border border-primary/30">
                  <div className="flex justify-between items-center gap-3 md:gap-4">
                    <div className="flex flex-col items-end flex-1 min-w-0">
                      <span className="text-xs md:text-body-md md:font-body-md font-semibold truncate max-w-full text-on-surface">{nextMatches[0].homeName}</span>
                      <span className="text-[10px] md:text-label-md md:font-label-md text-outline">{nextMatches[0].venue}</span>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-sm md:text-headline-md md:font-headline-md text-secondary font-bold tabular-nums whitespace-nowrap">{countdown}</span>
                      <span className="text-[10px] md:text-tabular-nums md:font-tabular-nums text-outline">starts in</span>
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-xs md:text-body-md md:font-body-md font-semibold truncate max-w-full text-on-surface">{nextMatches[0].awayName}</span>
                      <span className="text-[10px] md:text-label-md md:font-label-md text-outline truncate max-w-full">{new Date(nextMatches[0].date).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}</span>
                    </div>
                  </div>
                </div>
                {nextMatches.slice(1).map((m, i) => (
                  <div key={i} className="bg-surface p-1.5 md:p-2 rounded-lg border border-outline-variant/40 hover:border-outline-variant transition-colors">
                    <div className="flex justify-between items-center gap-3 md:gap-4">
                      <div className="flex flex-col items-end flex-1 min-w-0">
                        <span className="text-[10px] md:text-xs font-medium truncate max-w-full text-on-surface">{m.homeName}</span>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <span className="text-[10px] md:text-xs text-secondary font-medium tabular-nums">vs</span>
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-[10px] md:text-xs font-medium truncate max-w-full text-on-surface">{m.awayName}</span>
                      </div>
                    </div>
                    <div className="flex justify-center text-[9px] md:text-[10px] text-outline mt-0.5">
                      {new Date(m.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative z-10">
                <p className="text-xs md:text-label-md md:font-label-md text-outline mb-3 md:mb-4">Ready to build the bracket?</p>
                <Link href="/group-stage" className="inline-block bg-primary-container text-on-primary-container px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-label-md md:font-label-md hover:scale-105 transition-transform">
                  Go to Group Stage
                </Link>
              </div>
            )}
          </div>

          <div className="glass-panel p-4 md:p-6 rounded-xl border border-outline-variant flex flex-col items-center">
            <div className="text-center">
              <h3 className="text-sm md:text-headline-md md:font-headline-md text-on-surface mb-1">Goals by Confederation</h3>
              <p className="text-xs md:text-label-md md:font-label-md text-outline">{goalsByConfederation.length ? `${goalsByConfederation.length} confederations scored` : "No goals yet"}</p>
            </div>
            {goalsByConfederation.length > 0 ? (
              <PieChart data={goalsByConfederation} />
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
            {inPlayMatches.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs md:text-label-md md:font-label-md text-red-400 font-semibold uppercase tracking-wider">Live Now</span>
                </div>
                {inPlayMatches.map((match) => {
                  const homeName = match.homeLabel || localName(match.homeTeam?.name) || match.stage || "";
                  const awayName = match.awayLabel || localName(match.awayTeam?.name) || match.stage || "";
                  const scorerKey = `${normalizeName(homeName)}|${normalizeName(awayName)}`;
                  const scorers = scorerMap.get(scorerKey);
                  return (
                    <Link key={`live-${match.id}`} href={`/matches/${match.id}`} className="block bg-red-900/20 p-2 md:p-4 rounded-lg border border-red-500/40 hover:border-red-500 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col items-end w-[35%] md:w-[40%]">
                          <span className="text-xs md:text-body-md md:font-body-md text-on-surface font-semibold truncate max-w-full">{homeName}</span>
                          <span className="text-[10px] md:text-label-md md:font-label-md text-outline">{match.stage}</span>
                        </div>
                        <div className="flex flex-col items-center px-1 md:px-2 w-[20%] md:w-[20%]">
                          <span className="text-sm md:text-headline-md md:font-headline-md text-secondary whitespace-nowrap">{scoreText(match)}</span>
                          <span className="text-[10px] md:text-tabular-nums md:font-tabular-nums text-red-400 animate-pulse">LIVE</span>
                        </div>
                        <div className="flex flex-col items-start w-[35%] md:w-[40%]">
                          <span className="text-xs md:text-body-md md:font-body-md font-semibold text-primary-container truncate max-w-full">{awayName}</span>
                          <span className="text-[10px] md:text-label-md md:font-label-md text-outline truncate max-w-full">{match.venue || ""}</span>
                        </div>
                      </div>
                      {scorers && (scorers.homeScorers || scorers.awayScorers) && (
                        <div className="flex justify-center gap-4 md:gap-8 mt-1.5 text-[10px] md:text-xs text-red-400/70">
                          <div className="text-right w-[35%] md:w-[40%]">{parseScorerDisplay(scorers.homeScorers)}</div>
                          <div className="w-[20%] md:w-[20%]" />
                          <div className="text-left w-[35%] md:w-[40%]">{parseScorerDisplay(scorers.awayScorers)}</div>
                        </div>
                      )}
                    </Link>
                  );
                })}
                <hr className="border-outline-variant my-2" />
              </>
            )}
            {!loading && recentResults.length === 0 && inPlayMatches.length === 0 && (
              <div className="text-center py-4">
                <p className="text-on-surface-variant text-xs md:text-sm">
                  {liveSource === "live" ? "No matches played yet" : "No live data available"}
                </p>
                <p className="text-on-surface-variant text-[10px] md:text-xs mt-1">{liveSource === "live" ? "Waiting for real match results..." : "Real match results will appear here."}</p>
              </div>
            )}
            {recentResults.map((match) => {
              const homeWon = match.homeGoals > match.awayGoals;
              const awayWon = match.awayGoals > match.homeGoals;
              const homeName = match.homeLabel || localName(match.homeTeam?.name) || match.stage || "";
              const awayName = match.awayLabel || localName(match.awayTeam?.name) || match.stage || "";
              const scorerKey = `${normalizeName(homeName)}|${normalizeName(awayName)}`;
              const scorers = scorerMap.get(scorerKey);
              return (
                <Link key={match.id} href={`/matches/${match.id}`} className="block bg-surface p-2 md:p-4 rounded-lg border border-outline-variant hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col items-end w-[35%] md:w-[40%]">
                      <span className={`text-xs md:text-body-md md:font-body-md font-semibold truncate max-w-full ${homeWon ? "text-green-400" : "text-on-surface"}`}>{homeName}</span>
                      <span className="text-[10px] md:text-label-md md:font-label-md text-outline">{match.stage}</span>
                    </div>
                    <div className="flex flex-col items-center px-1 md:px-2 w-[20%] md:w-[20%]">
                      <span className="text-sm md:text-headline-md md:font-headline-md text-secondary whitespace-nowrap">{scoreText(match)}</span>
                      <span className="text-[10px] md:text-tabular-nums md:font-tabular-nums text-on-surface-variant">FT</span>
                    </div>
                    <div className="flex flex-col items-start w-[35%] md:w-[40%]">
                      <span className={`text-xs md:text-body-md md:font-body-md font-semibold truncate max-w-full ${awayWon ? "text-green-400" : "text-on-surface"}`}>{awayName}</span>
                      <span className="text-[10px] md:text-label-md md:font-label-md text-outline truncate max-w-full">{match.venue || ""}</span>
                    </div>
                  </div>
                  {scorers && (scorers.homeScorers || scorers.awayScorers) && (
                    <div className="flex justify-center gap-4 md:gap-8 mt-1.5 text-[10px] md:text-xs text-outline">
                      <div className="text-right w-[35%] md:w-[40%]">{parseScorerDisplay(scorers.homeScorers)}</div>
                      <div className="w-[20%] md:w-[20%]" />
                      <div className="text-left w-[35%] md:w-[40%]">{parseScorerDisplay(scorers.awayScorers)}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
