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
      <div className={`glass-effect rounded-xl p-3 border-l-4 shadow-lg transition-all duration-300 ${
        isStriker 
          ? 'border-emerald-500 bg-gradient-to-r from-emerald-50/80 to-green-50/80' 
          : 'border-blue-500 bg-gradient-to-r from-blue-50/80 to-indigo-50/80'
      }`}>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 font-display text-sm">{player.name}</div>
              {isStriker && (
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-bold">
                  <Zap className="w-2 h-2 mr-1" />
                  ON STRIKE
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900 font-display">{stats.runs}</div>
            <div className="text-xs text-gray-500 font-medium">runs</div>
          </div>
        </div>
        
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-gray-800 text-sm">{stats.ballsFaced}</div>
            <div className="text-xs text-gray-600">balls</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-green-600 text-sm">{stats.fours}</div>
            <div className="text-xs text-gray-600">4s</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-blue-600 text-sm">{stats.sixes}</div>
            <div className="text-xs text-gray-600">6s</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-red-600 text-sm">{stats.dotBalls}</div>
            <div className="text-xs text-gray-600">dots</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-purple-600 text-sm">{stats.strikeRate}</div>
            <div className="text-xs text-gray-600">SR</div>
          </div>
        </div>

        {/* Compact Strike Rate Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">Strike Rate</span>
            <span className="text-xs font-bold text-gray-800">{stats.strikeRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-700 ${
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
      <div className="glass-effect rounded-xl p-3 border-l-4 border-red-500 bg-gradient-to-r from-red-50/80 to-pink-50/80 shadow-lg transition-all duration-300">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 font-display text-sm">{player.name}</div>
              <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">
                <Target className="w-2 h-2 mr-1" />
                BOWLING
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900 font-display">{stats.overs}.{stats.remainingBalls}</div>
            <div className="text-xs text-gray-500 font-medium">overs</div>
          </div>
        </div>
        
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-red-600 text-sm">{stats.runs}</div>
            <div className="text-xs text-gray-600">runs</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-green-600 text-sm">{stats.wickets}</div>
            <div className="text-xs text-gray-600">wkts</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-blue-600 text-sm">{stats.dotBalls}</div>
            <div className="text-xs text-gray-600">dots</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-purple-600 text-sm">{stats.economy}</div>
            <div className="text-xs text-gray-600">econ</div>
          </div>
          <div className="text-center bg-white/60 rounded-lg p-1">
            <div className="font-bold text-orange-600 text-sm">{stats.ballsBowled}</div>
            <div className="text-xs text-gray-600">balls</div>
          </div>
        </div>

        {/* Compact Economy Rate Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">Economy Rate</span>
            <span className="text-xs font-bold text-gray-800">{stats.economy}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-700 ${
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