import React, { useState, useEffect, useCallback } from 'react';
import { Player, Match, Standing, TournamentData } from './types';
import { getInitialLeagueMatches, PLAYERS_DEFAULT, calculateStandings } from './utils';
import { LeagueView } from './components/LeagueView';
import { TournamentView } from './components/TournamentView';
import { StatsView } from './components/StatsView';
import { LayoutDashboard, Sword, History, Save, RotateCcw } from 'lucide-react';

function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'league' | 'tournament' | 'stats'>('league');
  
  // Players
  const [players] = useState<string[]>(PLAYERS_DEFAULT);

  // Current Tournament State
  // Initialize with function to ensure new objects
  const [leagueMatches, setLeagueMatches] = useState<Match[]>(getInitialLeagueMatches);
  const [tournamentMatches, setTournamentMatches] = useState<Match[]>([
    { id: 'T1', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'semifinal' }, 
    { id: 'T2', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'prefinal' },  
    { id: 'T3', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'final' }      
  ]);
  const [tournamentWinner, setTournamentWinner] = useState<string | null>(null);
  const [isLeagueFinished, setIsLeagueFinished] = useState(false);

  // History Archive
  const [history, setHistory] = useState<TournamentData[]>(() => {
    try {
      const saved = localStorage.getItem('tournament_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // --- Effects & Logic ---

  // Update Player in Match
  const handlePlayerUpdate = useCallback((id: string, position: 'p1' | 'p2', value: string) => {
    setLeagueMatches(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, [position]: value };
      }
      return m;
    }));
  }, []);

  // Update Score Handler - Fixed to prevent NaN
  const handleScoreUpdate = useCallback((id: string, s1Str: string, s2Str: string, type: 'league' | 'tournament') => {
    const parseScore = (val: string) => {
        if (val === '') return null;
        const num = parseInt(val, 10);
        return isNaN(num) ? null : num;
    };

    const s1 = parseScore(s1Str);
    const s2 = parseScore(s2Str);

    if (type === 'league') {
      setLeagueMatches(prev => prev.map(m => {
        if (m.id === id) {
          return { ...m, s1, s2, isCompleted: s1 !== null && s2 !== null };
        }
        return m;
      }));
    } else {
      setTournamentMatches(prev => prev.map(m => {
        if (m.id === id) {
          // If score changes, reset completion status to allow re-confirmation manually
          return { ...m, s1, s2, isCompleted: false }; 
        }
        return m;
      }));
    }
  }, []);

  const handlePkUpdate = useCallback((id: string, pk1Str: string, pk2Str: string) => {
    const parseScore = (val: string) => {
        if (val === '') return null;
        const num = parseInt(val, 10);
        return isNaN(num) ? null : num;
    };
    
    const pk1 = parseScore(pk1Str);
    const pk2 = parseScore(pk2Str);
    
    setTournamentMatches(prev => prev.map(m => {
        if (m.id === id) {
            return { ...m, pk1, pk2, isCompleted: false };
        }
        return m;
    }));
  }, []);

  // Confirm Tournament Match Result & Advance Winner
  const handleConfirmMatch = useCallback((id: string) => {
    setTournamentMatches(prev => {
        const matchIndex = prev.findIndex(m => m.id === id);
        if (matchIndex === -1) return prev;

        const match = prev[matchIndex];
        
        // Validation
        if (match.s1 === null || match.s2 === null) {
            alert("스코어를 입력해주세요.");
            return prev;
        }

        // Determine Winner
        let winner: string | null = null;
        if (match.s1 > match.s2) winner = match.p1;
        else if (match.s2 > match.s1) winner = match.p2;
        else {
            // Draw
            if (match.pk1 === null || match.pk2 === null) {
                alert("무승부입니다. 승부차기(PK) 점수를 입력해주세요.");
                return prev;
            }
            if (match.pk1 === match.pk2) {
                 alert("승부차기 점수가 동률입니다. 승자가 결정되어야 합니다.");
                 return prev;
            }
            winner = match.pk1 > match.pk2 ? match.p1 : match.p2;
        }

        if (!winner) return prev;

        // Create new matches array
        const newMatches = [...prev];
        // Mark current as completed (locked)
        newMatches[matchIndex] = { ...match, isCompleted: true };

        // Advance to next round
        const standings = calculateStandings(players, leagueMatches);

        if (match.tournamentRound === 'semifinal') {
            // Winner goes to T2 (prefinal) vs Rank 2
            newMatches[1].p1 = winner;
            newMatches[1].p2 = standings.find(s => s.rank === 2)?.name || 'TBD';
            // Reset next matches
            newMatches[1].s1 = null; newMatches[1].s2 = null; newMatches[1].pk1 = null; newMatches[1].pk2 = null; newMatches[1].isCompleted = false;
            newMatches[2].p1 = 'TBD'; newMatches[2].p2 = 'TBD'; newMatches[2].s1 = null; newMatches[2].s2 = null; newMatches[2].isCompleted = false;

        } else if (match.tournamentRound === 'prefinal') {
            // Winner goes to T3 (final) vs Rank 1
            newMatches[2].p1 = winner;
            newMatches[2].p2 = standings.find(s => s.rank === 1)?.name || 'TBD';
            newMatches[2].s1 = null; newMatches[2].s2 = null; newMatches[2].pk1 = null; newMatches[2].pk2 = null; newMatches[2].isCompleted = false;
        } 
        // For final round, we just mark completed. Winner is derived in handleTournamentFinish

        return newMatches;
    });
  }, [players, leagueMatches]);

  // Unlock/Reset a match
  const handleResetMatch = useCallback((id: string) => {
    setTournamentMatches(prev => {
        return prev.map(m => {
            if (m.id === id) return { ...m, isCompleted: false };
            return m;
        });
    });
  }, []);


  const handleFinalizeLeague = useCallback(() => {
      const standings = calculateStandings(players, leagueMatches);
      // Rank 3 vs Rank 4
      const p3 = standings.find(s => s.rank === 3)?.name || 'TBD';
      const p4 = standings.find(s => s.rank === 4)?.name || 'TBD';
      
      // Initialize Tournament (and reset if it was already in progress to avoid inconsistent state)
      setTournamentMatches([
        { id: 'T1', p1: p3, p2: p4, s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'semifinal' }, 
        { id: 'T2', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'prefinal' },
        { id: 'T3', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'final' }
      ]);
      setTournamentWinner(null);
      setIsLeagueFinished(true);
      setActiveTab('tournament');
  }, [players, leagueMatches]);

  const handleUnlockLeague = useCallback(() => {
    if (confirm("리그 결과를 수정하시겠습니까?\n진행 중인 토너먼트 데이터는 초기화됩니다.")) {
        setIsLeagueFinished(false);
        setTournamentWinner(null);
    }
  }, []);

  const handleTournamentFinish = useCallback(() => {
    const finalMatch = tournamentMatches.find(m => m.tournamentRound === 'final');
    if (finalMatch && finalMatch.s1 !== null && finalMatch.s2 !== null) {
       let winner: string | null = null;
       
       if (finalMatch.s1 > finalMatch.s2) winner = finalMatch.p1;
       else if (finalMatch.s2 > finalMatch.s1) winner = finalMatch.p2;
       else {
           // Draw check
           if (finalMatch.pk1 !== null && finalMatch.pk2 !== null) {
               if (finalMatch.pk1 > finalMatch.pk2) winner = finalMatch.p1;
               else if (finalMatch.pk2 > finalMatch.pk1) winner = finalMatch.p2;
           }
       }
       
       if (!winner) {
           alert("결승전 승자가 결정되지 않았습니다. 점수 또는 승부차기 결과를 확인해주세요.");
           return;
       }

       setTournamentWinner(winner);
    }
  }, [tournamentMatches]);

  const handleTournamentUndo = useCallback(() => {
      if(confirm("결승전 결과를 수정하시겠습니까? 우승자 정보가 취소됩니다.")) {
        setTournamentWinner(null);
        // Also unlock the final match
        setTournamentMatches(prev => prev.map(m => {
            if (m.tournamentRound === 'final') return { ...m, isCompleted: false };
            return m;
        }));
      }
  }, []);

  // Save & Reset
  const saveTournament = () => {
    if (!tournamentWinner) {
      alert("대회가 아직 끝나지 않았습니다. 우승자가 확정되어야 저장할 수 있습니다.");
      return;
    }

    // REMOVED CONFIRM DIALOG - Directly save to prevent blocking issues
    try {
        // Deep copy data to prevent reference issues during reset
        const currentLeagueMatches = JSON.parse(JSON.stringify(leagueMatches));
        const currentTournamentMatches = JSON.parse(JSON.stringify(tournamentMatches));

        const data: TournamentData = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            leagueMatches: currentLeagueMatches,
            tournamentMatches: currentTournamentMatches,
            standings: calculateStandings(players, currentLeagueMatches),
            winner: tournamentWinner,
            players: [...players]
        };

        const newHistory = [...history, data];
        setHistory(newHistory);
        localStorage.setItem('tournament_history', JSON.stringify(newHistory));

        // Reset
        setLeagueMatches(getInitialLeagueMatches());
        setTournamentMatches([
            { id: 'T1', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'semifinal' },
            { id: 'T2', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'prefinal' },
            { id: 'T3', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'final' }
        ]);
        setTournamentWinner(null);
        setIsLeagueFinished(false);
        
        // Immediate switch to stats tab
        setActiveTab('stats');
        
        // Optional feedback after switching
        setTimeout(() => alert("대회 결과가 기록실에 저장되었습니다!"), 100);

    } catch (e) {
        console.error("Save failed", e);
        alert("저장 중 치명적인 오류가 발생했습니다.");
    }
  };

  const resetCurrent = () => {
    if(!confirm("현재 진행중인 데이터를 초기화 하시겠습니까?")) return;
    setLeagueMatches(getInitialLeagueMatches());
    setTournamentMatches([
        { id: 'T1', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'semifinal' },
        { id: 'T2', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'prefinal' },
        { id: 'T3', p1: 'TBD', p2: 'TBD', s1: null, s2: null, pk1: null, pk2: null, isCompleted: false, phase: 'tournament', tournamentRound: 'final' }
    ]);
    setTournamentWinner(null);
    setIsLeagueFinished(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sword className="text-blue-500 w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight">절친쓰 피파 대회</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {tournamentWinner && (
                <button 
                onClick={saveTournament}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors animate-pulse shadow-emerald-900/50 shadow-lg"
                >
                <Save className="w-4 h-4" />
                대회 저장
                </button>
            )}
            <button onClick={resetCurrent} className="p-2 text-slate-400 hover:text-white transition-colors" title="초기화">
                <RotateCcw className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button
              onClick={() => setActiveTab('league')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'league' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              리그 페이즈
            </button>
            <button
              onClick={() => setActiveTab('tournament')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'tournament' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sword className="w-4 h-4" />
              토너먼트
              {isLeagueFinished && !tournamentWinner && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'stats' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              기록실
              {history.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">{history.length}</span>}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'league' && (
            <LeagueView 
              players={players} 
              matches={leagueMatches} 
              onUpdateScore={(id, s1, s2) => handleScoreUpdate(id, s1, s2, 'league')}
              onUpdatePlayer={handlePlayerUpdate}
              isLocked={isLeagueFinished}
              onFinalize={handleFinalizeLeague}
              onUnlock={handleUnlockLeague}
            />
          )}

          {activeTab === 'tournament' && (
            isLeagueFinished ? (
              <TournamentView 
                matches={tournamentMatches}
                standings={calculateStandings(players, leagueMatches)}
                onUpdateScore={(id, s1, s2) => handleScoreUpdate(id, s1, s2, 'tournament')}
                onUpdatePk={handlePkUpdate}
                onConfirmMatch={handleConfirmMatch}
                onResetMatch={handleResetMatch}
                tournamentWinner={tournamentWinner}
                onFinish={handleTournamentFinish}
                onUndo={handleTournamentUndo}
              />
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                    <Sword className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">토너먼트 대기 중</h3>
                    <p className="text-slate-500">리그 경기가 모두 종료되면 자동으로 대진표가 생성됩니다.</p>
                </div>
            )
          )}

          {activeTab === 'stats' && (
            <StatsView history={history} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;