import React from 'react';
import { Player, Ball } from '../types/cricket';
import { TrendingUp, Target, Clock, Zap, User } from 'lucide-react';

interface LiveStatsBarProps {
  player: Player;
  balls: Ball[];
  type: 'batsman' | 'bowler';
  isStriker?: boolean;
}

export const LiveStatsBar: React.FC<LiveStatsBarProps> = ({ 
  player, 
  balls, 
  type, 
  isStriker = false 
}) => {
  const calculateBatsmanStats = () => {
    const playerBalls = balls.filter(b => b.striker.id === player.id);
    const runs = playerBalls.reduce((sum, ball) => {
      if (!ball.isWide && !ball.isNoBall && !ball.isBye && !ball.isLegBye) {
        return sum + ball.runs;
      }
      return sum;
    }, 0);
    const ballsFaced = playerBalls.filter(b => !b.isWide && !b.isNoBall).length;
    const fours = playerBalls.filter(b => b.runs === 4 && !b.isWide && !b.isNoBall).length;
    const sixes = playerBalls.filter(b => b.runs === 6 && !b.isWide && !b.isNoBall).length;
    const strikeRate = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : '0.0';
    const dotBalls = playerBalls.filter(b => !b.isWide && !b.isNoBall && b.runs === 0).length;

    return { runs, ballsFaced, fours, sixes, strikeRate, dotBalls };
  };

  const calculateBowlerStats = () => {
    const bowlerBalls = balls.filter(b => b.bowler.id === player.id);
    const runs = bowlerBalls.reduce((sum, ball) => sum + ball.runs, 0);
    const ballsBowled = bowlerBalls.filter(b => !b.isWide && !b.isNoBall).length;
    const wickets = bowlerBalls.filter(b => b.isWicket && b.wicketType !== 'run_out').length;
    const dotBalls = bowlerBalls.filter(b => !b.isWide && !b.isNoBall && b.runs === 0).length;
    const economy = ballsBowled > 0 ? ((runs / ballsBowled) * 6).toFixed(2) : '0.00';
    const overs = Math.floor(ballsBowled / 6);
    const remainingBalls = ballsBowled % 6;

    return { runs, ballsBowled, wickets, dotBalls, economy, overs, remainingBalls };
  };

  if (type === 'batsman') {
    const stats = calculateBatsmanStats();
    
    return (
      <div className={`glass-effect rounded-2xl p-4 border-l-4 shadow-lg ${
        isStriker ? 'border-emerald-500 bg-emerald-50/50' : 'border-blue-500 bg-blue-50/50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-3 overflow-hidden">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 font-display">{player.name}</div>
              {isStriker && (
                <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                  <Zap className="w-3 h-3 mr-1" />
                  On Strike
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 font-display">{stats.runs}</div>
            <div className="text-xs text-gray-500 font-medium">runs</div>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-3 text-xs mb-3">
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.ballsFaced}</div>
            <div className="text-gray-500">balls</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.fours}</div>
            <div className="text-gray-500">4s</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.sixes}</div>
            <div className="text-gray-500">6s</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.dotBalls}</div>
            <div className="text-gray-500">dots</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.strikeRate}</div>
            <div className="text-gray-500">SR</div>
          </div>
        </div>

        {/* Progress Bar for Strike Rate */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span className="font-medium">Strike Rate</span>
            <span className="font-bold">{stats.strikeRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                parseFloat(stats.strikeRate) >= 150 ? 'bg-green-500' :
                parseFloat(stats.strikeRate) >= 120 ? 'bg-yellow-500' :
                parseFloat(stats.strikeRate) >= 100 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(parseFloat(stats.strikeRate), 200) / 2}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  } else {
    const stats = calculateBowlerStats();
    
    return (
      <div className="glass-effect rounded-2xl p-4 border-l-4 border-red-500 bg-red-50/50 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-3 overflow-hidden">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 font-display">{player.name}</div>
              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                <Target className="w-3 h-3 mr-1" />
                Bowling
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 font-display">{stats.overs}.{stats.remainingBalls}</div>
            <div className="text-xs text-gray-500 font-medium">overs</div>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-3 text-xs mb-3">
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.runs}</div>
            <div className="text-gray-500">runs</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.wickets}</div>
            <div className="text-gray-500">wickets</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.dotBalls}</div>
            <div className="text-gray-500">dots</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.economy}</div>
            <div className="text-gray-500">econ</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-700">{stats.ballsBowled}</div>
            <div className="text-gray-500">balls</div>
          </div>
        </div>

        {/* Progress Bar for Economy Rate */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span className="font-medium">Economy Rate</span>
            <span className="font-bold">{stats.economy}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                parseFloat(stats.economy) <= 4 ? 'bg-green-500' :
                parseFloat(stats.economy) <= 6 ? 'bg-yellow-500' :
                parseFloat(stats.economy) <= 8 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(parseFloat(stats.economy) * 8, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
};