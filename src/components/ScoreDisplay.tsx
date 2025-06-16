import React from 'react';
import { Clock, Target, TrendingUp } from 'lucide-react';
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
    if (match.currentInnings === 1) return null;
    
    const target = match.team1.score + 1;
    const remaining = target - match.battingTeam.score;
    const ballsLeft = (match.totalOvers * 6) - (match.battingTeam.overs * 6 + match.battingTeam.balls);
    
    if (ballsLeft <= 0) return '0.00';
    return ((remaining / ballsLeft) * 6).toFixed(2);
  };

  const requiredRate = calculateRequiredRate();
  const currentRate = calculateRunRate(match.battingTeam.score, match.battingTeam.overs * 6 + match.battingTeam.balls);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {match.battingTeam.name} vs {match.bowlingTeam.name}
        </h2>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-1" />
          {match.currentInnings === 1 ? '1st' : '2nd'} Innings
        </div>
      </div>

      {/* Main Score */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-green-600 mb-2">
          {match.battingTeam.score}/{match.battingTeam.wickets}
        </div>
        <div className="text-lg text-gray-600">
          {formatOvers(match.battingTeam.overs * 6 + match.battingTeam.balls)} / {match.totalOvers} overs
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
            <span className="text-sm font-medium text-blue-600">Run Rate</span>
          </div>
          <div className="text-lg font-bold text-blue-700">{currentRate}</div>
        </div>

        {requiredRate && (
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-orange-600 mr-1" />
              <span className="text-sm font-medium text-orange-600">Required</span>
            </div>
            <div className="text-lg font-bold text-orange-700">{requiredRate}</div>
          </div>
        )}
      </div>

      {/* Target Display */}
      {match.currentInnings === 2 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-sm text-gray-600">Target</div>
          <div className="text-xl font-bold text-gray-900">
            {match.team1.score + 1} runs
          </div>
          <div className="text-sm text-gray-600">
            {match.team1.score + 1 - match.battingTeam.score} runs needed from{' '}
            {(match.totalOvers * 6) - (match.battingTeam.overs * 6 + match.battingTeam.balls)} balls
          </div>
        </div>
      )}

      {/* Extras */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        <div className="text-center">
          <div className="text-gray-500">Wides</div>
          <div className="font-semibold">{match.battingTeam.extras.wides}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">No Balls</div>
          <div className="font-semibold">{match.battingTeam.extras.noBalls}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Byes</div>
          <div className="font-semibold">{match.battingTeam.extras.byes}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Leg Byes</div>
          <div className="font-semibold">{match.battingTeam.extras.legByes}</div>
        </div>
      </div>
    </div>
  );
};