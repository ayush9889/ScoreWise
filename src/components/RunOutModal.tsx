import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Match, Player } from '../types/cricket';
import { CricketEngine } from '../services/cricketEngine';

interface RunOutModalProps {
  match: Match;
  onComplete: (outBatsman: Player, newStriker: Player) => void;
  onClose: () => void;
}

export const RunOutModal: React.FC<RunOutModalProps> = ({
  match,
  onComplete,
  onClose
}) => {
  const [outBatsman, setOutBatsman] = useState<Player | null>(null);
  const [newStriker, setNewStriker] = useState<Player | null>(null);

  const handleComplete = () => {
    if (!outBatsman || !newStriker) {
      alert('Please select both the out batsman and new batsman');
      return;
    }

    onComplete(outBatsman, newStriker);
  };

  // Get available batsmen for new striker (excluding current batsmen)
  const availableBatsmen = CricketEngine.getAvailableBatsmen(match);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Run Out!</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Select which batsman is out and who will be the new striker
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Which batsman is out? */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Which batsman is out?
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setOutBatsman(match.currentStriker!)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  outBatsman?.id === match.currentStriker?.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="font-semibold text-gray-900">
                  {match.currentStriker?.name} (Striker)
                </div>
                <div className="text-sm text-gray-600">Currently on strike</div>
              </button>
              
              <button
                onClick={() => setOutBatsman(match.currentNonStriker!)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  outBatsman?.id === match.currentNonStriker?.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="font-semibold text-gray-900">
                  {match.currentNonStriker?.name} (Non-Striker)
                </div>
                <div className="text-sm text-gray-600">At non-striker's end</div>
              </button>
            </div>
          </div>

          {/* New batsman selection */}
          {outBatsman && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select new batsman (will be on strike)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableBatsmen.map((batsman) => (
                  <button
                    key={batsman.id}
                    onClick={() => setNewStriker(batsman)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      newStriker?.id === batsman.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{batsman.name}</div>
                    <div className="text-sm text-gray-600">
                      {batsman.stats.runsScored} runs • {batsman.stats.matchesPlayed} matches
                    </div>
                  </button>
                ))}
              </div>
              
              {availableBatsmen.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No more batsmen available</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={!outBatsman || !newStriker}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                outBatsman && newStriker
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirm Run Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};