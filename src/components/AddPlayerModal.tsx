import React, { useState } from 'react';
import { X, User, Camera, Plus } from 'lucide-react';
import { Player } from '../types/cricket';
import { storageService } from '../services/storage';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerAdded: (player: Player) => void;
  groupId?: string;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  onPlayerAdded,
  groupId
}) => {
  const [name, setName] = useState('');
  const [shortId, setShortId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const player: Player = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        shortId: shortId.trim() || undefined,
        photoUrl: photoUrl || undefined,
        isGroupMember: !!groupId,
        stats: {
          matchesPlayed: 0,
          runsScored: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          fifties: 0,
          hundreds: 0,
          highestScore: 0,
          timesOut: 0,
          wicketsTaken: 0,
          ballsBowled: 0,
          runsConceded: 0,
          catches: 0,
          runOuts: 0,
          motmAwards: 0,
          ducks: 0,
          dotBalls: 0,
          maidenOvers: 0,
          bestBowlingFigures: '0/0'
        }
      };

      await storageService.savePlayer(player);
      onPlayerAdded(player);
      
      // Reset form
      setName('');
      setShortId('');
      setPhotoUrl('');
      onClose();
    } catch (err) {
      setError('Failed to add player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Add New Player</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Photo Upload */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt="Player" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-green-600" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-2">Add player photo (optional)</p>
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter player's full name"
              required
            />
          </div>

          {/* Short ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short ID (Optional)
            </label>
            <input
              type="text"
              value={shortId}
              onChange={(e) => setShortId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., VK18, MS07"
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              A unique identifier for quick recognition
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};