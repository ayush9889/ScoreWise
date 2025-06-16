import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, BarChart3, RefreshCw, AlertCircle, Trophy, UserPlus, X, Wifi, WifiOff } from 'lucide-react';
import { Match, Ball, Player } from '../types/cricket';
import { CompactScoreDisplay } from './CompactScoreDisplay';
import { ScoringPanel } from './ScoringPanel';
import { PlayerSelector } from './PlayerSelector';
import { InningsBreakModal } from './InningsBreakModal';
import { CricketEngine } from '../services/cricketEngine';
import { storageService } from '../services/storage';
import { ScorecardModal } from './ScorecardModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cloudStorageService } from '../services/cloudStorageService';
import { authService } from '../services/authService';

interface LiveScorerProps {
  match: Match;
  onMatchComplete: (match: Match) => void;
  onBack: () => void;
}

export const LiveScorer: React.FC<LiveScorerProps> = ({
  match: initialMatch,
  onMatchComplete,
  onBack
}) => {
  // Match state
  const [match, setMatch] = useState<Match>(initialMatch);
  const [target, setTarget] = useState<number>(0);
  const [remainingRuns, setRemainingRuns] = useState(0);
  const [remainingBalls, setRemainingBalls] = useState(0);
  const [actionHistory, setActionHistory] = useState<Match[]>([]);
  const [redoStack, setRedoStack] = useState<Match[]>([]);
  const [bowlerHistory, setBowlerHistory] = useState<Player[]>([]);

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [showBatsmanSelector, setShowBatsmanSelector] = useState(false);
  const [showBowlerSelector, setShowBowlerSelector] = useState(false);
  const [showNewBatsmanSelector, setShowNewBatsmanSelector] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showInningsSetup, setShowInningsSetup] = useState(false);
  const [showMatchSummary, setShowMatchSummary] = useState(false);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [showOverCompleteMessage, setShowOverCompleteMessage] = useState(false);
  const [overCompleteMessage, setOverCompleteMessage] = useState<string | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showMotmSelector, setShowMotmSelector] = useState(false);

  // Game state
  const [pendingStrikeRotation, setPendingStrikeRotation] = useState(false);
  const [isSecondInningsSetup, setIsSecondInningsSetup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [addPlayerType, setAddPlayerType] = useState<'batting' | 'bowling'>('batting');
  const [extraRuns, setExtraRuns] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Add new state for players
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      cloudStorageService.goOnline();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      cloudStorageService.goOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load players on mount
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const players = await storageService.getAllPlayers();
        setAllPlayers(players);
      } catch (error) {
        console.error('Failed to load players:', error);
      } finally {
        setIsLoadingPlayers(false);
      }
    };
    loadPlayers();
  }, []);

  // Load match from cloud storage on mount
  useEffect(() => {
    const loadMatch = async () => {
      try {
        if (isOnline) {
          const savedMatch = await cloudStorageService.getMatch(initialMatch.id);
          if (savedMatch) {
            setMatch(savedMatch);
            // Initialize bowler history
            const history = savedMatch.balls
              .filter(b => b.bowler.id !== savedMatch.currentBowler?.id)
              .map(b => b.bowler.id);
            setBowlerHistory([...new Set(history)]);
          }
        }
      } catch (error) {
        console.error('Error loading match from cloud:', error);
        // Don't show error to user for permission issues - just continue with local data
        if (error instanceof Error && !error.message.includes('permission')) {
          setSaveError('Failed to load match from cloud storage. Using local data.');
        }
      }
    };
    loadMatch();
  }, [initialMatch.id, isOnline]);

  // Save match to cloud storage whenever it changes
  useEffect(() => {
    const saveMatch = async () => {
      if (!isOnline) {
        setSaveError('Device is offline. Changes will sync when connection is restored.');
        return;
      }

      try {
        setIsSaving(true);
        setSaveError(null);
        await cloudStorageService.saveMatch(match);
        setRetryCount(0); // Reset retry count on successful save
      } catch (error) {
        console.error('Error saving match to cloud:', error);
        
        // Don't show permission errors to user - just log them
        if (error instanceof Error && error.message.includes('permission')) {
          console.log('Permission denied for cloud save - continuing in offline mode');
          return;
        }
        
        setSaveError(error instanceof Error ? error.message : 'Failed to save match to cloud storage');
        
        // Implement retry logic for non-permission errors
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            saveMatch();
          }, 2000 * (retryCount + 1)); // Exponential backoff
        }
      } finally {
        setIsSaving(false);
      }
    };
    saveMatch();
  }, [match, retryCount, isOnline]);

  // Calculate remaining runs and balls
  useEffect(() => {
    if (match.isSecondInnings) {
      const totalBalls = match.totalOvers * 6;
      const ballsBowled = (match.battingTeam.overs * 6) + match.battingTeam.balls;
      setRemainingBalls(totalBalls - ballsBowled);
      setRemainingRuns(target - match.battingTeam.score);
    }
  }, [match.battingTeam.score, match.battingTeam.overs, match.battingTeam.balls, target]);

  // Update player stats after match completion
  useEffect(() => {
    const updatePlayerStats = async () => {
      if (match.isCompleted) {
        try {
          // Update stats for all players who participated
          const allMatchPlayers = [...match.team1.players, ...match.team2.players];
          
          for (const player of allMatchPlayers) {
            const updatedStats = CricketEngine.updatePlayerStats(player, match);
            const updatedPlayer = { ...player, stats: updatedStats };
            await storageService.savePlayer(updatedPlayer);
          }
          
          console.log('Player stats updated successfully');
        } catch (error) {
          console.error('Failed to update player stats:', error);
        }
      }
    };

    updatePlayerStats();
  }, [match.isCompleted]);

  const handleInningsTransition = () => {
    setShowInningsBreak(true);
  };

  const handleInningsBreakContinue = () => {
    const updatedMatch = { ...match };
    updatedMatch.isSecondInnings = true;
    updatedMatch.battingTeam = match.bowlingTeam;
    updatedMatch.bowlingTeam = match.battingTeam;
    updatedMatch.firstInningsScore = match.battingTeam.score;
    setTarget(match.battingTeam.score + 1);
    updatedMatch.battingTeam.score = 0;
    updatedMatch.battingTeam.overs = 0;
    updatedMatch.battingTeam.balls = 0;
    updatedMatch.battingTeam.wickets = 0;
    updatedMatch.battingTeam.extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
    // Clear current players for new selection
    updatedMatch.currentStriker = undefined;
    updatedMatch.currentNonStriker = undefined;
    updatedMatch.currentBowler = undefined;
    setMatch(updatedMatch);
    setShowInningsBreak(false);
    setShowInningsSetup(true);
    setIsSecondInningsSetup(true);
  };

  const handleInningsSetup = () => {
    setShowInningsSetup(false);
    setShowBatsmanSelector(true);
  };

  const handleBatsmanSelect = (player: Player) => {
    const updatedMatch = { ...match };
    if (!updatedMatch.currentStriker) {
      updatedMatch.currentStriker = player;
    } else if (!updatedMatch.currentNonStriker) {
      updatedMatch.currentNonStriker = player;
      setShowBatsmanSelector(false);
      setShowBowlerSelector(true);
    }
    setMatch(updatedMatch);
  };

  const handleBowlerSelect = (player: Player) => {
    const updatedMatch = { ...match };
    updatedMatch.currentBowler = player;
    setMatch(updatedMatch);
    setShowBowlerSelector(false);
    setIsSecondInningsSetup(false);
  };

  const handleMatchComplete = () => {
    setShowVictoryAnimation(true);
    setTimeout(() => {
      setShowMatchSummary(true);
      setShowVictoryAnimation(false);
    }, 3000);
  };

  const handleScoreUpdate = (ball: Ball) => {
    const updatedMatch = { ...match };
    
    // Add ball to history
    updatedMatch.balls.push(ball);
    setActionHistory([...actionHistory, ball]);

    // Update batting team score
    updatedMatch.battingTeam.score += ball.runs;

    // Handle extras
    if (ball.isWide) {
      updatedMatch.battingTeam.extras.wides++;
      if (ball.runs > 1) {
        updatedMatch.battingTeam.score += ball.runs - 1;
      }
    } else if (ball.isNoBall) {
      updatedMatch.battingTeam.extras.noBalls++;
      if (ball.runs > 1) {
        const strikerBalls = updatedMatch.balls.filter(b => b.striker.id === ball.striker.id);
        const strikerRuns = strikerBalls.reduce((sum, b) => sum + b.runs, 0);
        const lastBall = updatedMatch.balls[updatedMatch.balls.length - 1];
        lastBall.runs = ball.runs;
      }
    } else if (ball.isBye) {
      updatedMatch.battingTeam.extras.byes += ball.runs;
      updatedMatch.battingTeam.score += ball.runs;
    } else if (ball.isLegBye) {
      updatedMatch.battingTeam.extras.legByes += ball.runs;
      updatedMatch.battingTeam.score += ball.runs;
    }

    // Handle wickets
    if (ball.isWicket) {
      updatedMatch.battingTeam.wickets++;
    }

    // Check if over is complete
    if (!ball.isWide && !ball.isNoBall) {
      updatedMatch.battingTeam.balls++;
      
      if (updatedMatch.battingTeam.balls >= 6) {
        updatedMatch.battingTeam.overs++;
        updatedMatch.battingTeam.balls = 0;
        
        setOverCompleteMessage(`Over ${updatedMatch.battingTeam.overs} completed!`);
        setPendingStrikeRotation(true);
        
        // Force bowler change after over completion
        const availableBowlers = CricketEngine.getAvailableBowlers(updatedMatch, updatedMatch.battingTeam.overs + 1);
        // Filter out current batsmen from available bowlers
        const currentBatsmen = [updatedMatch.currentStriker?.id, updatedMatch.currentNonStriker?.id];
        const eligibleBowlers = availableBowlers.filter(b => !currentBatsmen.includes(b.id));
        
        if (eligibleBowlers.length > 0) {
          setShowBowlerSelector(true);
        } else {
          const shouldAddBowler = window.confirm(
            'No other bowlers available for the next over! Would you like to add more bowlers to the team?'
          );
          if (shouldAddBowler) {
            setAddPlayerType('bowling');
            setShowAddPlayerModal(true);
          }
        }
      }
    }

    // Check for innings completion
    if (CricketEngine.isInningsComplete(updatedMatch)) {
      if (!updatedMatch.isSecondInnings) {
        handleInningsTransition();
      } else {
        updatedMatch.isCompleted = true;
        updatedMatch.winner = CricketEngine.getMatchResult(updatedMatch);
        handleMatchComplete();
      }
    }

    // Update bowler history
    if (ball.bowler.id !== updatedMatch.currentBowler?.id) {
      setBowlerHistory(prev => [...prev, ball.bowler.id]);
    }

    setMatch(updatedMatch);
  };

  const handleStrikeRotation = () => {
    setPendingStrikeRotation(false);
    // Strike rotation will be handled by the ScoringPanel component
  };

  const handleBowlerChange = (newBowler: Player) => {
    const updatedMatch = { ...match };
    updatedMatch.previousBowler = updatedMatch.currentBowler;
    updatedMatch.currentBowler = newBowler;
    
    // Add bowler to bowling team if not already present
    if (!updatedMatch.bowlingTeam.players.find(p => p.id === newBowler.id)) {
      updatedMatch.bowlingTeam.players.push(newBowler);
    }
    
    setMatch(updatedMatch);
    setShowBowlerSelector(false);
    setOverCompleteMessage(null);
  };

  const handleNewBatsman = (newBatsman: Player) => {
    // Add new batsman to batting team if not already present
    const updatedMatch = { ...match };
    if (!updatedMatch.battingTeam.players.find(p => p.id === newBatsman.id)) {
      updatedMatch.battingTeam.players.push(newBatsman);
    }
    
    setMatch(updatedMatch);
    setShowNewBatsmanSelector(false);
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) return;

    const lastBall = actionHistory[actionHistory.length - 1];
    const updatedMatch = { ...match };

    // Remove last ball
    updatedMatch.balls = updatedMatch.balls.slice(0, -1);

    // Revert score
    updatedMatch.battingTeam.score -= lastBall.runs;

    // Revert extras
    if (lastBall.isWide) {
      updatedMatch.battingTeam.extras.wides--;
    } else if (lastBall.isNoBall) {
      updatedMatch.battingTeam.extras.noBalls--;
    } else if (lastBall.isBye) {
      updatedMatch.battingTeam.extras.byes -= lastBall.runs;
    } else if (lastBall.isLegBye) {
      updatedMatch.battingTeam.extras.legByes -= lastBall.runs;
    }

    // Revert wickets
    if (lastBall.isWicket) {
      updatedMatch.battingTeam.wickets--;
    }

    // Revert ball count
    if (!lastBall.isWide && !lastBall.isNoBall) {
      if (updatedMatch.battingTeam.balls === 0) {
        updatedMatch.battingTeam.overs--;
        updatedMatch.battingTeam.balls = 5;
      } else {
        updatedMatch.battingTeam.balls--;
      }
    }

    setMatch(updatedMatch);
    setActionHistory(actionHistory.slice(0, -1));
    setPendingStrikeRotation(false);
    setOverCompleteMessage(null);
  };

  const getAvailableBowlers = (): Player[] => {
    const currentOver = match.battingTeam.overs + 1;
    return CricketEngine.getAvailableBowlers(match, currentOver);
  };

  const handleMotmSelect = (player: Player) => {
    const updatedMatch = { ...match };
    updatedMatch.manOfTheMatch = player;
    setMatch(updatedMatch);
    setShowBowlerSelector(false);
    onMatchComplete(updatedMatch);
  };

  const handleAddPlayer = (player: Player) => {
    const updatedMatch = { ...match };
    if (addPlayerType === 'batting') {
      if (!updatedMatch.battingTeam.players.find(p => p.id === player.id)) {
        updatedMatch.battingTeam.players.push(player);
      }
    } else {
      if (!updatedMatch.bowlingTeam.players.find(p => p.id === player.id)) {
        updatedMatch.bowlingTeam.players.push(player);
      }
    }
    setMatch(updatedMatch);
    setShowAddPlayerModal(false);
  };

  const currentGroup = authService.getCurrentGroup();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h1 className="font-bold text-base text-gray-900">Live Scorer</h1>
        
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className={`p-1 rounded-lg ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          
          <button
            onClick={() => setShowScorecard(true)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Scorecard"
          >
            <Trophy className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Over Complete Message */}
      {overCompleteMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 p-2 m-2">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-green-600 mr-1" />
            <p className="text-green-700 text-sm font-semibold">{overCompleteMessage}</p>
          </div>
          <p className="text-green-600 text-xs mt-1">
            Strike rotated. Please select new bowler to continue.
          </p>
        </div>
      )}

      {/* Strike Rotation Alert */}
      {pendingStrikeRotation && !overCompleteMessage && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-2 m-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 text-blue-600 mr-1" />
              <p className="text-blue-700 text-sm font-semibold">Strike Rotated</p>
            </div>
            <button
              onClick={handleStrikeRotation}
              className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-2 space-y-2">
        <CompactScoreDisplay match={match} />
        
        <ScoringPanel
          match={match}
          onScoreUpdate={handleScoreUpdate}
          onUndo={handleUndo}
          canUndo={actionHistory.length > 0}
          pendingStrikeRotation={pendingStrikeRotation}
          onStrikeRotation={handleStrikeRotation}
        />

        {/* Recent Balls */}
        {match.balls.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-2">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Recent Balls</h3>
            <div className="space-y-1">
              {match.balls.slice(-5).reverse().map((ball, index) => (
                <div key={ball.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0 text-xs">
                  <div className="text-gray-600">
                    {ball.overNumber}.{ball.ballNumber % 6 || 6}
                  </div>
                  <div className="flex-1 mx-2">{ball.commentary}</div>
                  <div className="font-semibold">
                    {ball.runs}{ball.isWide ? 'wd' : ball.isNoBall ? 'nb' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Innings Break Modal */}
      <AnimatePresence>
        {showInningsBreak && (
          <InningsBreakModal
            match={match}
            onContinue={handleInningsBreakContinue}
          />
        )}
      </AnimatePresence>

      {/* Bowler Selector Modal */}
      {showBowlerSelector && (
        <PlayerSelector
          title="Select New Bowler"
          onPlayerSelect={handleBowlerChange}
          onClose={() => {
            setShowBowlerSelector(false);
            setOverCompleteMessage(null);
          }}
          players={getAvailableBowlers().filter(b => 
            b.id !== match.currentBowler?.id && 
            b.id !== match.previousBowler?.id
          )}
          showOnlyAvailable={true}
          allowAddPlayer={true}
          groupId={currentGroup?.id}
        />
      )}

      {/* New Batsman Selector Modal */}
      {showNewBatsmanSelector && (
        <PlayerSelector
          title="Select New Batsman"
          onPlayerSelect={handleNewBatsman}
          onClose={() => setShowNewBatsmanSelector(false)}
          players={match.battingTeam.players}
          showOnlyAvailable={true}
          allowAddPlayer={true}
          groupId={currentGroup?.id}
        />
      )}

      {/* Scorecard Modal */}
      {showScorecard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Match Scorecard</h2>
              <button
                onClick={() => setShowScorecard(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <ScorecardModal match={match} onClose={() => setShowScorecard(false)} />
          </div>
        </motion.div>
      )}

      {/* MOTM Selector Modal */}
      {showMotmSelector && (
        <PlayerSelector
          title="Select Man of the Match"
          onPlayerSelect={handleMotmSelect}
          onClose={() => setShowMotmSelector(false)}
          players={[...match.team1.players, ...match.team2.players]}
          showOnlyAvailable={false}
          allowAddPlayer={false}
        />
      )}

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <PlayerSelector
          title={`Add ${addPlayerType === 'batting' ? 'Batsman' : 'Bowler'}`}
          onPlayerSelect={handleAddPlayer}
          onClose={() => setShowAddPlayerModal(false)}
          players={allPlayers}
          showOnlyAvailable={false}
          allowAddPlayer={true}
          groupId={currentGroup?.id}
        />
      )}

      <AnimatePresence>
        {showInningsSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Second Innings Setup</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">First Innings Summary</h3>
                  <p className="text-gray-600">
                    {match.bowlingTeam.name} scored {match.firstInningsScore} runs
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Target</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {target} runs to win
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleInningsSetup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Second Innings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showVictoryAnimation && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 text-green-600">
                {CricketEngine.getMatchResult(match)}
              </h2>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>
            </div>
          </motion.div>
        )}

        {showMatchSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">Match Summary</h2>
              <div className="space-y-4">
                <p className="text-xl font-semibold">{CricketEngine.getMatchResult(match)}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">First Innings</h3>
                    <p>{match.battingTeam.name}: {match.firstInningsScore}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Second Innings</h3>
                    <p>{match.bowlingTeam.name}: {match.bowlingTeam.score}</p>
                  </div>
                </div>
                {!match.manOfTheMatch && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Select Man of the Match</h3>
                    <PlayerSelector
                      title="Man of the Match"
                      onPlayerSelect={(player) => {
                        const updatedMatch = { ...match, manOfTheMatch: player };
                        setMatch(updatedMatch);
                        onMatchComplete(updatedMatch);
                      }}
                      onClose={() => setShowMatchSummary(false)}
                      players={[...match.battingTeam.players, ...match.bowlingTeam.players]}
                      showOnlyAvailable={false}
                      allowAddPlayer={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {showBatsmanSelector && (
          <PlayerSelector
            title="Select Opening Batsmen"
            onPlayerSelect={handleBatsmanSelect}
            onClose={() => setShowBatsmanSelector(false)}
            players={match.battingTeam.players}
            showOnlyAvailable={true}
            allowAddPlayer={true}
            groupId={currentGroup?.id}
          />
        )}

        {showBowlerSelector && (
          <PlayerSelector
            title="Select Opening Bowler"
            onPlayerSelect={handleBowlerSelect}
            onClose={() => setShowBowlerSelector(false)}
            players={match.bowlingTeam.players}
            showOnlyAvailable={true}
            allowAddPlayer={true}
            groupId={currentGroup?.id}
          />
        )}
      </AnimatePresence>

      {/* Save Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        {isSaving && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div>
            <span>Saving to cloud...</span>
          </div>
        )}
        {saveError && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <X className="w-4 h-4" />
            <span className="text-sm">{saveError}</span>
            {retryCount > 0 && (
              <span className="text-xs ml-2">(Retrying {retryCount}/3)</span>
            )}
          </div>
        )}
        {!isOnline && (
          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2 mb-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">Offline Mode</span>
          </div>
        )}
      </div>
    </div>
  );
};