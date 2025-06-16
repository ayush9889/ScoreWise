import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Target, Award, Users, Download, Upload, User, RefreshCw } from 'lucide-react';
import { Player, Match } from '../types/cricket';
import { PlayerDashboard } from './PlayerDashboard';
import { storageService } from '../services/storage';
import { CricketEngine } from '../services/cricketEngine';

interface DashboardProps {
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'batting' | 'bowling' | 'fielding' | 'matches'>('overview');
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [allPlayers, allMatches] = await Promise.all([
        storageService.getAllPlayers(),
        storageService.getAllMatches()
      ]);
      
      // Filter for group members and sort by recent activity
      const groupPlayers = allPlayers.filter(p => p.isGroupMember);
      setPlayers(groupPlayers);
      
      // Sort matches by most recent first
      const sortedMatches = allMatches.sort((a, b) => b.startTime - a.startTime);
      setMatches(sortedMatches);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    setSelectedPlayer(updatedPlayer);
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleExport = async () => {
    try {
      const data = await storageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cricket-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result as string;
        await storageService.importData(data);
        await loadData();
        alert('Data imported successfully!');
      } catch (error) {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (selectedPlayer) {
    return (
      <PlayerDashboard
        player={selectedPlayer}
        onBack={() => setSelectedPlayer(null)}
        onPlayerUpdate={handlePlayerUpdate}
      />
    );
  }

  // Leaderboard calculations with updated stats
  const topRunScorers = [...players]
    .filter(p => p.stats.matchesPlayed > 0)
    .sort((a, b) => b.stats.runsScored - a.stats.runsScored)
    .slice(0, 10);

  const topWicketTakers = [...players]
    .filter(p => p.stats.matchesPlayed > 0)
    .sort((a, b) => b.stats.wicketsTaken - a.stats.wicketsTaken)
    .slice(0, 10);

  const bestAverages = [...players]
    .filter(p => p.stats.timesOut > 0 && p.stats.matchesPlayed > 0)
    .sort((a, b) => CricketEngine.calculateBattingAverage(b.stats) - CricketEngine.calculateBattingAverage(a.stats))
    .slice(0, 10);

  const mostMOTM = [...players]
    .filter(p => p.stats.matchesPlayed > 0)
    .sort((a, b) => b.stats.motmAwards - a.stats.motmAwards)
    .slice(0, 10);

  const recentMatches = [...matches]
    .filter(m => m.isCompleted)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-green-600 hover:text-green-700 font-semibold"
        >
          ← Back to Home
        </button>
        
        <h1 className="font-bold text-xl text-gray-900">Group Dashboard</h1>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Export Data"
          >
            <Download className="w-5 h-5" />
          </button>
          <label className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer" title="Import Data">
            <Upload className="w-5 h-5" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{players.length}</div>
                <div className="text-sm text-gray-600">Active Players</div>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{matches.filter(m => m.isCompleted).length}</div>
                <div className="text-sm text-gray-600">Completed Matches</div>
              </div>
              <Trophy className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {players.reduce((sum, p) => sum + p.stats.runsScored, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Runs</div>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {players.reduce((sum, p) => sum + p.stats.wicketsTaken, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Wickets</div>
              </div>
              <Target className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'batting', label: 'Batting' },
            { id: 'bowling', label: 'Bowling' },
            { id: 'fielding', label: 'All-Round' },
            { id: 'matches', label: 'Matches' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Run Scorers */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Top Run Scorers
                </h3>
                <div className="space-y-3">
                  {topRunScorers.slice(0, 5).map((player, index) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">
                            Avg: {CricketEngine.calculateBattingAverage(player.stats)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{player.stats.runsScored}</div>
                        <div className="text-sm text-gray-500">{player.stats.matchesPlayed} matches</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Wicket Takers */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-red-600" />
                  Top Wicket Takers
                </h3>
                <div className="space-y-3">
                  {topWicketTakers.slice(0, 5).map((player, index) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">
                            Econ: {CricketEngine.calculateEconomyRate(player.stats)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{player.stats.wicketsTaken}</div>
                        <div className="text-sm text-gray-500">{player.stats.matchesPlayed} matches</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'batting' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Batting Leaderboard</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Player</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Runs</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Avg</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">SR</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">50s/100s</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">HS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topRunScorers.map((player) => (
                      <tr 
                        key={player.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                              {player.photoUrl ? (
                                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <span className="font-medium text-gray-900">{player.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{player.stats.runsScored}</td>
                        <td className="px-4 py-3 text-right">{CricketEngine.calculateBattingAverage(player.stats)}</td>
                        <td className="px-4 py-3 text-right">{CricketEngine.calculateStrikeRate(player.stats)}</td>
                        <td className="px-4 py-3 text-right">{player.stats.fifties}/{player.stats.hundreds}</td>
                        <td className="px-4 py-3 text-right">{player.stats.highestScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bowling' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bowling Leaderboard</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Player</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Wickets</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Avg</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Econ</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Best</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Overs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topWicketTakers.map((player) => (
                      <tr 
                        key={player.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                              {player.photoUrl ? (
                                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <span className="font-medium text-gray-900">{player.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{player.stats.wicketsTaken}</td>
                        <td className="px-4 py-3 text-right">{CricketEngine.calculateBowlingAverage(player.stats)}</td>
                        <td className="px-4 py-3 text-right">{CricketEngine.calculateEconomyRate(player.stats)}</td>
                        <td className="px-4 py-3 text-right">{player.stats.bestBowlingFigures}</td>
                        <td className="px-4 py-3 text-right">{Math.floor(player.stats.ballsBowled / 6)}.{player.stats.ballsBowled % 6}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'fielding' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All-Round Performance</h3>
              <div className="space-y-4">
                {mostMOTM.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="w-full border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">{player.stats.matchesPlayed} matches</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Award className="w-5 h-5 text-yellow-500 mr-1" />
                        <span className="font-bold text-yellow-600">{player.stats.motmAwards}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{player.stats.runsScored}</div>
                        <div className="text-gray-500">Runs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{player.stats.wicketsTaken}</div>
                        <div className="text-gray-500">Wickets</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{player.stats.catches + player.stats.runOuts}</div>
                        <div className="text-gray-500">Catches/RO</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Matches</h3>
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">
                        {match.team1.name} vs {match.team2.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(match.startTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{match.team1.name}</div>
                        <div>{match.team1.score}/{match.team1.wickets} ({match.team1.overs}.{match.team1.balls})</div>
                      </div>
                      <div>
                        <div className="font-medium">{match.team2.name}</div>
                        <div>{match.team2.score}/{match.team2.wickets} ({match.team2.overs}.{match.team2.balls})</div>
                      </div>
                    </div>
                    {match.isCompleted && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium text-green-600">Winner: {match.winner}</span>
                          </div>
                          {match.manOfTheMatch && (
                            <button
                              onClick={() => setSelectedPlayer(match.manOfTheMatch!)}
                              className="text-sm hover:text-yellow-600 transition-colors"
                            >
                              <span className="text-gray-600">MOTM: </span>
                              <span className="font-medium">{match.manOfTheMatch.name}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {recentMatches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No completed matches yet</p>
                    <p className="text-sm">Start playing matches to see statistics here</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};