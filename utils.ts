import { Match, Standing, AggregatedStats } from './types';

export const PLAYERS_DEFAULT = ["동민", "동휘", "딸기", "현우"];

export const getInitialLeagueMatches = (): Match[] => [
  // Round 1
  { id: 'L1', p1: '', p2: '', s1: null, s2: null, round: 1, isCompleted: false, phase: 'league' },
  { id: 'L2', p1: '', p2: '', s1: null, s2: null, round: 1, isCompleted: false, phase: 'league' },
  // Round 2
  { id: 'L3', p1: '', p2: '', s1: null, s2: null, round: 2, isCompleted: false, phase: 'league' },
  { id: 'L4', p1: '', p2: '', s1: null, s2: null, round: 2, isCompleted: false, phase: 'league' },
  // Round 3
  { id: 'L5', p1: '', p2: '', s1: null, s2: null, round: 3, isCompleted: false, phase: 'league' },
  { id: 'L6', p1: '', p2: '', s1: null, s2: null, round: 3, isCompleted: false, phase: 'league' },
];

export const calculateStandings = (players: string[], matches: Match[]): Standing[] => {
  const table: Record<string, Standing> = {};

  // Initialize
  players.forEach(p => {
    table[p] = {
      name: p, played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0, rank: 0
    };
  });

  // Process Matches
  matches.forEach(m => {
    // Only process if both players are valid (in the players list) and score is set
    if (m.isCompleted && m.s1 !== null && m.s2 !== null && table[m.p1] && table[m.p2]) {
      const p1 = table[m.p1];
      const p2 = table[m.p2];

      p1.played++;
      p2.played++;
      p1.gf += m.s1;
      p1.ga += m.s2;
      p2.gf += m.s2;
      p2.ga += m.s1;

      if (m.s1 > m.s2) {
        p1.won++;
        p1.points += 3;
        p2.lost++;
      } else if (m.s1 < m.s2) {
        p2.won++;
        p2.points += 3;
        p1.lost++;
      } else {
        p1.drawn++;
        p1.points += 1;
        p2.drawn++;
        p2.points += 1;
      }

      p1.gd = p1.gf - p1.ga;
      p2.gd = p2.gf - p2.ga;
    }
  });

  // Convert to array and Sort
  // 1. Points, 2. GD, 3. H2H (Simplified: using Head to Head logic if possible, else GF)
  
  const sorted = Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;

    // H2H Check
    const h2hMatch = matches.find(m => 
      m.isCompleted && 
      ((m.p1 === a.name && m.p2 === b.name) || (m.p1 === b.name && m.p2 === a.name))
    );

    if (h2hMatch && h2hMatch.s1 !== null && h2hMatch.s2 !== null) {
        const aScore = h2hMatch.p1 === a.name ? h2hMatch.s1 : h2hMatch.s2;
        const bScore = h2hMatch.p1 === b.name ? h2hMatch.s1 : h2hMatch.s2;
        if (aScore !== bScore) return bScore - aScore;
    }
    
    return b.gf - a.gf; // Fallback to Goals For
  });

  return sorted.map((s, i) => ({ ...s, rank: i + 1 }));
};

export const getAggregatedStats = (matches: Match[], filter: 'all' | 'league' | 'tournament'): AggregatedStats[] => {
  const stats: Record<string, AggregatedStats> = {};

  const processMatch = (m: Match) => {
    // Relaxed Check: s1/s2 can be 0, so check strict null. 
    // removed 'isCompleted' check to allow partial data if saved forcefully, 
    // but typically we want completed matches. Let's keep strict null check.
    if (m.s1 === null || m.s2 === null) return;
    
    // Ensure players exist in stats
    [m.p1, m.p2].forEach(p => {
      // Skip empty or invalid names or placeholders
      if (!p || p === 'TBD') return;

      if (!stats[p]) {
        stats[p] = { name: p, matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 };
      }
    });

    const p1 = stats[m.p1];
    const p2 = stats[m.p2];

    if (!p1 || !p2) return;

    p1.matches++;
    p2.matches++;
    p1.gf += m.s1;
    p1.ga += m.s2;
    p2.gf += m.s2;
    p2.ga += m.s1;

    // Determine winner (considering PKs for tournament)
    let p1Wins = false;
    let p2Wins = false;

    if (m.s1 > m.s2) p1Wins = true;
    else if (m.s2 > m.s1) p2Wins = true;
    else {
        // Draw in score
        if (m.phase === 'tournament' && m.pk1 !== undefined && m.pk1 !== null && m.pk2 !== undefined && m.pk2 !== null) {
            if (m.pk1 > m.pk2) p1Wins = true;
            else if (m.pk2 > m.pk1) p2Wins = true;
        } 
    }

    if (p1Wins) {
      p1.wins++;
      p1.points += 3;
      p2.losses++;
    } else if (p2Wins) {
      p2.wins++;
      p2.points += 3;
      p1.losses++;
    } else {
      p1.draws++;
      p1.points += 1;
      p2.draws++;
      p2.points += 1;
    }
  };

  matches.forEach(m => {
    if (filter === 'all') processMatch(m);
    else if (filter === 'league' && m.phase === 'league') processMatch(m);
    else if (filter === 'tournament' && m.phase === 'tournament') processMatch(m);
  });

  return Object.values(stats).sort((a, b) => b.points - a.points || b.gf - a.gf);
};