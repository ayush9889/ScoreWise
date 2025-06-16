import React, { useState, useEffect } from 'react';
import { RotateCcw, RefreshCw, Camera } from 'lucide-react';
import { Match, Player, Ball, WicketType } from '../types/cricket';
import { PlayerSelector } from './PlayerSelector';
import { authService } from '../services/authService';

interface ScoringPanelProps {
  match: Match;
  onScoreUpdate: (ball: Ball) => void;
  onUndo: () => void;
  canUndo: boolean;
  pendingStrikeRotation?: boolean;
  onStrikeRotation?: () => void;
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({
  match,
  onScoreUpdate,
  onUndo,
  canUndo,
  pendingStrikeRotation,
  onStrikeRotation
}) => {
  const [striker, setStriker] = useState<Player | null>(null);
  const [nonStriker, setNonStriker] = useState<Player | null>(null);
  const [bowler, setBowler] = useState<Player | null>(match.currentBowler || null);
  const [showPlayerSelector, setShowPlayerSelector] = useState<{
    type: 'striker' | 'nonStriker' | 'bowler' | 'fielder';
    title: string;
  } | null>(null);
  const [wicketType, setWicketType] = useState<WicketType | null>(null);
  const [showWicketOptions, setShowWicketOptions] = useState(false);
  const [showExtraOptions, setShowExtraOptions] = useState(false);

  // Auto-rotate strike when needed
  useEffect(() => {
    if (pendingStrikeRotation && striker && nonStriker) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
      onStrikeRotation?.();
    }
  }, [pendingStrikeRotation, striker, nonStriker, onStrikeRotation]);

  // Update bowler when match bowler changes
  useEffect(() => {
    if (match.currentBowler && match.currentBowler.id !== bowler?.id) {
      setBowler(match.currentBowler);
    }
  }, [match.currentBowler, bowler]);

  const currentBallNumber = (match.battingTeam.overs * 6) + match.battingTeam.balls + 1;
  const currentOver = match.battingTeam.overs + 1;

  const createBall = (runs: number, extras: any = {}, wicket: any = {}): Ball => {
    return {
      id: `ball_${Date.now()}_${Math.random()}`,
      ballNumber: currentBallNumber,
      overNumber: currentOver,
      bowler: bowler!,
      striker: striker!,
      nonStriker: nonStriker!,
      runs,
      isWide: extras.isWide || false,
      isNoBall: extras.isNoBall || false,
      isBye: extras.isBye || false,
      isLegBye: extras.isLegBye || false,
      isWicket: wicket.isWicket || false,
      wicketType: wicket.wicketType,
      fielder: wicket.fielder,
      commentary: generateCommentary(runs, extras, wicket),
      timestamp: Date.now()
    };
  };

  const generateCommentary = (runs: number, extras: any, wicket: any): string => {
    if (wicket.isWicket) {
      return `${striker?.name} ${wicket.wicketType}${wicket.fielder ? ` by ${wicket.fielder.name}` : ''} for ${runs}`;
    }
    if (extras.isWide) return `Wide, ${runs} runs`;
    if (extras.isNoBall) return `No ball, ${runs} runs`;
    if (extras.isBye) return `${runs} bye${runs !== 1 ? 's' : ''}`;
    if (extras.isLegBye) return `${runs} leg bye${runs !== 1 ? 's' : ''}`;
    
    switch (runs) {
      case 0: return 'Dot ball';
      case 1: return 'Single';
      case 2: return 'Two runs';
      case 3: return 'Three runs';
      case 4: return 'Four!';
      case 6: return 'Six!';
      default: return `${runs} runs`;
    }
  };

  const handleRun = (runs: number) => {
    if (!striker || !nonStriker || !bowler) {
      alert('Please select striker, non-striker, and bowler first');
      return;
    }

    const ball = createBall(runs);
    onScoreUpdate(ball);
  };

  const handleExtra = (type: 'wide' | 'noBall' | 'bye' | 'legBye', runs: number = 1) => {
    if (!striker || !nonStriker || !bowler) {
      alert('Please select striker, non-striker, and bowler first');
      return;
    }

    const ball = createBall(runs, {
      isWide: type === 'wide',
      isNoBall: type === 'noBall',
      isBye: type === 'bye',
      isLegBye: type === 'legBye'
    });

    onScoreUpdate(ball);
    setShowExtraOptions(false);
  };

  const handleWicket = (type: WicketType) => {
    if (!striker || !nonStriker || !bowler) {
      alert('Please select striker, non-striker, and bowler first');
      return;
    }

    if (type === 'caught' || type === 'run_out' || type === 'stumped') {
      setWicketType(type);
      setShowPlayerSelector({
        type: 'fielder',
        title: `Select ${type === 'caught' ? 'Fielder' : type === 'run_out' ? 'Run Out By' : 'Wicket Keeper'}`
      });
    } else {
      const ball = createBall(0, {}, {
        isWicket: true,
        wicketType: type
      });
      onScoreUpdate(ball);
      setShowWicketOptions(false);
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
      case 'fielder':
        const ball = createBall(0, {}, {
          isWicket: true,
          wicketType: wicketType,
          fielder: player
        });
        onScoreUpdate(ball);
        setWicketType(null);
        setShowWicketOptions(false);
        break;
    }
    setShowPlayerSelector(null);
  };

