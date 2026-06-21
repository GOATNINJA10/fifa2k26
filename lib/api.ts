export const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type Team = {
  id: number;
  name: string;
  flagUrl?: string | null;
  rating: number;
  confederation?: string | null;
  group?: { id: number; name: string } | null;
};

export type GroupStanding = {
  teamId: number;
  name: string;
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
};

export type Match = {
  id: number;
  matchNumber?: number | null;
  homeLabel?: string | null;
  awayLabel?: string | null;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  date?: string | null;
  venue?: string | null;
  stage?: string | null;
  homeGoals: number;
  awayGoals: number;
  played: boolean;
  status?: string;
};

type KnockoutFixture = {
  matchNumber?: number;
  stage?: string;
  date?: string;
  venue?: string;
  homeLabel?: string;
  awayLabel?: string;
};

export type BracketResponse = {
  source: string;
  matches?: Match[];
  r32?: KnockoutFixture[];
  r16?: KnockoutFixture[];
  qf?: KnockoutFixture[];
  sf?: KnockoutFixture[];
  final?: KnockoutFixture[];
};

export type Player = {
  id: number;
  name: string;
  rating: number;
  goals: number;
  assists: number;
  team?: Team | null;
};

export type StatsResponse = {
  source: "live" | "local";
  data: Player[];
  meta?: { totalGoals: number; teamGoals: Array<{ name: string; goals: number }> };
};

export type GroupStandingEntry = {
  position: number;
  name: string;
  flagUrl: string | null;
  confederation: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type StandingsGroup = {
  group: string;
  teams: GroupStandingEntry[];
};

export type StandingsResponse = {
  source: string;
  data: StandingsGroup[];
};

export type GoalScorerEntry = {
  homeTeam: string;
  awayTeam: string;
  homeScorers: string | null;
  awayScorers: string | null;
};

export type Highlight = {
  id: number;
  title: string;
  videoId: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  stage: string;
  team?: string | null;
  createdAt: string;
  published: boolean;
  match?: Match | null;
};

export type YouTubeVideoResult = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export type YouTubeSearchResponse = {
  source: string;
  data: YouTubeVideoResult[];
};

export type HighlightsResponse = {
  source: string;
  data: Highlight[];
  total: number;
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getTeams: () => fetchJson<Team[]>("/teams"),
  getGroups: () => fetchJson<{ id: number; name: string; teams: Team[] }[]>("/groups"),
  getGroupStandings: (groupId: number) => fetchJson<GroupStanding[]>(`/groups/${groupId}/standings`),
  simulateGroup: (groupId: number) => fetchJson<GroupStanding[]>(`/groups/${groupId}/simulate`, { method: "POST" }),
  getMatches: () => fetchJson<Match[]>("/matches"),
  getLiveMatches: () => fetchJson<{ source: string; matches: Partial<Match>[] }>("/matches/live"),
  getBracket: () => fetchJson<BracketResponse>("/tournament/bracket"),
  advanceTournament: (payload: unknown) => fetchJson<Record<string, unknown>>("/tournament/advance", { method: "POST", body: JSON.stringify(payload) }),
  simulateMatch: (id: number) => fetchJson<Match>(`/matches/${id}/simulate`, { method: "POST" }),
  updateMatch: (id: number, payload: { homeGoals?: number; awayGoals?: number }) => fetchJson<Match>(`/matches/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  getTopScorers: () => fetchJson<StatsResponse>("/stats/top-scorers"),
  getAssistLeaders: () => fetchJson<StatsResponse>("/stats/assist-leaders"),
  getStandings: () => fetchJson<StandingsResponse>("/stats/standings"),
  getWcSchedule: () => fetchJson<Record<number, { dateTime: string; orderIndex: number }>>("/matches/wc-schedule"),
  getGoalScorers: () => fetchJson<GoalScorerEntry[]>("/matches/goal-scorers"),
  getHighlights: (params?: { stage?: string; team?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.stage) query.set("stage", params.stage);
    if (params?.team) query.set("team", params.team);
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    return fetchJson<HighlightsResponse>(`/highlights?${query.toString()}`);
  },
  searchYouTube: (homeTeam: string, awayTeam: string, date?: string) => {
    const params = new URLSearchParams({ homeTeam, awayTeam });
    if (date) params.set("date", date);
    return fetchJson<YouTubeSearchResponse>(`/highlights/search?${params.toString()}`);
  },
  createHighlight: (data: { title: string; videoId: string; description?: string; thumbnailUrl?: string; stage: string; team?: string; matchId?: number }) =>
    fetchJson<Highlight>("/highlights", { method: "POST", body: JSON.stringify({ ...data, published: true }) }),
  autoPopulateHighlights: () =>
    fetchJson<{ message: string }>("/highlights/auto-populate", { method: "POST" }),
  clearAllHighlights: () =>
    fetchJson<{ message: string }>("/highlights", { method: "DELETE" }),
};