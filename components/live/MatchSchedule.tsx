"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, Match, GoalScorerEntry, BracketResponse, StandingsGroup } from "@/lib/api";

// A unified fixture type that covers both real Match rows and bracket-only fixtures
type KnockoutFixture = {
  matchNumber?: number | null;
  stage: string;
  date?: string | null;
  venue?: string | null;
  homeLabel?: string | null;
  awayLabel?: string | null;
  // real match fields (optional)
  id?: number;
  homeGoals?: number;
  awayGoals?: number;
  played?: boolean;
  status?: string;
};

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

function formatDate(dateStr: string | null | undefined, wcDate?: string) {
  const s = wcDate || dateStr;
  if (!s) return "";
  if (!s.includes("T")) {
    const parts = s.split("-");
    if (parts.length === 3) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, ${parts[0]}`;
    }
    return s;
  }
  const d = new Date(s);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" });
}

function formatTime(dateStr: string | null | undefined, wcDate?: string) {
  const s = wcDate || dateStr;
  if (!s) return "";
  if (!s.includes("T")) return "";
  const d = new Date(s);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST";
}

export default function MatchSchedule() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [standingsData, setStandingsData] = useState<StandingsGroup[]>([]);
  const [liveMap, setLiveMap] = useState<Map<string, Partial<Match>>>(new Map());
  const [wcSchedule, setWcSchedule] = useState<Record<number, { dateTime: string; orderIndex: number }>>({});
  const [goalScorers, setGoalScorers] = useState<GoalScorerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveSource, setLiveSource] = useState<"live" | "local">("local");

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

async function load() {
  setLoading(true);
  setLoadError(null);
  try {
    const [data, live, schedule, scorers, bracketData, standingsRes] = await Promise.all([
      api.getMatches(),
      api.getLiveMatches().catch(() => null),
      api.getWcSchedule().catch(() => ({})),
      api.getGoalScorers().catch(() => []),
      api.getBracket().catch(() => null),
      api.getStandings().catch(() => null),
    ]);
    setMatches(data);
    setWcSchedule(schedule);
    setGoalScorers(scorers);
    setBracket(bracketData);
    if (standingsRes) setStandingsData(standingsRes.data);
    if (live && live.source === "live" && live.matches.length > 0) {
      const map = new Map<string, Partial<Match>>();
      for (const m of live.matches) {
        const home = typeof m.homeTeam === "object" && m.homeTeam ? normalizeName(m.homeTeam.name) : "";
        const away = typeof m.awayTeam === "object" && m.awayTeam ? normalizeName(m.awayTeam.name) : "";
        if (home && away) map.set(`${home}|${away}`, m);
      }
      setLiveMap(map);
      setLiveSource("live");
    }
  } catch (err: unknown) {
    setLoadError(err instanceof Error ? err.message : "Failed to load matches");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  load();
  const interval = setInterval(load, 60000);
  return () => clearInterval(interval);
}, []);

const mergedMatches = useMemo(() => {
  if (liveMap.size === 0) return matches;
  return matches.map((m) => {
    const home = normalizeName(m.homeTeam?.name ?? "");
    const away = normalizeName(m.awayTeam?.name ?? "");
    const key = `${home}|${away}`;
    const live = liveMap.get(key);
    if (!live) return m;
    return {
      ...m,
      homeGoals: live.homeGoals ?? m.homeGoals,
      awayGoals: live.awayGoals ?? m.awayGoals,
      played: live.played ?? m.played,
      status: live.status ?? m.status,
    };
  });
}, [matches, liveMap]);

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

  // Build knockout fixtures from bracket response, keyed by stage
  const knockoutByStage = useMemo<Map<string, KnockoutFixture[]>>(() => {
    const map = new Map<string, KnockoutFixture[]>();
    if (!bracket) return map;
    const sections: Array<{ key: keyof BracketResponse; stage: string }> = [
      { key: "r32", stage: "R32" },
      { key: "r16", stage: "R16" },
      { key: "qf", stage: "QF" },
      { key: "sf", stage: "SF" },
    ];
    for (const { key, stage } of sections) {
      const arr = bracket[key] as KnockoutFixture[] | undefined;
      if (arr && arr.length > 0) {
        map.set(stage, [...arr].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)));
      }
    }
    // final array contains both 3P and F
    if (bracket.final && bracket.final.length > 0) {
      const thirdPlace = (bracket.final as KnockoutFixture[]).filter((f) => f.stage === "3P");
      const final = (bracket.final as KnockoutFixture[]).filter((f) => f.stage === "F");
      if (thirdPlace.length > 0) map.set("3P", thirdPlace);
      if (final.length > 0) map.set("F", final);
    }
    return map;
  }, [bracket]);

  // Build a lookup: "Group A" -> [pos1name, pos2name, pos3name, pos4name]
  const standingsLookup = useMemo(() => {
    const map = new Map<string, string[]>(); // e.g. "A" -> ["Mexico","South Africa","South Korea","Czech Republic"]
    for (const sg of standingsData) {
      // sg.group is "Group A", "Group B", etc.
      const letter = sg.group.replace("Group ", "").trim();
      map.set(letter, sg.teams.map((t) => t.name));
    }
    return map;
  }, [standingsData]);

  // Build a lookup for third-placed teams with tiebreaker data
  const thirdPlaceLookup = useMemo(() => {
    const map = new Map<string, { name: string; points: number; goalDifference: number; goalsFor: number }>();
    for (const sg of standingsData) {
      const letter = sg.group.replace("Group ", "").trim();
      if (sg.teams.length >= 3) {
        const t = sg.teams[2];
        map.set(letter, { name: t.name, points: t.points, goalDifference: t.goalDifference, goalsFor: t.goalsFor });
      }
    }
    return map;
  }, [standingsData]);

  function bestThird(groups: string[]): string {
    let best: { name: string; points: number; goalDifference: number; goalsFor: number } | null = null;
    for (const g of groups) {
      const t = thirdPlaceLookup.get(g);
      if (!t) continue;
      if (!best || t.points > best.points ||
          (t.points === best.points && t.goalDifference > best.goalDifference) ||
          (t.points === best.points && t.goalDifference === best.goalDifference && t.goalsFor > best.goalsFor)) {
        best = t;
      }
    }
    return best?.name ?? "";
  }

  // Resolve a bracket label like "Winner Group A" or "Runner-up Group B" to a real team name
  function resolveLabel(label: string | null | undefined): string {
    if (!label) return "TBD";
    const winnerMatch = label.match(/^Winner Group ([A-Z])$/i);
    if (winnerMatch) {
      const teams = standingsLookup.get(winnerMatch[1].toUpperCase());
      return teams?.[0] ?? label;
    }
    const runnerUpMatch = label.match(/^Runner-up Group ([A-Z])$/i);
    if (runnerUpMatch) {
      const teams = standingsLookup.get(runnerUpMatch[1].toUpperCase());
      return teams?.[1] ?? label;
    }
    const thirdMatch = label.match(/^Best third-placed team (.+)$/i);
    if (thirdMatch) {
      const groups = thirdMatch[1].split("/").map((s) => s.trim()).filter(Boolean);
      const resolved = bestThird(groups);
      return resolved || label;
    }
    return label;
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const stage of STAGE_ORDER) {
      const stageMatches = mergedMatches
        .filter((m) => m.stage === stage)
        .sort((a, b) => {
          const da = wcSchedule[a.id]?.dateTime;
          const db = wcSchedule[b.id]?.dateTime;
          if (da && db) return da.localeCompare(db);
          if (da) return -1;
          if (db) return 1;
          return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
        });
      if (stageMatches.length > 0) map.set(stage, stageMatches);
    }
    return map;
  }, [mergedMatches, wcSchedule]);

  const isInPlay = (m: Match) => m.status === "IN_PLAY" || m.status === "PAUSED" || m.status === "LIVE";

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

  if (mergedMatches.length === 0) {
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
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface">Match Schedule</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
            liveSource === "live" ? "bg-green-900/30 text-green-400" : "bg-surface-container-high text-outline"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveSource === "live" ? "bg-green-400 animate-pulse" : "bg-yellow-500"}`} />
            {liveSource === "live" ? "Live Scores" : "Local"}
          </span>
        </div>
        <p className="font-body-md text-sm md:text-body-md text-on-surface-variant">
          {mergedMatches.length} group matches · {Array.from(knockoutByStage.values()).reduce((s, a) => s + a.length, 0)} knockout fixtures
        </p>
      </div>

      <div className="space-y-8">
        {/* ── Group stage matches ── */}
        {Array.from(grouped.entries()).map(([stage, stageMatches]) => (
          <section key={stage}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-headline-sm text-headline-sm text-primary-container">{STAGE_LABELS[stage] || stage}</h2>
              <span className="text-xs text-outline bg-surface-container-high px-2 py-0.5 rounded-full">{stageMatches.length} match{stageMatches.length !== 1 ? "es" : ""}</span>
            </div>
            <div className="grid gap-2">
              {stageMatches.map((match, idx) => {
                const homeName = match.homeLabel || (match.homeTeam?.name ? match.homeTeam.name : match.stage || "");
                const awayName = match.awayLabel || (match.awayTeam?.name ? match.awayTeam.name : match.stage || "");
                const live = isInPlay(match);
                const scorerKey = `${normalizeName(homeName)}|${normalizeName(awayName)}`;
                const scorers = scorerMap.get(scorerKey);
                const hasScorers = (match.played || live) && scorers && (scorers.homeScorers || scorers.awayScorers);
                return (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className={`rounded-xl border px-3 py-2.5 md:px-5 md:py-3 transition-colors block hover:ring-1 hover:ring-blue-500/50 ${
                      match.played
                        ? "bg-surface-container border-outline-variant"
                        : live
                        ? "bg-red-900/20 border-red-500/40"
                        : "bg-surface-container-low border-outline-variant/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="text-[10px] md:text-xs text-outline w-5 md:w-7 shrink-0 tabular-nums">{idx + 1}</span>
                      <div className="hidden md:block w-20 shrink-0">
                        <p className="text-[10px] text-outline font-medium">{formatDate(match.date, wcSchedule[match.id]?.dateTime)}</p>
                        <p className="text-[10px] text-outline/60">{formatTime(match.date, wcSchedule[match.id]?.dateTime)}</p>
                      </div>
                      <div className="hidden md:block w-28 shrink-0 truncate">
                        <p className="text-[10px] text-outline truncate">{match.venue || ""}</p>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2 md:gap-4 min-w-0">
                        <span className={`text-xs md:text-sm truncate text-right flex-1 ${match.played || live ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                          {homeName}
                        </span>
                        <span className={`shrink-0 font-bold tabular-nums text-sm md:text-base min-w-[3ch] text-center ${
                          match.played || live ? "text-secondary" : "text-outline"
                        }`}>
                          {match.played || live ? `${match.homeGoals} - ${match.awayGoals}` : "vs"}
                        </span>
                        <span className={`text-xs md:text-sm truncate flex-1 ${match.played || live ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                          {awayName}
                        </span>
                      </div>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
                        match.played
                          ? "bg-primary-container/10 text-primary-container"
                          : live
                          ? "bg-red-900/30 text-red-400 animate-pulse"
                          : "bg-surface-variant text-outline"
                      }`}>
                        {match.played ? "FT" : live ? "LIVE" : "UPCOMING"}
                      </span>
                    </div>
                    <div className="block md:hidden text-[9px] text-outline/60 text-center mt-1 leading-tight">
                      {formatDate(match.date, wcSchedule[match.id]?.dateTime)}{formatTime(match.date, wcSchedule[match.id]?.dateTime) ? ` ${formatTime(match.date, wcSchedule[match.id]?.dateTime)}` : ""}{match.venue ? ` · ${match.venue}` : ""}
                    </div>
                    {hasScorers && (
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
          </section>
        ))}

        {/* ── Knockout stages from bracket ── */}
        {(["R32", "R16", "QF", "SF", "3P", "F"] as const).map((stage) => {
          const fixtures = knockoutByStage.get(stage);
          if (!fixtures || fixtures.length === 0) return null;
          return (
            <section key={stage}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-headline-sm text-headline-sm text-primary-container">{STAGE_LABELS[stage] || stage}</h2>
                <span className="text-xs text-outline bg-surface-container-high px-2 py-0.5 rounded-full">{fixtures.length} match{fixtures.length !== 1 ? "es" : ""}</span>
              </div>
              <div className="grid gap-2">
                {fixtures.map((fixture, idx) => {
                  const homeName = stage === "R32"
                    ? resolveLabel(fixture.homeLabel)
                    : fixture.homeLabel || "TBD";
                  const awayName = stage === "R32"
                    ? resolveLabel(fixture.awayLabel)
                    : fixture.awayLabel || "TBD";
                  const isPlayed = fixture.played === true;
                  const isLive = fixture.status === "IN_PLAY" || fixture.status === "PAUSED" || fixture.status === "LIVE";
                  const inner = (
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="text-[10px] md:text-xs text-outline w-5 md:w-7 shrink-0 tabular-nums">{(fixture.matchNumber ?? idx + 1)}</span>
                      <div className="hidden md:block w-20 shrink-0">
                        <p className="text-[10px] text-outline font-medium">{formatDate(fixture.date)}</p>
                        <p className="text-[10px] text-outline/60">{formatTime(fixture.date)}</p>
                      </div>
                      <div className="hidden md:block w-28 shrink-0 truncate">
                        <p className="text-[10px] text-outline truncate">{fixture.venue || ""}</p>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2 md:gap-4 min-w-0">
                        <span className={`text-xs md:text-sm truncate text-right flex-1 ${isPlayed || isLive ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                          {homeName}
                        </span>
                        <span className={`shrink-0 font-bold tabular-nums text-sm md:text-base min-w-[3ch] text-center ${isPlayed || isLive ? "text-secondary" : "text-outline"}`}>
                          {isPlayed || isLive ? `${fixture.homeGoals ?? 0} - ${fixture.awayGoals ?? 0}` : "vs"}
                        </span>
                        <span className={`text-xs md:text-sm truncate flex-1 ${isPlayed || isLive ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                          {awayName}
                        </span>
                      </div>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
                        isPlayed
                          ? "bg-primary-container/10 text-primary-container"
                          : isLive
                          ? "bg-red-900/30 text-red-400 animate-pulse"
                          : "bg-surface-variant text-outline"
                      }`}>
                        {isPlayed ? "FT" : isLive ? "LIVE" : "UPCOMING"}
                      </span>
                    </div>
                  );
                  const rowClass = `rounded-xl border px-3 py-2.5 md:px-5 md:py-3 transition-colors ${
                    isPlayed
                      ? "bg-surface-container border-outline-variant"
                      : isLive
                      ? "bg-red-900/20 border-red-500/40"
                      : "bg-surface-container-low border-outline-variant/40"
                  }`;
                  const mobileDate = (
                    <div className="block md:hidden text-[9px] text-outline/60 text-center mt-1 leading-tight">
                      {formatDate(fixture.date)}{formatTime(fixture.date) ? ` ${formatTime(fixture.date)}` : ""}{fixture.venue ? ` · ${fixture.venue}` : ""}
                    </div>
                  );
                  // If it has a real match id, make it a link; otherwise a plain div
                  return fixture.id != null ? (
                    <Link key={fixture.id} href={`/matches/${fixture.id}`} className={`block hover:ring-1 hover:ring-blue-500/50 ${rowClass}`}>
                      {inner}{mobileDate}
                    </Link>
                  ) : (
                    <div key={`${stage}-${idx}`} className={rowClass}>
                      {inner}{mobileDate}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
