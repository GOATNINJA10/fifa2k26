"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, API_BASE_URL, Match } from "@/lib/api";

type BracketStage = { title: string; stage: string; matches: Match[] };

const STAGE_ORDER = ["R32", "R16", "QF", "SF", "F", "3P"];
const ELIMINATION_STAGES = ["R32", "R16", "QF", "SF"] as const;
const STAGE_SPACING: Record<string, number> = {
  R32: 16,
  R16: 44,
  QF: 96,
  SF: 180,
};

function formatDateIST(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    if (!dateStr.includes("T")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, ${parts[0]}`;
      }
      return dateStr;
    }
    const date = new Date(dateStr);
    return `${date.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })} IST`;
  } catch {
    return "";
  }
}

function splitStageMatches(matches: Match[]) {
  const midpoint = Math.ceil(matches.length / 2);
  return {
    left: matches.slice(0, midpoint),
    right: matches.slice(midpoint),
  };
}

function TrophyMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 text-white/55 md:h-20 md:w-20" fill="none" aria-hidden="true">
      <path d="M22 10h20v7c0 7.2-4.3 13.1-10 15.3C26.3 30.1 22 24.2 22 17v-7Z" fill="currentColor" />
      <path d="M26 35h12v7H26zM23 44h18v5H23zM20 51h24v3H20z" fill="currentColor" opacity="0.9" />
      <path
        d="M22 12H14c0 8.8 4.2 14 10 16M42 12h8c0 8.8-4.2 14-10 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="28" r="6.5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M32 25v6M29.8 26.8h2.2a1.7 1.7 0 1 1 0 3.4h-2.2" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type MatchCardProps = {
  match: Match;
  accent?: "gold" | "bronze";
  badgeLabel?: string;
  onSelectWinner: (match: Match, isHome: boolean) => void;
};

function TeamBadge({ team }: { team?: Match["homeTeam"] | Match["awayTeam"] }) {
  if (team?.flagUrl) {
    return (
      <div className="h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-white/5">
        <img src={team.flagUrl} alt={`${team.name} flag`} className="h-full w-full object-cover" />
      </div>
    );
  }

  return <div className="h-7 w-7 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />;
}

function MatchCard({ match, accent, badgeLabel, onSelectWinner }: MatchCardProps) {
  const homeTeam = match.homeLabel || match.homeTeam?.name || "";
  const awayTeam = match.awayLabel || match.awayTeam?.name || "";
  const isDecided = match.played;
  const winner =
    isDecided && match.homeGoals > match.awayGoals ? "home" : isDecided ? "away" : null;

  const shellClass =
    accent === "gold"
      ? "border-amber-300/35 bg-[#252321]"
      : accent === "bronze"
        ? "border-sky-400/35 bg-[#202428]"
        : "border-white/12 bg-[#1d1d1d]";

  const badgeClass =
    accent === "gold"
      ? "bg-amber-300 text-black"
      : accent === "bronze"
        ? "bg-sky-500 text-white"
        : "bg-white/8 text-slate-200";

  return (
    <div
      className={`relative w-[196px] rounded-2xl border px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-sm ${shellClass}`}
    >
      <div className="mb-2 flex items-center justify-center gap-4">
        <TeamBadge team={match.homeTeam} />
        <TeamBadge team={match.awayTeam} />
      </div>

      <div className="space-y-1.5">
        <button
          onClick={() => onSelectWinner(match, true)}
          disabled={isDecided}
          className={`flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] font-semibold transition ${
            winner === "home"
              ? "bg-green-800/40 text-green-400 border-l-2 border-green-400"
              : isDecided
                ? "bg-red-900/30 text-red-400 border-l-2 border-red-400"
                : "text-white hover:bg-white/6"
          }`}
        >
          <span className="min-w-0 flex-1 whitespace-normal break-words leading-tight">
            {winner === "home" && <span className="mr-1.5 text-green-400">●</span>}
            {isDecided && winner !== "home" && <span className="mr-1.5 text-red-400">●</span>}
            {homeTeam}
          </span>
          {isDecided && winner === "home" && <span className="text-[11px] font-bold text-green-400">WIN</span>}
          {isDecided && winner !== "home" && <span className="text-[11px] font-bold text-red-400">LOSS</span>}
        </button>
        <button
          onClick={() => onSelectWinner(match, false)}
          disabled={isDecided}
          className={`flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] font-semibold transition ${
            winner === "away"
              ? "bg-green-800/40 text-green-400 border-l-2 border-green-400"
              : isDecided
                ? "bg-red-900/30 text-red-400 border-l-2 border-red-400"
                : "text-white hover:bg-white/6"
          }`}
        >
          <span className="min-w-0 flex-1 whitespace-normal break-words leading-tight">
            {winner === "away" && <span className="mr-1.5 text-green-400">●</span>}
            {isDecided && winner !== "away" && <span className="mr-1.5 text-red-400">●</span>}
            {awayTeam}
          </span>
          {isDecided && winner === "away" && <span className="text-[11px] font-bold text-green-400">WIN</span>}
          {isDecided && winner !== "away" && <span className="text-[11px] font-bold text-red-400">LOSS</span>}
        </button>
      </div>

      <div className="mt-1.5 text-center text-[11px] font-medium text-[#9aa8bf]">{formatDateIST(match.date)}</div>

      {badgeLabel ? (
        <div className="mt-2 flex justify-center">
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

type StageColumnProps = {
  stageKey: string;
  label: string;
  matches: Match[];
  side: "left" | "right";
  onSelectWinner: (match: Match, isHome: boolean) => void;
};

function StageColumn({ stageKey, label, matches, side, onSelectWinner }: StageColumnProps) {
  if (!matches.length) return null;

  const connectorToCenter = stageKey !== "SF";
  const spacing = STAGE_SPACING[stageKey] ?? 24;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#97a6bf]">
        {label}
      </div>
      <div className="flex flex-col justify-around" style={{ gap: `${spacing}px`, minHeight: `${matches.length * 112 + Math.max(matches.length - 1, 0) * spacing}px` }}>
        {matches.map((match) => (
          <div key={match.id} className="relative flex items-center">
            {connectorToCenter ? (
              <div
                className={`absolute top-1/2 h-px w-10 -translate-y-1/2 bg-white/16 ${
                  side === "left" ? "left-full" : "right-full"
                }`}
              />
            ) : (
              <div
                className={`absolute top-1/2 h-px w-12 -translate-y-1/2 bg-white/16 ${
                  side === "left" ? "left-full" : "right-full"
                }`}
              />
            )}
            <MatchCard match={match} onSelectWinner={onSelectWinner} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KnockoutBracket() {
  const [stages, setStages] = useState<BracketStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState(85);
  const [autoZoom, setAutoZoom] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [champion, setChampion] = useState<{ name: string; flagUrl: string | null } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  async function load() {
    setLoading(true);
    setLoadError(null);
    let bracket;
    try {
      bracket = await api.getBracket();
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load bracket");
      setLoading(false);
      return;
    }
    let matches: Match[] = [];

    if (bracket.matches && bracket.matches.length > 0) {
      matches = bracket.matches;
    } else if (bracket.r32 || bracket.r16 || bracket.qf || bracket.sf || bracket.final) {
      const fixtures = [
        ...(bracket.r32 || []),
        ...(bracket.r16 || []),
        ...(bracket.qf || []),
        ...(bracket.sf || []),
        ...(bracket.final || []),
      ];
      matches = fixtures.map((f: { matchNumber?: number; stage?: string; date?: string; venue?: string; homeLabel?: string; awayLabel?: string }, idx: number) => ({
        id: idx,
        matchNumber: f.matchNumber,
        stage: f.stage,
        date: f.date,
        venue: f.venue,
        homeLabel: f.homeLabel,
        awayLabel: f.awayLabel,
        homeTeam: null,
        awayTeam: null,
        homeGoals: 0,
        awayGoals: 0,
        played: false,
      }));
    }

    const groupByStage = new Map<string, Match[]>();
    for (const match of matches) {
      const stage = match.stage || "Unknown";
      if (!groupByStage.has(stage)) groupByStage.set(stage, []);
      groupByStage.get(stage)!.push(match);
    }

    const order = ["R32", "R16", "QF", "SF", "3P", "F"];
    const stageLabels: Record<string, string> = {
      R32: "Round of 32",
      R16: "Round of 16",
      QF: "Quarterfinal",
      SF: "Semifinal",
      "3P": "Third Place",
      F: "Final",
    };

    const finalDecided = (groupByStage.get("F") || []).find((m) => m.played);
    if (finalDecided && !champion) {
      const winnerTeam = finalDecided.homeGoals > finalDecided.awayGoals
        ? (finalDecided.homeTeam || { name: finalDecided.homeLabel || "Winner", flagUrl: null })
        : (finalDecided.awayTeam || { name: finalDecided.awayLabel || "Winner", flagUrl: null });
      setChampion({ name: winnerTeam.name, flagUrl: winnerTeam.flagUrl || null });
    }

    setStages(
      order
        .map((stageKey) => ({
          title: stageLabels[stageKey] || stageKey,
          stage: stageKey,
          matches: groupByStage.get(stageKey) || [],
        }))
        .filter((stage) => stage.matches.length > 0),
    );
    setLoading(false);
  }

  const totalMatches = useMemo(
    () => stages.reduce((sum, stage) => sum + stage.matches.length, 0),
    [stages],
  );
  const decidedMatches = useMemo(
    () => stages.reduce((sum, stage) => sum + stage.matches.filter((match) => match.played).length, 0),
    [stages],
  );

  const bracketPositions = useMemo(() => {
    const positions: Record<string, Match[]> = {};
    STAGE_ORDER.forEach((stage) => {
      positions[stage] = [];
    });

    stages.forEach((stage) => {
      if (positions[stage.stage]) {
        positions[stage.stage] = stage.matches;
      }
    });

    return positions;
  }, [stages]);

  const leftStages = useMemo(
    () =>
      ELIMINATION_STAGES.map((stageKey) => ({
        stageKey,
        label: stageKey === "SF" ? "SF" : stageKey,
        matches: splitStageMatches(bracketPositions[stageKey]).left,
      })).filter((stage) => stage.matches.length > 0),
    [bracketPositions],
  );

  const rightStages = useMemo(
    () =>
      ELIMINATION_STAGES.map((stageKey) => ({
        stageKey,
        label: stageKey === "SF" ? "SF" : stageKey,
        matches: splitStageMatches(bracketPositions[stageKey]).right,
      }))
        .filter((stage) => stage.matches.length > 0)
        .reverse(),
    [bracketPositions],
  );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoZoom || !stages.length) return;

    function applyAutoZoom() {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      if (!containerWidth) return;

      const fittedZoom = Math.floor((containerWidth / 1520) * 100);
      setZoom(Math.max(60, Math.min(90, fittedZoom)));
    }

    applyAutoZoom();
    window.addEventListener("resize", applyAutoZoom);
    return () => window.removeEventListener("resize", applyAutoZoom);
  }, [autoZoom, stages.length]);

  async function selectWinner(match: Match, isHome: boolean) {
    try {
      const homeGoals = isHome ? 1 : 0;
      const awayGoals = isHome ? 0 : 1;

      const updated = await api.updateMatch(match.id, { homeGoals, awayGoals });
      await load();

      if (match.stage === "F" && updated.played) {
        const winnerTeam = updated.homeGoals > updated.awayGoals
          ? (updated.homeTeam || { name: updated.homeLabel || "Winner", flagUrl: null })
          : (updated.awayTeam || { name: updated.awayLabel || "Winner", flagUrl: null });
        setChampion({ name: winnerTeam.name, flagUrl: winnerTeam.flagUrl || null });
        setShowCelebration(true);
      }
    } catch (err: unknown) {
      console.error("Error selecting winner:", err);
      setNotification({ type: "error", message: `Failed to select winner: ${err instanceof Error ? err.message : "Unknown error"}` });
    }
  }

  async function clearBracket() {
    setClearing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/tournament/clear`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to clear bracket: ${response.status} ${error}`);
      }
      await load();
    } catch (err: unknown) {
      console.error("Error clearing bracket:", err);
      setNotification({ type: "error", message: `Error clearing bracket: ${err instanceof Error ? err.message : "Unknown error"}` });
    } finally {
      setClearing(false);
    }
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const element = bracketRef.current;
      const container = containerRef.current;
      if (!element || !container) return;
      const main = container.closest(".flex-1") as HTMLElement | null;

      const [jsPDFModule, toPngModule, getFontEmbedCSS] = await Promise.all([
        import("jspdf"),
        import("html-to-image"),
        import("html-to-image").then((m) => m.getFontEmbedCSS),
      ]);

      const origBracket = { transform: element.style.transform, overflow: element.style.overflow };
      const origContainer = { overflow: container.style.overflow, height: container.style.height, maxHeight: container.style.maxHeight, position: container.style.position };
      const origMain = main ? { overflow: main.style.overflow } : null;

      element.style.transform = "none";
      element.style.overflow = "visible";
      container.style.overflow = "visible";
      container.style.height = "auto";
      container.style.maxHeight = "none";
      container.style.position = "relative";
      if (main) main.style.overflow = "visible";

      const blurred = element.querySelectorAll(".backdrop-blur-sm, .backdrop-blur-md, .backdrop-blur-xl");
      blurred.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const s = htmlEl.style;
        const orig = s.backdropFilter || (s as unknown as Record<string, string>).webkitBackdropFilter || "";
        htmlEl.dataset.backupBlur = orig;
        s.backdropFilter = "none";
        (s as unknown as Record<string, string>).webkitBackdropFilter = "none";
      });

      const fontEmbedCss = await getFontEmbedCSS(element);
      const captureW = element.scrollWidth || element.offsetWidth;
      const captureH = element.scrollHeight || element.offsetHeight;
      const dataUrl = await toPngModule.toPng(element, {
        backgroundColor: "#111111",
        pixelRatio: 3,
        cacheBust: true,
        fontEmbedCSS: fontEmbedCss,
        width: captureW,
        height: captureH,
      });

      blurred.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const s = htmlEl.style;
        s.backdropFilter = htmlEl.dataset.backupBlur || "";
        (s as unknown as Record<string, string>).webkitBackdropFilter = htmlEl.dataset.backupBlur || "";
        delete htmlEl.dataset.backupBlur;
      });
      element.style.transform = origBracket.transform;
      element.style.overflow = origBracket.overflow;
      container.style.overflow = origContainer.overflow;
      container.style.height = origContainer.height;
      container.style.maxHeight = origContainer.maxHeight;
      container.style.position = origContainer.position;
      if (main && origMain) main.style.overflow = origMain.overflow;

      const pdf = new jsPDFModule.default("l", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      pdf.setFillColor(17, 17, 17);
      pdf.rect(0, 0, pageW, pageH, "F");

      const pdfImg = new Image();
      pdfImg.src = dataUrl;
      await pdfImg.decode();

      const scale = Math.min(pageW / pdfImg.width, pageH / pdfImg.height);
      const imgW = pdfImg.width * scale;
      const imgH = pdfImg.height * scale;
      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2;
      pdf.addImage(dataUrl, "PNG", x, y, imgW, imgH);
      pdf.save("knockout-bracket.pdf");
      setNotification({ type: "success", message: "PDF exported successfully" });
    } catch (err: unknown) {
      console.error("Error exporting PDF:", err);
      setNotification({ type: "error", message: `Failed to export PDF: ${err instanceof Error ? err.message : "Unknown error"}` });
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 p-8">
        <div className="text-center text-on-surface-variant">Loading bracket...</div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <p className="text-error font-headline-md">Failed to load bracket</p>
          <p className="text-on-surface-variant text-sm">{loadError}</p>
          <button onClick={load} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden bg-[#111111] p-3 text-white md:p-8">
      {notification && (
        <div className={`fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 z-50 px-3 py-2.5 md:px-4 md:py-3 rounded-xl border text-xs md:text-sm font-medium shadow-lg flex items-center gap-2 md:gap-3 md:max-w-lg ${notification.type === "success" ? "bg-green-900/80 border-green-700 text-green-300" : "bg-red-900/80 border-red-700 text-red-300"}`}>
          <span className="material-symbols-outlined text-base">{notification.type === "success" ? "check_circle" : "error"}</span>
          <span className="flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="opacity-60 hover:opacity-100">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
      {clearing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-[#1b1b1b] px-8 py-7">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-400 border-t-transparent" />
            <p className="text-lg font-semibold text-white">Clearing bracket...</p>
            <p className="text-sm text-white/60">Please wait</p>
          </div>
        </div>
      ) : null}

      {showCelebration && champion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setShowCelebration(false)}>
          <div className="flex flex-col items-center gap-4 md:gap-6 rounded-[24px] md:rounded-[32px] border border-green-500/30 bg-[#1b2a1b] px-6 py-8 md:px-12 md:py-10 shadow-[0_0_60px_rgba(0,255,65,0.15)] max-w-[90vw] md:max-w-none" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl md:text-6xl">🏆</div>
            {champion.flagUrl && <img src={champion.flagUrl} alt="" className="h-12 w-12 md:h-16 md:w-16 rounded-full border-2 border-green-400 object-cover" />}
            <p className="text-xl md:text-3xl font-extrabold text-green-400 tracking-tight text-center">{champion.name}</p>
            <p className="text-sm text-green-300/70 uppercase tracking-[0.3em]">World Cup 2026 Champion</p>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-2 rounded-xl border border-green-500/30 bg-green-900/30 px-8 py-2 text-sm font-semibold text-green-300 hover:bg-green-800/40 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.2)] md:h-14 md:w-14">
            <TrophyMark />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white md:text-2xl">Knockout Bracket</h1>
            <p className="text-xs text-[#a9b4c7] md:text-sm">{decidedMatches}/{totalMatches} matches decided</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 md:gap-2">
          <button
            onClick={() => {
              setAutoZoom(false);
              setZoom(Math.max(50, zoom - 25));
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white transition hover:bg-white/10 md:px-3 md:py-2"
            title="Zoom out"
          >
            -
          </button>
          <div className="min-w-12 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-center text-xs font-medium text-white md:min-w-14 md:px-4 md:py-2 md:text-sm">
            {zoom}%
          </div>
          <button
            onClick={() => {
              setAutoZoom(false);
              setZoom(Math.min(200, zoom + 25));
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white transition hover:bg-white/10 md:px-3 md:py-2"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setAutoZoom(true)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 md:px-4 md:py-2 md:text-sm"
          >
            Fit
          </button>
          <button
            onClick={load}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 md:px-5 md:py-2 md:text-sm"
          >
            Refresh
          </button>
          <button
            onClick={exportPDF}
            disabled={exporting || totalMatches === 0}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 md:px-5 md:py-2 md:text-sm"
          >
            {exporting ? "Exporting..." : "PDF"}
          </button>
          <button
            onClick={clearBracket}
            disabled={clearing || totalMatches === 0}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50 md:px-5 md:py-2 md:text-sm"
          >
            {clearing ? "..." : "Clear"}
          </button>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="flex h-[60vh] items-center justify-center rounded-[32px] border border-white/8 bg-[#1a1a1a] p-4 text-center">
          <p className="text-sm text-white/60 md:text-base">No knockout matches yet. Lock group positions first.</p>
        </div>
      ) : (
          <div
            ref={containerRef}
            className=" h-[calc(100vh-10rem)] overflow-auto rounded-[32px] border border-white/8 bg-[#1a1a1a] p-3 md:h-[calc(100vh-12rem)] md:p-8"
          >
            <div
              ref={bracketRef}
              className="min-w-[1520px] origin-top-left"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
            >
            <div className="flex min-h-[820px] items-center justify-between gap-12">
              <div className="flex items-center gap-12">
                {leftStages.map((stage) => (
                  <StageColumn
                    key={`left-${stage.stageKey}`}
                    stageKey={stage.stageKey}
                    label={stage.label}
                    matches={stage.matches}
                    side="left"
                    onSelectWinner={selectWinner}
                  />
                ))}
              </div>

              <div className="flex min-w-[340px] flex-col items-center justify-center gap-8">
                <div className="flex flex-col items-center relative">
                  {champion && (
                    <div className="flex flex-col items-center gap-1 mb-2">
                      {champion.flagUrl && <img src={champion.flagUrl} alt="" className="h-10 w-10 rounded-full border-2 border-amber-300/50 object-cover" />}
                      <span className="text-xl font-black text-amber-300 tracking-tight whitespace-nowrap drop-shadow-[0_0_12px_rgba(233,195,73,0.3)]">
                        {champion.name}
                      </span>
                    </div>
                  )}
                  <TrophyMark />
                  <span className="mt-2 text-lg font-semibold uppercase tracking-[0.18em] text-[#b4a18d]">
                    Champion
                  </span>
                </div>

                {bracketPositions.F.length > 0 ? (
                  <div className="relative flex flex-col items-center">
                    <div className="absolute left-[-72px] top-1/2 h-px w-[72px] -translate-y-1/2 bg-white/16" />
                    <div className="absolute right-[-72px] top-1/2 h-px w-[72px] -translate-y-1/2 bg-white/16" />
                    <MatchCard
                      match={bracketPositions.F[0]}
                      accent="gold"
                      badgeLabel="FINAL"
                      onSelectWinner={selectWinner}
                    />
                  </div>
                ) : null}

                {bracketPositions["3P"].length > 0 ? (
                  <MatchCard
                    match={bracketPositions["3P"][0]}
                    accent="bronze"
                    badgeLabel="SEMI-FINAL"
                    onSelectWinner={selectWinner}
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-12">
                {rightStages.map((stage) => (
                  <StageColumn
                    key={`right-${stage.stageKey}`}
                    stageKey={stage.stageKey}
                    label={stage.label}
                    matches={stage.matches}
                    side="right"
                    onSelectWinner={selectWinner}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
