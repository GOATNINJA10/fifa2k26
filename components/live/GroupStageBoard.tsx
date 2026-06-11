"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, Team, Match } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type GroupApi = { id: number; name: string; teams: Team[] };
type BestThirdSelection = string[];

function sortableId(groupId: number, teamId: number) {
  return `${groupId}-${teamId}`;
}

function parseSortableId(id: string) {
  const sep = id.indexOf("-");
  return { groupId: Number(id.slice(0, sep)), teamId: Number(id.slice(sep + 1)) };
}

type SortableTeamItemProps = {
  id: string;
  team: Team;
  place: number;
  locked: boolean;
};

function SortableTeamItem({ id, team, place, locked }: SortableTeamItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group grid grid-cols-[32px_1fr_32px] md:grid-cols-[40px_1fr_36px] items-center gap-2 md:gap-3 rounded-2xl md:rounded-3xl border px-3 py-2 md:px-4 md:py-3 select-none relative ${
        locked
          ? "bg-surface-container-low"
          : "bg-surface-container hover:border-primary-container/50 hover:shadow-lg"
      } ${isDragging ? "scale-105 shadow-2xl ring-2 ring-primary-container/50 bg-primary-container/5 z-50" : "z-0"}`}
    >
      <div
        className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold ${
          place <= 2
            ? "bg-primary-container/10 text-primary-container"
            : place === 3
              ? "bg-yellow-500/20 text-yellow-600"
              : "bg-surface-variant text-on-surface-variant"
        }`}
      >
        {place}
      </div>
      <div className="min-w-0 flex items-center gap-2 md:gap-3" {...attributes} {...listeners}>
        <div className="h-8 w-8 md:h-10 md:w-10 shrink-0 overflow-hidden rounded-xl md:rounded-2xl bg-surface-variant">
          {team.flagUrl ? (
            <img src={team.flagUrl} alt={`${team.name} flag`} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-on-surface-variant">
              {team.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs md:text-sm font-semibold text-on-surface">{team.name}</p>
                        </div>
                      </div>
                      {!locked && (
                        <div
                          className="flex h-8 w-8 md:h-10 md:w-10 cursor-grab items-center justify-center rounded-full border border-outline-variant text-on-surface-variant touch-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <span className="grid gap-px text-sm leading-none">⁞⁞</span>
        </div>
      )}
    </li>
  );
}

export default function GroupStageBoard() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupApi[]>([]);
  const [groupOrders, setGroupOrders] = useState<Record<number, number[]>>({});
  const [bestThirdGroups, setBestThirdGroups] = useState<BestThirdSelection>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [groupData, matchData] = await Promise.all([
        api.getGroups(),
        api.getMatches(),
      ]);
      setGroups(groupData);
      setMatches(matchData);

      const initialOrders: Record<number, number[]> = {};
      const initialBestThirds: BestThirdSelection = [];
      for (const group of groupData) {
        initialOrders[group.id] = group.teams.map((team) => team.id);
        initialBestThirds.push(group.name);
      }

      setGroupOrders(initialOrders);
      setBestThirdGroups(initialBestThirds);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function reorder(groupId: number, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setGroupOrders((prev) => {
      const current = [...(prev[groupId] || [])];
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      return { ...prev, [groupId]: current };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = parseSortableId(String(active.id));
    const to = parseSortableId(String(over.id));
    if (from.groupId !== to.groupId) return;

    const order = groupOrders[from.groupId] ?? [];
    const fromIndex = order.indexOf(from.teamId);
    const toIndex = order.indexOf(to.teamId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    reorder(from.groupId, fromIndex, toIndex);
  }

  const groupMatches = useMemo(() => {
    const byGroupId = new Map<number, Match[]>();
    for (const group of groups) {
      const teamIds = new Set(group.teams.map((t) => t.id));
      const groupMs = matches.filter(
        (m) => m.stage === "Group" && m.homeTeam?.id != null && teamIds.has(m.homeTeam.id) && m.awayTeam?.id != null && teamIds.has(m.awayTeam.id),
      );
      groupMs.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
      byGroupId.set(group.id, groupMs);
    }
    return byGroupId;
  }, [groups, matches]);

  const groupListIds = useMemo(() => {
    const ids: Record<number, string[]> = {};
    for (const group of groups) {
      const order = groupOrders[group.id] ?? group.teams.map((t) => t.id);
      ids[group.id] = order.map((teamId) => sortableId(group.id, teamId));
    }
    return ids;
  }, [groups, groupOrders]);

  async function lockAndGenerate() {
    if (bestThirdGroups.length !== 8) {
      setError("You must select exactly 8 best third-placed groups.");
      return;
    }
    setError(null);
    setLocked(true);

    try {
      const payload = {
        groups: groups.map((group) => {
          const order = groupOrders[group.id] ?? group.teams.map((team) => team.id);
          return {
            groupId: group.id,
            pos1: order[0],
            pos2: order[1],
            pos3: order[2],
            pos4: order[3],
          };
        }),
        bestThirdGroups,
      };

      await api.advanceTournament(payload);
      router.push("/knockout");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate bracket");
      setLocked(false);
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
          <button onClick={load} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md">Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface mb-1">Drag & Drop Group Positions</h1>
          <p className="font-body-md text-sm md:text-body-md text-on-surface-variant">Arrange teams into the finishing order for each group. Drag the team name or handle to reorder.</p>
        </div>
        <button
          onClick={lockAndGenerate}
          disabled={locked}
          className="bg-primary-container text-on-primary-container px-4 py-2 md:px-6 md:py-3 rounded-lg font-label-md text-xs md:text-label-md hover:bg-primary-fixed transition-colors glow-active disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto"
        >
          {locked ? "Bracket Generated" : "Lock & Generate Bracket"}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((group) => {
            const order = groupOrders[group.id] ?? group.teams.map((team) => team.id);
            const ids = groupListIds[group.id] ?? [];
            return (
              <article key={group.id} className="bg-surface-container border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4 gap-2 md:gap-3">
                  <div>
                    <p className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.35em] text-on-surface-variant mb-1">Group {group.name}</p>
                    <div className="flex items-center gap-2 md:gap-3">
                      <h2 className="text-sm md:text-headline-sm md:font-headline-sm">Finish Order</h2>
                      {/* <span className="rounded-full border border-outline-variant bg-surface-variant px-3 py-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant">Weak</span> */}
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {group.teams.map((team) => (
                    <div key={team.id} className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant bg-surface-variant">
                      {team.flagUrl ? (
                        <img src={team.flagUrl} alt={`${team.name} flag`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-on-surface-variant">{team.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  ))}
                </div>

                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-2 relative">
                    {order.map((teamId, index) => {
                      const team = group.teams.find((item) => item.id === teamId);
                      if (!team) return null;
                      return (
                        <SortableTeamItem
                          key={team.id}
                          id={sortableId(group.id, team.id)}
                          team={team}
                          place={index + 1}
                          locked={locked}
                        />
                      );
                    })}
                  </ul>
                </SortableContext>

                <div className="mt-5 grid gap-2 rounded-3xl bg-surface-variant p-4 text-sm text-on-surface-variant">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Group winner</span>
                    <span>{group.teams.find((team) => team.id === order[0])?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Second place</span>
                    <span>{group.teams.find((team) => team.id === order[1])?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Third place</span>
                    <span>{group.teams.find((team) => team.id === order[2])?.name}</span>
                  </div>
                </div>

                {(groupMatches.get(group.id)?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] text-outline mb-2">Matches</p>
                    <div className="space-y-1">
                      {groupMatches.get(group.id)!.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-1.5 text-xs md:text-sm">
                          <span className="truncate flex-1 text-right text-on-surface">{m.homeTeam?.name ?? m.homeLabel ?? "?"}</span>
                          <span className={`shrink-0 font-bold tabular-nums ${m.played ? "text-secondary" : "text-outline"}`}>
                            {m.played ? `${m.homeGoals} - ${m.awayGoals}` : "vs"}
                          </span>
                          <span className="truncate flex-1 text-on-surface">{m.awayTeam?.name ?? m.awayLabel ?? "?"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </DndContext>

      <div className="mt-8 p-6 rounded-3xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md mb-2">Best Third-Placed Groups</h2>
            <p className="text-sm text-on-surface-variant">Click the groups whose third-place team you want to advance.</p>
          </div>
          <p className="text-sm text-on-surface-variant">Selected {bestThirdGroups.length}/8</p>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => {
                setBestThirdGroups((prev) => {
                  if (prev.includes(group.name)) {
                    return prev.filter((name) => name !== group.name);
                  }
                  if (prev.length >= 8) return prev;
                  return [...prev, group.name];
                });
              }}
              className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                bestThirdGroups.includes(group.name)
                  ? "border-primary-container bg-primary-container/10 text-primary-container"
                  : "border-outline-variant bg-surface-container text-on-surface hover:border-primary-container/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Group {group.name}</span>
                {bestThirdGroups.includes(group.name) && <span className="rounded-full bg-primary-container/10 px-2 py-1 text-[11px] font-semibold uppercase text-primary-container">Selected</span>}
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">Third place: {group.teams.find((team) => team.id === (groupOrders[group.id]?.[2] ?? group.teams[2]?.id))?.name}</p>
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-error">{error}</p>}
      </div>

      {locked && (
        <div className="mt-8 p-6 bg-primary-container/10 border border-primary-container/30 rounded-3xl text-center">
          <p className="font-headline-md text-on-surface">Group stage locked! Go to Knockout to see the official bracket.</p>
        </div>
      )}
    </main>
  );
}