  const getPlayersForSelector = (type: string): Player[] => {
    switch (type) {
      case 'striker':
      case 'nonStriker':
        return match.battingTeam.players || [];
      case 'bowler':
        return match.bowlingTeam.players || [];
      case 'fielder':
        return match.bowlingTeam.players || [];
      default:
        return [];
    }
  };

  const getExcludedPlayerIds = (type: string): string[] => {
    const excluded: string[] = [];
    if (type === 'striker' && nonStriker) excluded.push(nonStriker.id);
    if (type === 'nonStriker' && striker) excluded.push(striker.id);
    if (type === 'bowler') {
      if (striker) excluded.push(striker.id);
      if (nonStriker) excluded.push(nonStriker.id);
    }
    return excluded;
  };

  const currentGroup = authService.getCurrentGroup();

  return (
    <>
      <div className="glass-effect rounded-2xl shadow-lg p-4">
        {/* Current Over Info */}
        <div className="bg-emerald-50 rounded-xl p-3 mb-4 text-center border border-emerald-200">
          <div className="text-sm text-emerald-700 font-bold">
            Over {currentOver} • Ball {(match.battingTeam.balls % 6) + 1}
          </div>
          {bowler && (
            <div className="text-xs text-emerald-600 mt-1 font-medium">
              Bowling: {bowler.name}
            </div>
          )}
        </div>

        {/* Player Selection - Compact */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setShowPlayerSelector({
              type: 'striker',
              title: 'Select Striker'
            })}
            className={`p-2 rounded-lg border-2 transition-all text-xs ${
              striker
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-300 hover:border-emerald-300'
            }`}
          >
            <div className="text-xs text-gray-600 mb-1">Striker</div>
            <div className="font-bold text-xs truncate">
              {striker ? striker.name : 'Select'}
            </div>
          </button>

          <button
            onClick={() => setShowPlayerSelector({
              type: 'nonStriker',
              title: 'Select Non-Striker'
            })}
            className={`p-2 rounded-lg border-2 transition-all text-xs ${
              nonStriker
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="text-xs text-gray-600 mb-1">Non-Striker</div>
            <div className="font-bold text-xs truncate">
              {nonStriker ? nonStriker.name : 'Select'}
            </div>
          </button>

          <button
            onClick={() => setShowPlayerSelector({
              type: 'bowler',
              title: 'Select Bowler'
            })}
            className={`p-2 rounded-lg border-2 transition-all text-xs ${
              bowler
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-red-300'
            }`}
          >
            <div className="text-xs text-gray-600 mb-1">Bowler</div>
            <div className="font-bold text-xs truncate">
              {bowler ? bowler.name : 'Select'}
            </div>
          </button>
        </div>

        {/* Runs - Compact Grid */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Runs</h3>
          <div className="grid grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 6].map((runs) => (
              <button
                key={runs}
                onClick={() => handleRun(runs)}
                className={`py-3 rounded-xl font-bold text-lg transition-all ${
                  runs === 0
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : runs === 4
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                    : runs === 6
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                }`}
              >
                {runs}
              </button>
            ))}
          </div>
        </div>

        {/* Extras & Wicket - Compact Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setShowExtraOptions(!showExtraOptions)}
            className="py-3 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-semibold"
          >
            Extras
          </button>
          <button
            onClick={() => setShowWicketOptions(!showWicketOptions)}
            className="py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
          >
            Wicket
          </button>
        </div>

        {/* Extra Options */}
        {showExtraOptions && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExtra('wide')}
              className="py-2 px-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
            >
              Wide
            </button>
            <button
              onClick={() => handleExtra('noBall')}
              className="py-2 px-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
            >
              No Ball
            </button>
            <button
              onClick={() => handleExtra('bye')}
              className="py-2 px-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
            >
              Bye
            </button>
            <button
              onClick={() => handleExtra('legBye')}
              className="py-2 px-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
            >
              Leg Bye
            </button>
          </div>
        )}

        {/* Wicket Options */}
        {showWicketOptions && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleWicket('bowled')}
              className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Bowled
            </button>
            <button
              onClick={() => handleWicket('caught')}
              className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Caught
            </button>
            <button
              onClick={() => handleWicket('lbw')}
              className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              LBW
            </button>
            <button
              onClick={() => handleWicket('run_out')}
              className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Run Out
            </button>
            <button
              onClick={() => handleWicket('stumped')}
              className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Stumped
            </button>
            <button
              onClick={() => handleWicket('hit_wicket')}
              className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Hit Wicket
            </button>
          </div>
        )}

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            canUndo
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-4 h-4 inline mr-2" />
          Undo Last Ball
        </button>
      </div>

      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <PlayerSelector
          title={showPlayerSelector.title}
          onPlayerSelect={handlePlayerSelect}
          onClose={() => setShowPlayerSelector(null)}
          players={getPlayersForSelector(showPlayerSelector.type)}
          excludePlayerIds={getExcludedPlayerIds(showPlayerSelector.type)}
          allowAddPlayer={true}
          groupId={currentGroup?.id}
        />
      )}
    </>
  );
};