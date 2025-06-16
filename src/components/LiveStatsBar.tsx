import React from 'react';
import { Player, Ball } from '../types/cricket';
import { TrendingUp, Target, User, Zap } from 'lucide-react';

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
      <div className={`glass-effect rounded-xl p-3 border-l-4 shadow-sm transition-all duration-200 ${
        isStriker 
          ? 'border-emerald-500 bg-emerald-50/50' 
          : 'border-blue-500 bg-blue-50/50'
      }`}>
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div className="font-bold text-gray-900 text-sm truncate font-display">{player.name}</div>
                {isStriker && (
                  <div className="ml-2 flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-bold">
                    <Zap className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">ON STRIKE</span>
                    <span className="sm:hidden">*</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Score */}
          <div className="text-right ml-3">
            <div className="text-xl font-black text-gray-900 font-display">{stats.runs}</div>
            <div className="text-xs text-gray-500 font-medium">({stats.ballsFaced})</div>
          </div>
        </div>
        
        {/* Compact Stats Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">4s:</span>
              <span className="font-bold text-green-600">{stats.fours}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">6s:</span>
              <span className="font-bold text-blue-600">{stats.sixes}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Dots:</span>
              <span className="font-bold text-red-600">{stats.dotBalls}</span>
            </div>
          </div>
          
          {/* Strike Rate with Mini Progress */}
          <div className="flex items-center">
            <TrendingUp className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-xs font-bold text-gray-700">{stats.strikeRate}</span>
            <div className="ml-2 w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${
                  parseFloat(stats.strikeRate) >= 150 ? 'bg-green-500' :
                  parseFloat(stats.strikeRate) >= 120 ? 'bg-yellow-500' :
                  parseFloat(stats.strikeRate) >= 100 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(parseFloat(stats.strikeRate), 200) / 2.5}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    const stats = calculateBowlerStats();
    
    return (
      <div className="glass-effect rounded-xl p-3 border-l-4 border-red-500 bg-red-50/50 shadow-sm transition-all duration-200">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div className="font-bold text-gray-900 text-sm truncate font-display">{player.name}</div>
                <div className="ml-2 flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">
                  <Target className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">BOWLING</span>
                  <span className="sm:hidden">B</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Stats */}
          <div className="text-right ml-3">
            <div className="text-xl font-black text-gray-900 font-display">{stats.overs}.{stats.remainingBalls}</div>
            <div className="text-xs text-gray-500 font-medium">{stats.wickets}-{stats.runs}</div>
          </div>
        </div>
        
        {/* Compact Stats Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Runs:</span>
              <span className="font-bold text-red-600">{stats.runs}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Wkts:</span>
              <span className="font-bold text-green-600">{stats.wickets}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Dots:</span>
              <span className="font-bold text-blue-600">{stats.dotBalls}</span>
            </div>
          </div>
          
          {/* Economy Rate with Mini Progress */}
          <div className="flex items-center">
            <Target className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-xs font-bold text-gray-700">{stats.economy}</span>
            <div className="ml-2 w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${
                  parseFloat(stats.economy) <= 4 ? 'bg-green-500' :
                  parseFloat(stats.economy) <= 6 ? 'bg-yellow-500' :
                  parseFloat(stats.economy) <= 8 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(parseFloat(stats.economy) * 10, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};