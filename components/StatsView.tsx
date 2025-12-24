import React, { useState, useMemo } from 'react';
import { TournamentData, AggregatedStats, Match, Standing } from '../types';
import { getAggregatedStats } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, FileBarChart, ArrowUpDown, ArrowUp, ArrowDown, X, Trophy, Swords } from 'lucide-react';

interface StatsViewProps {
  history: TournamentData[];
}

// --- Helper Components ---

const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => {
  if (!active) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1" />;
  return direction === 'asc' ? (
    <ArrowUp className="w-3 h-3 text-blue-600 ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 text-blue-600 ml-1" />
  );
};

// --- Modal Components ---

const PlayerDetailModal = ({ 
    player, 
    matches, 
    onClose 
}: { 
    player: string; 
    matches: Match[]; 
    onClose: () => void; 
}) => {
    const [filter, setFilter] = useState<'all' | 'league' | 'tournament'>('all');

    const h2hStats = useMemo(() => {
        const stats: Record<string, { played: number, wins: number, draws: number, losses: number, gf: number, ga: number }> = {};
        
        matches.forEach(m => {
            if (!m.isCompleted && (m.s1 === null || m.s2 === null)) return;
            
            // Filter Logic
            if (filter === 'league' && m.phase !== 'league') return;
            if (filter === 'tournament' && m.phase !== 'tournament') return;

            // Check if player is involved
            if (m.p1 !== player && m.p2 !== player) return;
            
            const isP1 = m.p1 === player;
            const opponent = isP1 ? m.p2 : m.p1;
            
            if (opponent === 'TBD' || !opponent) return;

            if (!stats[opponent]) {
                stats[opponent] = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
            }

            const s = stats[opponent];
            const myScore = isP1 ? m.s1! : m.s2!;
            const opScore = isP1 ? m.s2! : m.s1!;
            
            s.played++;
            s.gf += myScore;
            s.ga += opScore;

            // Win/Loss/Draw Logic
            let iWon = false;
            let iLost = false;

            if (myScore > opScore) iWon = true;
            else if (opScore > myScore) iLost = true;
            else {
                // Draw check (PK)
                 if (m.phase === 'tournament' && m.pk1 !== null && m.pk2 !== null) {
                     const myPk = isP1 ? m.pk1 : m.pk2;
                     const opPk = isP1 ? m.pk2 : m.pk1;
                     if (myPk > opPk) iWon = true;
                     else if (opPk > myPk) iLost = true;
                 }
            }

            if (iWon) s.wins++;
            else if (iLost) s.losses++;
            else s.draws++;
        });

        return Object.entries(stats)
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.played - a.played); // Sort by most played
    }, [player, matches, filter]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Swords className="w-5 h-5 text-blue-400" />
                        <h3 className="font-bold text-lg">{player} 선수 상대전적</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 border-b bg-slate-50 flex gap-2 shrink-0">
                    {(['all', 'league', 'tournament'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                filter === f 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'bg-white text-slate-500 border hover:bg-slate-100'
                            }`}
                        >
                            {f === 'all' ? '전체' : f === 'league' ? '리그' : '토너먼트'}
                        </button>
                    ))}
                </div>

                <div className="p-4 overflow-y-auto">
                    {h2hStats.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">전적 기록이 없습니다.</div>
                    ) : (
                        <table className="w-full text-sm text-center">
                            <thead className="bg-slate-50 text-slate-500 font-semibold">
                                <tr>
                                    <th className="py-2 px-2 text-left">상대</th>
                                    <th className="py-2 px-2">전적</th>
                                    <th className="py-2 px-2 text-blue-600">승</th>
                                    <th className="py-2 px-2 text-slate-500">무</th>
                                    <th className="py-2 px-2 text-red-500">패</th>
                                    <th className="py-2 px-2">승률</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {h2hStats.map(stat => {
                                    const winRate = stat.played > 0 ? Math.round((stat.wins / stat.played) * 100) : 0;
                                    return (
                                        <tr key={stat.name} className="hover:bg-slate-50">
                                            <td className="py-3 px-2 text-left font-bold text-slate-700">{stat.name}</td>
                                            <td className="py-3 px-2">{stat.played}전</td>
                                            <td className="py-3 px-2 font-bold text-blue-600">{stat.wins}</td>
                                            <td className="py-3 px-2 text-slate-500">{stat.draws}</td>
                                            <td className="py-3 px-2 text-red-500">{stat.losses}</td>
                                            <td className="py-3 px-2 font-medium">{winRate}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const TournamentDetailModal = ({ data, onClose }: { data: TournamentData; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <div>
                            <h3 className="font-bold text-lg">대회 상세 기록</h3>
                            <p className="text-xs text-slate-400 font-normal">{new Date(data.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8">
                    {/* Final Result */}
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <span className="text-sm text-blue-600 font-bold uppercase tracking-wider">Champion</span>
                        <h2 className="text-3xl font-black text-slate-900 mt-1">{data.winner}</h2>
                    </div>

                    {/* League Table */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-slate-800 rounded-full"></span>
                            리그 순위표
                        </h4>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                    <tr>
                                        <th className="px-3 py-2 text-left w-10">#</th>
                                        <th className="px-3 py-2 text-left">이름</th>
                                        <th className="px-3 py-2 text-center">승점</th>
                                        <th className="px-3 py-2 text-center">승</th>
                                        <th className="px-3 py-2 text-center">무</th>
                                        <th className="px-3 py-2 text-center">패</th>
                                        <th className="px-3 py-2 text-center">득실</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.standings.map((team, idx) => (
                                        <tr key={team.name} className={idx === 0 ? "bg-yellow-50/50" : ""}>
                                            <td className="px-3 py-2 font-bold text-slate-400">{team.rank}</td>
                                            <td className="px-3 py-2 font-medium">{team.name}</td>
                                            <td className="px-3 py-2 text-center font-bold text-blue-600">{team.points}</td>
                                            <td className="px-3 py-2 text-center">{team.won}</td>
                                            <td className="px-3 py-2 text-center">{team.drawn}</td>
                                            <td className="px-3 py-2 text-center">{team.lost}</td>
                                            <td className="px-3 py-2 text-center">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tournament Matches */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                            토너먼트 결과
                        </h4>
                        <div className="space-y-3">
                            {data.tournamentMatches.map((m) => {
                                const title = m.tournamentRound === 'semifinal' ? '준플레이오프 (4위 vs 3위)' : 
                                              m.tournamentRound === 'prefinal' ? '플레이오프 (승자 vs 2위)' : '결승전 (승자 vs 1위)';
                                return (
                                    <div key={m.id} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-sm">
                                        <div className="text-xs font-bold text-slate-400 uppercase w-32">{title}</div>
                                        <div className="flex-1 flex justify-center items-center gap-4 font-bold text-slate-800">
                                            <span className={m.s1! > m.s2! ? "text-blue-600" : ""}>{m.p1}</span>
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg bg-slate-100 px-2 rounded">{m.s1} : {m.s2}</span>
                                                {m.pk1 !== null && <span className="text-[10px] text-slate-500 mt-1">PK {m.pk1}:{m.pk2}</span>}
                                            </div>
                                            <span className={m.s2! > m.s1! ? "text-blue-600" : ""}>{m.p2}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main StatsView ---

export const StatsView: React.FC<StatsViewProps> = ({ history }) => {
  const [filter, setFilter] = useState<'all' | 'league' | 'tournament'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'points', direction: 'desc' });
  
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<TournamentData | null>(null);

  // Aggregate all matches from history
  const allMatches = useMemo(() => {
    return history.flatMap(t => [...t.leagueMatches, ...t.tournamentMatches]);
  }, [history]);

  const rawStats = useMemo(() => {
    return getAggregatedStats(allMatches, filter);
  }, [allMatches, filter]);

  const sortedStats = useMemo(() => {
    const sorted = [...rawStats];
    sorted.sort((a, b) => {
        let aValue: number = 0;
        let bValue: number = 0;
        
        switch(sortConfig.key) {
            case 'name': return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            case 'matches': aValue = a.matches; bValue = b.matches; break;
            case 'wins': aValue = a.wins; bValue = b.wins; break;
            case 'draws': aValue = a.draws; bValue = b.draws; break;
            case 'losses': aValue = a.losses; bValue = b.losses; break;
            case 'gf': aValue = a.gf; bValue = b.gf; break;
            case 'ga': aValue = a.ga; bValue = b.ga; break;
            case 'winRate': 
                aValue = a.matches ? (a.wins / a.matches) : 0;
                bValue = b.matches ? (b.wins / b.matches) : 0;
                break;
            default: // points
                aValue = a.points; bValue = b.points;
        }

        if (sortConfig.key !== 'name') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });
    return sorted;
  }, [rawStats, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
        key,
        direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
        <FileBarChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">기록된 데이터가 없습니다.</h3>
        <p className="text-slate-500">대회를 완료하고 데이터를 저장하면 이곳에 통계가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-slate-800">역대 기록실</h2>
            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">
                총 {history.length}회 대회
            </span>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-lg">
          {(['all', 'league', 'tournament'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === f 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? '전체' : f === 'league' ? '리그' : '토너먼트'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 text-left">선수 (상대전적)</th>
                <th className="px-4 py-4 text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('matches')}>
                    <div className="flex items-center justify-center">경기수 <SortIcon active={sortConfig.key === 'matches'} direction={sortConfig.direction} /></div>
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:bg-slate-100 text-blue-600" onClick={() => handleSort('wins')}>
                    <div className="flex items-center justify-center">승 <SortIcon active={sortConfig.key === 'wins'} direction={sortConfig.direction} /></div>
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:bg-slate-100 text-slate-500" onClick={() => handleSort('draws')}>
                    <div className="flex items-center justify-center">무 <SortIcon active={sortConfig.key === 'draws'} direction={sortConfig.direction} /></div>
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:bg-slate-100 text-red-500" onClick={() => handleSort('losses')}>
                    <div className="flex items-center justify-center">패 <SortIcon active={sortConfig.key === 'losses'} direction={sortConfig.direction} /></div>
                </th>
                <th className="px-4 py-4 text-center hidden sm:table-cell cursor-pointer hover:bg-slate-100" onClick={() => handleSort('gf')}>
                    <div className="flex items-center justify-center">득점 <SortIcon active={sortConfig.key === 'gf'} direction={sortConfig.direction} /></div>
                </th>
                <th className="px-4 py-4 text-center hidden sm:table-cell cursor-pointer hover:bg-slate-100" onClick={() => handleSort('ga')}>
                    <div className="flex items-center justify-center">실점 <SortIcon active={sortConfig.key === 'ga'} direction={sortConfig.direction} /></div>
                </th>
                <th className="px-4 py-4 text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('winRate')}>
                    <div className="flex items-center justify-center">승률 <SortIcon active={sortConfig.key === 'winRate'} direction={sortConfig.direction} /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStats.map((p) => {
                const winRate = p.matches > 0 ? Math.round((p.wins / p.matches) * 100) : 0;
                return (
                  <tr key={p.name} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 text-base">
                        <button 
                            onClick={() => setSelectedPlayer(p.name)}
                            className="font-bold text-slate-800 hover:text-blue-600 hover:underline flex items-center gap-1"
                        >
                            {p.name}
                            <Swords className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </button>
                    </td>
                    <td className="px-4 py-3 text-center">{p.matches}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">{p.wins}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{p.draws}</td>
                    <td className="px-4 py-3 text-center text-red-500">{p.losses}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">{p.gf}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">{p.ga}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${winRate}%` }}></div>
                        </div>
                        <span className="text-xs font-medium w-8">{winRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6">다득점 현황</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}} 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="gf" name="득점" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6">승점 획득 현황 ({filter === 'all' ? '통합' : filter === 'league' ? '리그' : '토너먼트'})</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}} 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="points" name="승점" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>
      </div>
      
      {/* History Log */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            대회 로그 <span className="text-xs font-normal text-slate-400 ml-2">(클릭하여 상세 조회)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.slice().reverse().map(h => (
                <div 
                    key={h.id} 
                    onClick={() => setSelectedHistory(h)}
                    className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            우승: {h.winner}
                        </span>
                        <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div>참가: {h.players.join(', ')}</div>
                </div>
            ))}
        </div>
      </div>

      {/* Modals */}
      {selectedPlayer && (
        <PlayerDetailModal 
            player={selectedPlayer} 
            matches={allMatches} 
            onClose={() => setSelectedPlayer(null)} 
        />
      )}

      {selectedHistory && (
        <TournamentDetailModal 
            data={selectedHistory} 
            onClose={() => setSelectedHistory(null)} 
        />
      )}

    </div>
  );
};