import React, { useState, useEffect } from 'react';
import { X, Users, Target } from 'lucide-react';
import { Player, Match } from '../types/cricket';
import { PlayerSelector } from './PlayerSelector';
import { storageService } from '../services/storage';
import { authService } from '../services/authService';

interface InningsSetupModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: (striker: Player, nonStriker: Player, bowler: Player) => void;
  isSecondInnings?: boolean;
}

export const InningsSetupModal: React.FC<InningsSetupModalProps> = ({
  match,
  isOpen,
  onClose,
  onSetupComplete,
  isSecondInnings = false
}) => {
  const [striker, setStriker] = useState<Player | null>(null);
  const [nonStriker, setNonStriker] = useState<Player | null>(null);
  const [bowler, setBowler] = useState<Player | null>(null);
  const [showPlayerSelector, setShowPlayerSelector] = useState<{
    type: 'striker' | 'nonStriker' | 'bowler';
    title: string;
  } | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPlayers();
    }
  }, [isOpen]);

  const loadPlayers = async () => {
    try {
      const players = await storageService.getAllPlayers();
      setAllPlayers(players);
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    if (!showPlayerSelector) return;

    switch (showPlayerSelector.type) {
      case 'striker':
        setStriker(player);
        break;
      case 'nonStriker':
        setNonStriker(player);
        break;
      case 'bowler':
        setBowler(player);
        break;
    }
    setShowPlayerSelector(null);
  };

  const getAvailablePlayers = (type: string): Player[] => {
    switch (type) {
      case 'striker':
      case 'nonStriker':
        return allPlayers.filter(p => 
          p.id !== striker?.id && 
          p.id !== nonStriker?.id
        );
      case 'bowler':
        return allPlayers.filter(p => 
          p.id !== striker?.id && 
          p.id !== nonStriker?.id
        );
      default:
        return allPlayers;
    }
  };

  const handleSetupComplete = () => {
    if (striker && nonStriker && bowler) {
      onSetupComplete(striker, nonStriker, bowler);
      // Reset selections
      setStriker(null);
      setNonStriker(null);
      setBowler(null);
    }
  };

  const canComplete = striker && nonStriker && bowler;
  const currentGroup = authService.getCurrentGroup();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {isSecondInnings ? 'Second Innings Setup' : 'First Innings Setup'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isSecondInnings && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-800">Target</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {match.firstInningsScore + 1} runs
              </div>
              <div className="text-sm text-blue-700">
                {match.bowlingTeam.name} needs {match.firstInningsScore + 1} runs to win
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Select Players
            </h3>

            {/* Striker Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Batsman (Striker)
              </label>
              <button
                onClick={() => setShowPlayerSelector({
                  type: 'striker',
                  title: 'Select Opening Batsman (Striker)'
                })}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  striker
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {striker ? striker.name : 'Select Striker'}
                  </div>
                  {striker && (
                    <div className="text-sm text-gray-600">
                      {striker.stats.runsScored} runs • {striker.stats.matchesPlayed} matches
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Non-Striker Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Batsman (Non-Striker)
              </label>
              <button
                onClick={() => setShowPlayerSelector({
                  type: 'nonStriker',
                  title: 'Select Opening Batsman (Non-Striker)'
                })}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  nonStriker
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {nonStriker ? nonStriker.name : 'Select Non-Striker'}
                  </div>
                  {nonStriker && (
                    <div className="text-sm text-gray-600">
                      {nonStriker.stats.runsScored} runs • {nonStriker.stats.matchesPlayed} matches
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Bowler Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Bowler
              </label>
              <button
                onClick={() => setShowPlayerSelector({
                  type: 'bowler',
                  title: 'Select Opening Bowler'
                })}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  bowler
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {bowler ? bowler.name : 'Select Bowler'}
                  </div>
                  {bowler && (
                    <div className="text-sm text-gray-600">
                      {bowler.stats.wicketsTaken} wickets • {bowler.stats.matchesPlayed} matches
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSetupComplete}
              disabled={!canComplete}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                canComplete
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Start {isSecondInnings ? 'Second Innings' : 'Match'}
            </button>
          </div>
        </div>
      </div>

      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <PlayerSelector
          title={showPlayerSelector.title}
          onPlayerSelect={handlePlayerSelect}
          onClose={() => setShowPlayerSelector(null)}
          players={getAvailablePlayers(showPlayerSelector.type)}
          allowAddPlayer={true}
          groupId={currentGroup?.id}
        />
      )}
    </div>
  );
};