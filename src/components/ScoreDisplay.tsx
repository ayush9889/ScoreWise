import React from 'react';
import { Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { Match } from '../types/cricket';

interface ScoreDisplayProps {
  match: Match;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ match }) => {
  const formatOvers = (balls: number): string => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };

  const calculateRunRate = (runs: number, balls: number): string => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 6).toFixed(2);
  };

  const calculateRequiredRate = (): string | null => {
    if (!match.isSecondInnings || !match.firstInningsScore) return null;
    
    const target = match.firstInningsScore + 1;
    const remaining = target - match.battingTeam.score;
    const ballsLeft = (match.totalOvers * 6) - (match.battingTeam.overs * 6 + match.battingTeam.balls);
    
    if (ballsLeft <= 0) return '0.00';
    return ((remaining / ballsLeft) * 6).toFixed(2);
  };

  const requiredRate = calculateRequiredRate();
  const currentRate = calculateRunRate(match.battingTeam.score, match.battingTeam.overs * 6 + match.battingTeam.balls);

  return (
    <div className="glass-effect rounded-2xl shadow-premium p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 font-display truncate">
          {match.battingTeam.name} vs {match.bowlingTeam.name}
        </h2>
        <div className="flex items-center text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3 mr-1" />
          {match.isSecondInnings ? '2nd' : '1st'} Innings
        </div>
      </div>

      {/* Compact Main Score */}
      <div className="text-center mb-4">
        <div className="text-4xl font-black text-emerald-600 mb-2 font-display">
          {match.battingTeam.score}/{match.battingTeam.wickets}
        </div>
        <div className="text-lg text-gray-600 font-medium">
          {formatOvers(match.battingTeam.overs * 6 + match.battingTeam.balls)} / {match.totalOvers} overs
        </div>
      </div>

      {/* Compact Stats Row */}
      <div className={`grid gap-3 ${requiredRate ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-200">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Current</span>
          </div>
          <div className="text-xl font-black text-blue-700 font-display">{currentRate}</div>
        </div>

        {requiredRate && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-3 text-center border border-orange-200">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-orange-600 mr-1" />
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Required</span>
            </div>
            <div className="text-xl font-black text-orange-700 font-display">{requiredRate}</div>
          </div>
        )}
      </div>

      {/* Compact Extras */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="text-center bg-white/60 rounded-lg p-2">
          <div className="text-gray-500 text-xs font-medium">W</div>
          <div className="font-bold text-gray-800 text-sm">{match.battingTeam.extras.wides}</div>
        </div>
        <div className="text-center bg-white/60 rounded-lg p-2">
          <div className="text-gray-500 text-xs font-medium">NB</div>
          <div className="font-bold text-gray-800 text-sm">{match.battingTeam.extras.noBalls}</div>
        </div>
        <div className="text-center bg-white/60 rounded-lg p-2">
          <div className="text-gray-500 text-xs font-medium">B</div>
          <div className="font-bold text-gray-800 text-sm">{match.battingTeam.extras.byes}</div>
        </div>
        <div className="text-center bg-white/60 rounded-lg p-2">
          <div className="text-gray-500 text-xs font-medium">LB</div>
          <div className="font-bold text-gray-800 text-sm">{match.battingTeam.extras.legByes}</div>
        </div>
      </div>
    </div>
  );
};