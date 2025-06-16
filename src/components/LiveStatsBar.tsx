import React from 'react';
import { Player, Ball } from '../types/cricket';
import { TrendingUp, Target, Clock, Zap, User, Activity } from 'lucide-react';

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
      <div className={`glass-effect rounded-2xl p-5 border-l-4 shadow-lg transition-all duration-300 ${
        isStriker 
          ? 'border-emerald-500 bg-gradient-to-r from-emerald-50/80 to-green-50/80' 
          : 'border-blue-500 bg-gradient-to-r from-blue-50/80 to-indigo-50/80'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4 overflow-hidden shadow-sm">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 font-display text-lg">{player.name}</div>
              {isStriker && (
                <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-bold mt-1">
                  <Zap className="w-3 h-3 mr-1" />
                  ON STRIKE
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-gray-900 font-display">{stats.runs}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">runs</div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-gray-800 text-lg">{stats.ballsFaced}</div>
            <div className="text-xs text-gray-600 font-medium">balls</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-green-600 text-lg">{stats.fours}</div>
            <div className="text-xs text-gray-600 font-medium">4s</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-blue-600 text-lg">{stats.sixes}</div>
            <div className="text-xs text-gray-600 font-medium">6s</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-red-600 text-lg">{stats.dotBalls}</div>
            <div className="text-xs text-gray-600 font-medium">dots</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-purple-600 text-lg">{stats.strikeRate}</div>
            <div className="text-xs text-gray-600 font-medium">SR</div>
          </div>
        </div>

        {/* Strike Rate Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-600">Strike Rate</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{stats.strikeRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-700 ${
                parseFloat(stats.strikeRate) >= 150 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                parseFloat(stats.strikeRate) >= 120 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                parseFloat(stats.strikeRate) >= 100 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                'bg-gradient-to-r from-red-400 to-red-600'
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
      <div className="glass-effect rounded-2xl p-5 border-l-4 border-red-500 bg-gradient-to-r from-red-50/80 to-pink-50/80 shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4 overflow-hidden shadow-sm">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 font-display text-lg">{player.name}</div>
              <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold mt-1">
                <Target className="w-3 h-3 mr-1" />
                BOWLING
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-gray-900 font-display">{stats.overs}.{stats.remainingBalls}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">overs</div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-red-600 text-lg">{stats.runs}</div>
            <div className="text-xs text-gray-600 font-medium">runs</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-green-600 text-lg">{stats.wickets}</div>
            <div className="text-xs text-gray-600 font-medium">wickets</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-blue-600 text-lg">{stats.dotBalls}</div>
            <div className="text-xs text-gray-600 font-medium">dots</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-purple-600 text-lg">{stats.economy}</div>
            <div className="text-xs text-gray-600 font-medium">econ</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-2">
            <div className="font-bold text-orange-600 text-lg">{stats.ballsBowled}</div>
            <div className="text-xs text-gray-600 font-medium">balls</div>
          </div>
        </div>

        {/* Economy Rate Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Activity className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-600">Economy Rate</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{stats.economy}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-700 ${
                parseFloat(stats.economy) <= 4 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                parseFloat(stats.economy) <= 6 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                parseFloat(stats.economy) <= 8 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                'bg-gradient-to-r from-red-400 to-red-600'
              }`}
              style={{ width: `${Math.min(parseFloat(stats.economy) * 8, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
};