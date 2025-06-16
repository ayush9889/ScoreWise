import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, User, Camera, X, Phone, Mail } from 'lucide-react';
import { Player } from '../types/cricket';
import { storageService } from '../services/storage';
import { authService } from '../services/authService';

interface PlayerSelectorProps {
  onPlayerSelect: (player: Player) => void;
  onClose: () => void;
  title: string;
  excludePlayerIds?: string[];
  players: Player[];
  showOnlyAvailable?: boolean;
  allowAddPlayer?: boolean;
  groupId?: string;
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  onPlayerSelect,
  onClose,
  title,
  excludePlayerIds = [],
  players,
  showOnlyAvailable = false,
  allowAddPlayer = true,
  groupId
}) => {
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>(players);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerShortId, setNewPlayerShortId] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update filtered players when search term or players change
  useEffect(() => {
    let filtered = players.filter(player => 
      !excludePlayerIds.includes(player.id) &&
      (player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (player.shortId && player.shortId.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    // Sort players: group members first, then by name
    filtered.sort((a, b) => {
      if (a.isGroupMember && !b.isGroupMember) return -1;
      if (!a.isGroupMember && b.isGroupMember) return 1;
      return a.name.localeCompare(b.name);
    });

    setFilteredPlayers(filtered);
  }, [players, searchTerm, excludePlayerIds]);

  // Auto-suggest based on first letter
  useEffect(() => {
    if (searchTerm.length === 1) {
      const suggestions = players.filter(player => 
        player.name.toLowerCase().startsWith(searchTerm.toLowerCase()) &&
        !excludePlayerIds.includes(player.id)
      );
      setFilteredPlayers(suggestions);
    }
  }, [searchTerm, players, excludePlayerIds]);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const player: Player = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newPlayerName.trim(),
        shortId: newPlayerShortId.trim() || undefined,
        photoUrl: selectedPhoto || undefined,
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
      
      // If we have a group and phone number, try to invite them
      if (groupId && newPlayerPhone.trim()) {
        try {
          await authService.inviteToGroup(groupId, undefined, newPlayerPhone.trim());
        } catch (inviteError) {
          console.warn('Failed to send invitation:', inviteError);
          // Don't fail the player creation if invitation fails
        }
      }

      onPlayerSelect(player);
      
      // Reset form
      setNewPlayerName('');
      setNewPlayerShortId('');
      setNewPlayerPhone('');
      setSelectedPhoto(null);
      setShowAddPlayer(false);
      setShowQuickAdd(false);
    } catch (err) {
      setError('Failed to add player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const player: Player = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newPlayerName.trim(),
        isGroupMember: false,
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
      onPlayerSelect(player);
      
      // Reset form
      setNewPlayerName('');
      setShowQuickAdd(false);
    } catch (err) {
      setError('Failed to add guest player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Search with smart suggestions */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Search players... (type first letter for suggestions)"
            />
          </div>
        </div>

        {/* Add Player Options */}
        {allowAddPlayer && !showAddPlayer && !showQuickAdd && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="flex items-center justify-center p-3 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-700 font-medium">Quick Add</span>
              </button>
              
              <button
                onClick={() => setShowAddPlayer(true)}
                className="flex items-center justify-center p-3 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-700 font-medium">Add to Group</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Add Form */}
        {showQuickAdd && (
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <h3 className="font-semibold text-green-800 mb-3">Quick Add Guest Player</h3>
            <form onSubmit={handleQuickAdd} className="space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Player name"
                required
              />
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false);
                    setNewPlayerName('');
                    setError('');
                  }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPlayerName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'Adding...' : 'Add & Select'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Full Add Player Form */}
        {showAddPlayer && (
          <div className="p-4 border-b border-gray-200 bg-blue-50 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-blue-800 mb-3">Add Player to Group</h3>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Photo Upload */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedPhoto ? (
                      <img src={selectedPhoto} alt="Player" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-3 h-3 text-white" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Player name *"
                required
              />
              
              <input
                type="text"
                value={newPlayerShortId}
                onChange={(e) => setNewPlayerShortId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Short ID (optional)"
                maxLength={10}
              />

              {groupId && (
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={newPlayerPhone}
                    onChange={(e) => setNewPlayerPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number (for invitation)"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPlayer(false);
                    setNewPlayerName('');
                    setNewPlayerShortId('');
                    setNewPlayerPhone('');
                    setSelectedPhoto(null);
                    setError('');
                  }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPlayerName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'Adding...' : 'Add & Select'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => onPlayerSelect(player)}
              className="w-full p-4 text-left border border-gray-200 rounded-lg mb-2 hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 flex items-center">
                    {player.name}
                    {player.isGroupMember && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Member
                      </span>
                    )}
                    {!player.isGroupMember && (
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        Guest
                      </span>
                    )}
                  </div>
                  {player.shortId && (
                    <div className="text-sm text-gray-500">#{player.shortId}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    {player.stats.matchesPlayed} matches • {player.stats.runsScored} runs • {player.stats.wicketsTaken} wickets
                  </div>
                </div>
              </div>
            </button>
          ))}

          {filteredPlayers.length === 0 && searchTerm && !showAddPlayer && !showQuickAdd && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No players found matching "{searchTerm}"</p>
              {allowAddPlayer && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setNewPlayerName(searchTerm);
                      setShowQuickAdd(true);
                    }}
                    className="block w-full p-3 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors text-green-700"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    Quick add "{searchTerm}" as guest
                  </button>
                  <button
                    onClick={() => {
                      setNewPlayerName(searchTerm);
                      setShowAddPlayer(true);
                    }}
                    className="block w-full p-3 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-blue-700"
                  >
                    <User className="w-5 h-5 inline mr-2" />
                    Add "{searchTerm}" to group
                  </button>
                </div>
              )}
            </div>
          )}

          {filteredPlayers.length === 0 && !searchTerm && !showAddPlayer && !showQuickAdd && (
            <div className="text-center py-8 text-gray-500">
              <p>No players available</p>
              {allowAddPlayer && (
                <p className="text-sm mt-2">Use the options above to add players</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};