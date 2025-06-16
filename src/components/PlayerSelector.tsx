import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, User, Camera, X } from 'lucide-react';
import { Player } from '../types/cricket';

interface PlayerSelectorProps {
  onPlayerSelect: (player: Player) => void;
  onClose: () => void;
  title: string;
  excludePlayerIds?: string[];
  players: Player[];
  showOnlyAvailable?: boolean;
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  onPlayerSelect,
  onClose,
  title,
  excludePlayerIds = [],
  players,
  showOnlyAvailable = false
}) => {
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>(players);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerShortId, setNewPlayerShortId] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update filtered players when search term or players change
  useEffect(() => {
    const filtered = players.filter(player => 
      !excludePlayerIds.includes(player.id) &&
      (player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (player.shortId && player.shortId.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    setFilteredPlayers(filtered);
  }, [players, searchTerm, excludePlayerIds]);

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
          
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Search players..."
            />
          </div>
        </div>

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
                  <div className="font-semibold text-gray-900">{player.name}</div>
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

          {filteredPlayers.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              No players found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};