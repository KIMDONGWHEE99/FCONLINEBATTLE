import React from 'react';
import { Match, Standing } from '../types';
import { Trophy, Medal, Crown, ArrowRight, RotateCcw, Check, Lock } from 'lucide-react';

interface TournamentViewProps {
  matches: Match[]; 
  standings: Standing[]; 
  onUpdateScore: (id: string, s1: string, s2: string) => void;
  onUpdatePk: (id: string, pk1: string, pk2: string) => void;
  onConfirmMatch: (id: string) => void;
  onResetMatch: (id: string) => void;
  tournamentWinner: string | null;
  onFinish: () => void;
  onUndo: () => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({ 
  matches, 
  standings, 
  onUpdateScore, 
  onUpdatePk,
  onConfirmMatch,
  onResetMatch,
  tournamentWinner,
  onFinish,
  onUndo
}) => {
  const m1 = matches.find(m => m.tournamentRound === 'semifinal');
  const m2 = matches.find(m => m.tournamentRound === 'prefinal');
  const m3 = matches.find(m => m.tournamentRound === 'final');

  const renderMatchCard = (match: Match | undefined, title: string, description: string, isActive: boolean) => {
    if (!match) return null;
    
    // Status
    const isCompleted = match.isCompleted; // In tournament, this now means "Confirmed"
    const isReady = match.p1 !== 'TBD' && match.p2 !== 'TBD';
    const isDraw = match.s1 !== null && match.s2 !== null && match.s1 === match.s2;
    
    // Input Logic
    const isDisabled = !isReady || isCompleted;

    return (
      <div className={`relative bg-white rounded-xl shadow-lg border-2 overflow-hidden transition-all duration-300 ${isActive ? 'border-blue-500 ring-2 ring-blue-100 scale-105 z-10' : 'border-slate-100 opacity-90'}`}>
        {/* Header */}
        <div className={`bg-gradient-to-r p-3 flex justify-between items-center ${isActive ? 'from-blue-600 to-blue-500 text-white' : 'from-slate-100 to-slate-200 text-slate-600'}`}>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
            <p className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{description}</p>
          </div>
          {isCompleted && <div className="bg-white/20 p-1 rounded-full"><Lock className="w-4 h-4" /></div>}
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Main Score Row */}
          <div className="flex items-center justify-between gap-4">
             {/* Player 1 */}
             <div className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-lg font-medium text-center leading-tight ${match.p1 === 'TBD' ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                    {match.p1}
                </span>
                <input 
                    type="number" 
                    min={0}
                    disabled={isDisabled} 
                    value={match.s1 ?? ''}
                    onChange={(e) => onUpdateScore(match.id, e.target.value, String(match.s2 ?? ''))}
                    className={`w-14 h-10 text-center text-lg font-bold border rounded-md outline-none focus:ring-2 ${
                        match.s1 !== null && match.s2 !== null && match.s1 > match.s2 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-white border-slate-200'
                    }`}
                    placeholder="-"
                />
             </div>

             <div className="text-xs font-bold text-slate-400">VS</div>

             {/* Player 2 */}
             <div className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-lg font-medium text-center leading-tight ${match.p2 === 'TBD' ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                    {match.p2}
                </span>
                <input 
                    type="number"
                    min={0} 
                    disabled={isDisabled}
                    value={match.s2 ?? ''}
                    onChange={(e) => onUpdateScore(match.id, String(match.s1 ?? ''), e.target.value)}
                    className={`w-14 h-10 text-center text-lg font-bold border rounded-md outline-none focus:ring-2 ${
                        match.s1 !== null && match.s2 !== null && match.s2 > match.s1 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-white border-slate-200'
                    }`}
                    placeholder="-"
                />
             </div>
          </div>

          {/* PK Section */}
          {isDraw && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                  <div className="text-center text-xs font-bold text-slate-500 mb-2">승부차기(PK)</div>
                  <div className="flex justify-center items-center gap-4">
                    <input 
                        type="number" 
                        min={0}
                        disabled={isDisabled}
                        value={match.pk1 ?? ''}
                        onChange={(e) => onUpdatePk(match.id, e.target.value, String(match.pk2 ?? ''))}
                        className="w-12 h-8 text-center text-sm font-bold border border-slate-300 rounded bg-white focus:border-blue-500 outline-none"
                        placeholder="PK"
                    />
                    <span className="text-slate-300 text-xs">:</span>
                    <input 
                        type="number" 
                        min={0}
                        disabled={isDisabled}
                        value={match.pk2 ?? ''}
                        onChange={(e) => onUpdatePk(match.id, String(match.pk1 ?? ''), e.target.value)}
                        className="w-12 h-8 text-center text-sm font-bold border border-slate-300 rounded bg-white focus:border-blue-500 outline-none"
                        placeholder="PK"
                    />
                  </div>
              </div>
          )}

          {/* Action Button */}
          {isReady && !isCompleted && !tournamentWinner && (
              <button 
                onClick={() => onConfirmMatch(match.id)}
                className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                결과 확정
              </button>
          )}

          {isCompleted && !tournamentWinner && (
              <button 
                onClick={() => onResetMatch(match.id)}
                className="w-full mt-2 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                수정하기
              </button>
          )}
        </div>
      </div>
    );
  };

  const canFinish = m3?.isCompleted && !tournamentWinner;

  return (
    <div className="space-y-12 py-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Stepladder Tournament</h2>
        <p className="text-slate-500">생존을 위한 서바이벌 매치 (4위 vs 3위 → 승자 vs 2위 → 승자 vs 1위)</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center justify-center relative">
         {/* Connector Lines (Desktop) */}
         <div className="hidden md:block absolute top-1/2 left-0 w-full h-2 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>

         {/* Step 1: 4th vs 3rd */}
         <div className="w-full md:w-80">
            {renderMatchCard(m1, "준플레이오프", "리그 3위 vs 리그 4위", !m1?.isCompleted)}
         </div>

         {/* Step 2: Winner vs 2nd */}
         <div className="w-full md:w-80 md:-mt-16">
            {renderMatchCard(m2, "플레이오프", "준PO 승자 vs 리그 2위", !!(m1?.isCompleted && !m2?.isCompleted))}
         </div>

         {/* Step 3: Winner vs 1st */}
         <div className="w-full md:w-80 md:-mt-32">
            {renderMatchCard(m3, "결승전", "PO 승자 vs 리그 1위", !!(m2?.isCompleted && !tournamentWinner))}
         </div>
      </div>

      {/* Manual Finish Button (Finalizing the Tournament Winner) */}
      {canFinish && (
        <div className="flex justify-center animate-in fade-in zoom-in duration-300">
            <button 
                onClick={onFinish}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
                <Crown className="w-5 h-5 text-yellow-400" />
                우승자 확정 및 대회 종료
            </button>
        </div>
      )}

      {tournamentWinner && (
        <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl text-center text-white transform animate-bounce-slow">
                <Crown className="w-16 h-16 mx-auto mb-4 text-white drop-shadow-md" />
                <h3 className="text-xl font-medium opacity-90">최종 우승</h3>
                <h1 className="text-4xl md:text-6xl font-black mt-2 drop-shadow-lg">{tournamentWinner}</h1>
                <p className="mt-4 text-white/80 font-medium">축하합니다!</p>
            </div>
            
            <div className="flex justify-center">
                <button 
                    onClick={onUndo}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    결과 수정하기
                </button>
            </div>
        </div>
      )}
    </div>
  );
};