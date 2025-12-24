export interface Player {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  p1: string; // Player Name
  p2: string; // Player Name
  s1: number | null;
  s2: number | null;
  pk1?: number | null; // Penalty Kick Score
  pk2?: number | null; // Penalty Kick Score
  round?: number; // For League
  isCompleted: boolean;
  phase: 'league' | 'tournament';
  tournamentRound?: 'semifinal' | 'prefinal' | 'final'; // For ladder logic
}

export interface Standing {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
  points: number;
  rank: number;
}

export interface TournamentData {
  id: string;
  timestamp: number;
  leagueMatches: Match[];
  tournamentMatches: Match[];
  standings: Standing[]; // Final standings of the league
  winner: string | null;
  players: string[];
}

// Stats for the Archive
export interface AggregatedStats {
  name: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number; // Only relevant for combined views really, but good to have
}