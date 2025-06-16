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
    <div className="glass-effect rounded-3xl shadow-premium p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 font-display">
          {match.battingTeam.name} vs {match.bowlingTeam.name}
        </h2>
        <div className="flex items-center text-sm text-gray-600 bg-white/60 px-3 py-1 rounded-full">
          <Clock className="w-4 h-4 mr-1" />
          {match.isSecondInnings ? '2nd' : '1st'} Innings
        </div>
      </div>

      {/* Main Score */}
      <div className="text-center mb-8">
        <div className="text-5xl font-black text-emerald-600 mb-3 font-display">
          {match.battingTeam.score}/{match.battingTeam.wickets}
        </div>
        <div className="text-xl text-gray-600 font-medium">
          {formatOvers(match.battingTeam.overs * 6 + match.battingTeam.balls)} / {match.totalOvers} overs
        </div>
      </div>

      {/* Stats Row */}
      <div className={`grid gap-4 ${requiredRate ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 text-center border border-blue-200">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">Current Rate</span>
          </div>
          <div className="text-2xl font-black text-blue-700 font-display">{currentRate}</div>
        </div>

        {requiredRate && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 text-center border border-orange-200">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-sm font-bold text-orange-600 uppercase tracking-wide">Required</span>
            </div>
            <div className="text-2xl font-black text-orange-700 font-display">{requiredRate}</div>
          </div>
        )}
      </div>

      {/* Target Display - Only for Second Innings */}
      {match.isSecondInnings && match.firstInningsScore && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl text-center border border-purple-200">
          <div className="text-sm text-purple-600 font-bold uppercase tracking-wide mb-1">Target</div>
          <div className="text-2xl font-black text-purple-700 font-display mb-2">
            {match.firstInningsScore + 1} runs
          </div>
          <div className="text-sm text-purple-600 font-medium">
            {match.firstInningsScore + 1 - match.battingTeam.score} runs needed from{' '}
            {(match.totalOvers * 6) - (match.battingTeam.overs * 6 + match.battingTeam.balls)} balls
          </div>
        </div>
      )}

      {/* Extras */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        <div className="text-center bg-white/60 rounded-lg p-3">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">Wides</div>
          <div className="font-bold text-gray-800">{match.battingTeam.extras.wides}</div>
        </div>
        <div className="text-center bg-white/60 rounded-lg p-3">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">No Balls</div>
          <div className="font-bold text-gray-800">{match.battingTeam.extras.noBalls}</div>
        </div>
        <div className="text-center bg-white/60 rounded-lg p-3">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">Byes</div>
          <div className="font-bold text-gray-800">{match.battingTeam.extras.byes}</div>
        </div>
        <div className="text-center bg-white/60 rounded-lg p-3">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">Leg Byes</div>
          <div className="font-bold text-gray-800">{match.battingTeam.extras.legByes}</div>
        </div>
      </div>
    </div>
  );
};