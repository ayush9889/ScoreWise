import React, { useState, useEffect } from 'react';
import { RotateCcw, RefreshCw, Camera } from 'lucide-react';
import { Match, Player, Ball, WicketType } from '../types/cricket';
import { PlayerSelector } from './PlayerSelector';

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
  const [showExtraRuns, setShowExtraRuns] = useState(false);
  const [extraRuns, setExtraRuns] = useState(0);

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

  const handleExtraRuns = (runs: number) => {
    setExtraRuns(runs);
    setShowExtraRuns(true);
  };

  const handleExtraType = (type: 'wide' | 'noBall' | 'bye' | 'legBye') => {
    const ball: Ball = {
      id: Date.now().toString(),
      striker: striker!,
      nonStriker: nonStriker!,
      bowler: bowler!,
      runs: extraRuns,
      isWide: type === 'wide',
      isNoBall: type === 'noBall',
      isBye: type === 'bye',
      isLegBye: type === 'legBye',
      isWicket: false,
      timestamp: new Date().toISOString()
    };
    onScoreUpdate(ball);
    setShowExtraRuns(false);
    setExtraRuns(0);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* Current Over Info */}
        <div className="bg-green-50 rounded-lg p-3 mb-4 text-center">
          <div className="text-sm text-green-600 font-medium">
            Over {currentOver} • Ball {(match.battingTeam.balls % 6) + 1}
          </div>
          {bowler && (
            <div className="text-xs text-green-500 mt-1">
              Bowling: {bowler.name}
            </div>
          )}
        </div>

        {/* Player Selection */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setShowPlayerSelector({
              type: 'striker',
              title: 'Select Striker'
            })}
            className={`p-3 rounded-lg border-2 transition-all ${
              striker
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-green-300'
            }`}
          >
            <div className="text-xs text-gray-600 mb-1">Striker</div>
            <div className="font-semibold text-sm">
              {striker ? striker.name : 'Select'}
            </div>
          </button>

          <button
            onClick={() => setShowPlayerSelector({
              type: 'nonStriker',
              title: 'Select Non-Striker'
            })}
            className={`p-3 rounded-lg border-2 transition-all ${
              nonStriker
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="text-xs text-gray-600 mb-1">Non-Striker</div>
            <div className="font-semibold text-sm">
              {nonStriker ? nonStriker.name : 'Select'}
            </div>
          </button>

          <button
            onClick={() => setShowPlayerSelector({
              type: 'bowler',
              title: 'Select Bowler'
            })}
            className={`p-3 rounded-lg border-2 transition-all ${
              bowler
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-red-300'
            }`}
          >
            <div className="text-xs text-gray-600 mb-1">Bowler</div>
            <div className="font-semibold text-sm">
              {bowler ? bowler.name : 'Select'}
            </div>
          </button>
        </div>

        {/* Runs */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Runs</h3>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 6].map((runs) => (
              <button
                key={runs}
                onClick={() => handleRun(runs)}
                className={`py-4 rounded-xl font-bold text-lg transition-all ${
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

        {/* Extras */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Extras</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleExtraRuns(1)}
              className="py-3 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Wide
            </button>
            <button
              onClick={() => handleExtraRuns(1)}
              className="py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              No Ball
            </button>
            <button
              onClick={() => handleExtraRuns(1)}
              className="py-3 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Bye
            </button>
            <button
              onClick={() => handleExtraRuns(1)}
              className="py-3 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Leg Bye
            </button>
          </div>
        </div>

        {/* Wicket */}
        <div className="mb-6">
          <button
            onClick={() => setShowWicketOptions(!showWicketOptions)}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Wicket
          </button>

          {showWicketOptions && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleWicket('bowled')}
                className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Bowled
              </button>
              <button
                onClick={() => handleWicket('caught')}
                className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Caught
              </button>
              <button
                onClick={() => handleWicket('lbw')}
                className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                LBW
              </button>
              <button
                onClick={() => handleWicket('run_out')}
                className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Run Out
              </button>
              <button
                onClick={() => handleWicket('stumped')}
                className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Stumped
              </button>
              <button
                onClick={() => handleWicket('hit_wicket')}
                className="py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Hit Wicket
              </button>
            </div>
          )}
        </div>

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
          <RotateCcw className="w-5 h-5 inline mr-2" />
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
        />
      )}

      {/* Extra Runs Modal */}
      {showExtraRuns && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Select Extra Runs</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6].map(runs => (
                <button
                  key={runs}
                  onClick={() => setExtraRuns(runs)}
                  className={`p-2 rounded-lg transition-colors ${
                    extraRuns === runs
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {runs}
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowExtraRuns(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExtraType('wide')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Wide
              </button>
              <button
                onClick={() => handleExtraType('noBall')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                No Ball
              </button>
              <button
                onClick={() => handleExtraType('bye')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Bye
              </button>
              <button
                onClick={() => handleExtraType('legBye')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Leg Bye
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};