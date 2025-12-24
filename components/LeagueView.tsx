import React, { useMemo } from 'react';
import { Match, Standing } from '../types';
import { calculateStandings } from '../utils';
import { Trophy, CheckCircle2, Circle, AlertTriangle, Lock, Unlock, ArrowRight, XCircle } from 'lucide-react';

interface LeagueViewProps {
  players: string[];
  matches: Match[];
  onUpdateScore: (id: string, s1: string, s2: string) => void;
  onUpdatePlayer: (id: string, position: 'p1' | 'p2', value: string) => void;
  isLocked: boolean;
  onFinalize: () => void;
  onUnlock: () => void;
}

export const LeagueView: React.FC<LeagueViewProps> = ({ 
  players, 
  matches, 
  onUpdateScore, 
  onUpdatePlayer, 
  isLocked,
  onFinalize,
  onUnlock
}) => {
  const standings = useMemo(() => calculateStandings(players, matches), [players, matches]);
  const rounds = [1, 2, 3];

  // Helper to check for player conflicts within a round (Existing)
  const getRoundConflicts = (round: number) => {
    const roundMatches = matches.filter(m => m.round === round);
    const counts: Record<string, number> = {};
    
    roundMatches.forEach(m => {
      if (m.p1) counts[m.p1] = (counts[m.p1] || 0) + 1;
      if (m.p2) counts[m.p2] = (counts[m.p2] || 0) + 1;
    });

    return Object.keys(counts).filter(name => counts[name] > 1);
  };

  // Helper to check for duplicate matchups across ALL rounds (New)
  const matchupConflicts = useMemo(() => {
    const seen = new Map<string, string[]>(); // Key: "P1-P2" (sorted), Value: [MatchID, MatchID]
    const conflicts = new Set<string>();

    matches.forEach(m => {
        if (!m.p1 || !m.p2) return;
        // Normalize key so "A vs B" is same as "B vs A"
        const key = [m.p1, m.p2].sort().join(' vs '); 
        
        if (!seen.has(key)) {
            seen.set(key, []);
        }
        seen.get(key)!.push(m.id);
    });

    seen.forEach((ids) => {
        if (ids.length > 1) {
            ids.forEach(id => conflicts.add(id));
        }
    });

    return conflicts;
  }, [matches]);

  // Check if all matches are completed and valid
  const allMatchesCompleted = matches.every(m => m.isCompleted);
  const hasRoundConflicts = rounds.some(r => getRoundConflicts(r).length > 0);
  const hasMatchupConflicts = matchupConflicts.size > 0;
  
  const canFinalize = allMatchesCompleted && !hasRoundConflicts && !hasMatchupConflicts;

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Standings Table - Sticky on Desktop */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden lg:sticky lg:top-8">
            <div className="bg-slate-900 p-4 flex items-center gap-2">
                <Trophy className="text-yellow-400 w-5 h-5" />
                <h2 className="text-white font-bold text-lg">실시간 순위</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                    <th className="px-3 py-3 text-left w-10">#</th>
                    <th className="px-3 py-3 text-left">이름</th>
                    <th className="px-3 py-3 text-center">경기</th>
                    <th className="px-3 py-3 text-center">승점</th>
                    <th className="px-3 py-3 text-center text-xs">득실</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {standings.map((team, idx) => (
                    <tr key={team.name} className={`${idx < 2 ? 'bg-blue-50/50' : ''} hover:bg-slate-50 transition-colors`}>
                        <td className="px-3 py-3 font-bold text-slate-400">
                            {idx + 1}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-800">{team.name}</td>
                        <td className="px-3 py-3 text-center text-slate-600">{team.played}</td>
                        <td className="px-3 py-3 text-center font-bold text-blue-600">{team.points}</td>
                        <td className="px-3 py-3 text-center text-slate-500">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            <div className="p-3 bg-slate-50 text-xs text-slate-400 border-t border-slate-100">
                순위 산정: 승점 > 득실차 > 상대전적 > 다득점
            </div>
            </div>
        </div>

        {/* Match List */}
        <div className="lg:col-span-2 space-y-6">
            {rounds.map(round => {
                const roundConflicts = getRoundConflicts(round);
                const hasRoundError = roundConflicts.length > 0;
                
                return (
                <div key={round} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-colors ${hasRoundError ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}>
                    <div className={`px-4 py-2 border-b flex items-center justify-between ${hasRoundError ? 'bg-red-50 border-red-200' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${hasRoundError ? 'text-red-700' : 'text-slate-700'}`}>{round} 세트</span>
                        {hasRoundError && <span className="text-xs text-red-600 flex items-center gap-1 font-bold"><AlertTriangle className="w-3 h-3"/> 같은 라운드 선수 중복</span>}
                    </div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">League Phase</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                    {matches.filter(m => m.round === round).map(match => {
                        const isP1RoundConflict = roundConflicts.includes(match.p1);
                        const isP2RoundConflict = roundConflicts.includes(match.p2);
                        const isMatchupConflict = matchupConflicts.has(match.id);
                        
                        const hasError = isMatchupConflict || isP1RoundConflict || isP2RoundConflict;

                        return (
                            <div key={match.id} className={`p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${isMatchupConflict ? 'bg-orange-50' : ''}`}>
                            {/* Player 1 Dropdown */}
                            <div className="flex items-center justify-end w-full sm:w-1/3 gap-3">
                                <select
                                value={match.p1}
                                onChange={(e) => onUpdatePlayer(match.id, 'p1', e.target.value)}
                                disabled={isLocked}
                                className={`w-32 bg-transparent text-right font-medium focus:ring-2 rounded border-none cursor-pointer outline-none appearance-none 
                                    ${!match.p1 ? 'text-slate-400' : 'text-slate-800'}
                                    ${(isP1RoundConflict || isMatchupConflict) ? 'text-red-600 ring-2 ring-red-500 bg-red-50' : 'focus:ring-blue-500'}
                                `}
                                style={{ direction: 'rtl' }}
                                >
                                <option value="" disabled>선수 선택</option>
                                {players.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                                </select>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                    <input 
                                    type="number" 
                                    min={0}
                                    value={match.s1 ?? ''}
                                    onChange={(e) => onUpdateScore(match.id, e.target.value, String(match.s2 ?? ''))}
                                    placeholder="-"
                                    disabled={isLocked}
                                    className="w-12 h-10 text-center text-xl font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100"
                                    />
                                    <span className="text-slate-400 font-bold">:</span>
                                    <input 
                                    type="number" 
                                    min={0}
                                    value={match.s2 ?? ''}
                                    onChange={(e) => onUpdateScore(match.id, String(match.s1 ?? ''), e.target.value)}
                                    placeholder="-"
                                    disabled={isLocked}
                                    className="w-12 h-10 text-center text-xl font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100"
                                    />
                                </div>
                                {isMatchupConflict && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> 중복 매치</span>}
                            </div>

                            {/* Player 2 Dropdown */}
                            <div className="flex items-center justify-start w-full sm:w-1/3 gap-3">
                                <select
                                    value={match.p2}
                                    onChange={(e) => onUpdatePlayer(match.id, 'p2', e.target.value)}
                                    disabled={isLocked}
                                    className={`w-32 bg-transparent text-left font-medium focus:ring-2 rounded border-none cursor-pointer outline-none appearance-none 
                                        ${!match.p2 ? 'text-slate-400' : 'text-slate-800'}
                                        ${(isP2RoundConflict || isMatchupConflict) ? 'text-red-600 ring-2 ring-red-500 bg-red-50' : 'focus:ring-blue-500'}
                                    `}
                                >
                                    <option value="" disabled>선수 선택</option>
                                    {players.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:absolute sm:right-8 flex items-center">
                                {match.isCompleted && !hasError ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                <Circle className="w-5 h-5 text-slate-200" />
                                )}
                            </div>
                            </div>
                        )
                    })}
                    </div>
                </div>
            )})}
        </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center pt-4 pb-8">
            {!isLocked ? (
                <button
                    onClick={onFinalize}
                    disabled={!canFinalize}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${
                        canFinalize 
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    {hasRoundConflicts 
                      ? '라운드 내 중복 선수가 있습니다' 
                      : hasMatchupConflicts 
                        ? '이미 진행된 대진(매치업)이 있습니다' 
                        : '리그 종료 및 토너먼트 시작'}
                    <ArrowRight className="w-5 h-5" />
                </button>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5" />
                        리그 페이즈가 종료되었습니다
                    </div>
                    <button
                        onClick={onUnlock}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-sm"
                    >
                        <Unlock className="w-4 h-4" />
                        결과 수정하기 (토너먼트 초기화)
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};