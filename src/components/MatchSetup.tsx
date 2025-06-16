import React, { useState, useEffect } from 'react';
import { Play, Users, Trophy } from 'lucide-react';
import { Match, Team, MatchFormat, MATCH_FORMATS, Player } from '../types/cricket';
import { InningsSetupModal } from './InningsSetupModal';

interface MatchSetupProps {
  onMatchStart: (match: Match) => void;
}

export const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchStart }) => {
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | ''>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | ''>('');
  const [selectedFormat, setSelectedFormat] = useState<MatchFormat>(MATCH_FORMATS[0]);
  const [customOvers, setCustomOvers] = useState(15);
  const [showInningsSetup, setShowInningsSetup] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);

  const canStartMatch = team1Name.trim() && team2Name.trim() && tossWinner && tossDecision;

  const handleCreateMatch = () => {
    if (!canStartMatch) return;

    const overs = selectedFormat.name === 'Custom' ? customOvers : selectedFormat.overs;

    const team1: Team = {
      name: team1Name.trim(),
      players: [],
      score: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      extras: { byes: 0, legByes: 0, wides: 0, noBalls: 0 }
    };

    const team2: Team = {
      name: team2Name.trim(),
      players: [],
      score: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      extras: { byes: 0, legByes: 0, wides: 0, noBalls: 0 }
    };

    const battingFirst = (tossWinner === 'team1' && tossDecision === 'bat') || 
                        (tossWinner === 'team2' && tossDecision === 'bowl');

    const newMatch: Match = {
      id: `match_${Date.now()}`,
      team1,
      team2,
      tossWinner: tossWinner === 'team1' ? team1Name : team2Name,
      tossDecision,
      currentInnings: 1,
      battingTeam: battingFirst ? team1 : team2,
      bowlingTeam: battingFirst ? team2 : team1,
      totalOvers: overs,
      balls: [],
      isCompleted: false,
      isSecondInnings: false,
      startTime: Date.now()
    };

    setMatch(newMatch);
    setShowInningsSetup(true);
  };

  const handleInningsSetup = (striker: Player, nonStriker: Player, bowler: Player) => {
    if (!match) return;

    const updatedMatch = { ...match };
    updatedMatch.currentStriker = striker;
    updatedMatch.currentNonStriker = nonStriker;
    updatedMatch.currentBowler = bowler;

    // Add players to their respective teams
    if (!updatedMatch.battingTeam.players.find(p => p.id === striker.id)) {
      updatedMatch.battingTeam.players.push(striker);
    }
    if (!updatedMatch.battingTeam.players.find(p => p.id === nonStriker.id)) {
      updatedMatch.battingTeam.players.push(nonStriker);
    }
    if (!updatedMatch.bowlingTeam.players.find(p => p.id === bowler.id)) {
      updatedMatch.bowlingTeam.players.push(bowler);
    }

    setShowInningsSetup(false);
    onMatchStart(updatedMatch);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cricket Scorer</h1>
          <p className="text-gray-600">Setup your match in seconds</p>
        </div>

        <div className="space-y-6">
          {/* Team Names */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Team 1 Name
              </label>
              <input
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter team name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Team 2 Name
              </label>
              <input
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter team name"
              />
            </div>
          </div>

          {/* Match Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Match Format</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {MATCH_FORMATS.map((format) => (
                <button
                  key={format.name}
                  onClick={() => setSelectedFormat(format)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedFormat.name === format.name
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{format.name}</div>
                  {format.overs > 0 && (
                    <div className="text-sm text-gray-500">{format.overs} overs</div>
                  )}
                </button>
              ))}
            </div>
            {selectedFormat.name === 'Custom' && (
              <input
                type="number"
                value={customOvers}
                onChange={(e) => setCustomOvers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Number of overs"
                min="1"
                max="50"
              />
            )}
          </div>

          {/* Toss */}
          {team1Name && team2Name && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Toss Winner</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTossWinner('team1')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tossWinner === 'team1'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {team1Name}
                  </button>
                  <button
                    onClick={() => setTossWinner('team2')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tossWinner === 'team2'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {team2Name}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Toss Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTossDecision('bat')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tossDecision === 'bat'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Bat First
                  </button>
                  <button
                    onClick={() => setTossDecision('bowl')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tossDecision === 'bowl'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Bowl First
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Start Match Button */}
          <button
            onClick={handleCreateMatch}
            disabled={!canStartMatch}
            className={`w-full py-4 rounded-xl font-semibold transition-all ${
              canStartMatch
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 inline mr-2" />
            Setup Players
          </button>
        </div>
      </div>

      {/* Innings Setup Modal */}
      {match && (
        <InningsSetupModal
          match={match}
          isOpen={showInningsSetup}
          onClose={() => setShowInningsSetup(false)}
          onSetupComplete={handleInningsSetup}
          isSecondInnings={false}
        />
      )}
    </div>
  );
};