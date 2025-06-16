import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, BarChart3, RefreshCw, AlertCircle, Trophy, UserPlus, X, ArrowRight, Play } from 'lucide-react';
import { Match, Ball, Player } from '../types/cricket';
import { ScoreDisplay } from './ScoreDisplay';
import { ScoringPanel } from './ScoringPanel';
import { PlayerSelector } from './PlayerSelector';
import { LiveStatsBar } from './LiveStatsBar';
import { InningsBreakModal } from './InningsBreakModal';
import { CricketEngine } from '../services/cricketEngine';
import { storageService } from '../services/storage';
import { LiveScoreboard } from './LiveScoreboard';
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

  // Add new state for players
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

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
        const savedMatch = await cloudStorageService.getMatch(initialMatch.id);
        if (savedMatch) {
          setMatch(savedMatch);
          // Initialize bowler history
          const history = savedMatch.balls
            .filter(b => b.bowler.id !== savedMatch.currentBowler?.id)
            .map(b => b.bowler.id);
          setBowlerHistory([...new Set(history)]);
        }
      } catch (error) {
        console.error('Error loading match from cloud:', error);
        setSaveError('Failed to load match from cloud storage. Using local data.');
      }
    };
    loadMatch();
  }, [initialMatch.id]);

  // Save match to both local and cloud storage whenever it changes
  useEffect(() => {
    const saveMatch = async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        
        // Always save to local storage first (immediate)
        await storageService.saveMatch(match);
        
        // Try to save to cloud storage (may fail if offline)
        try {
          await cloudStorageService.saveMatch(match);
          setRetryCount(0); // Reset retry count on successful save
        } catch (cloudError) {
          console.warn('Cloud save failed, data saved locally:', cloudError);
          setSaveError('Offline mode - data saved locally');
          
          // Implement retry logic for cloud save
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              cloudStorageService.saveMatch(match).catch(() => {
                console.warn('Retry failed, continuing in offline mode');
              });
            }, 2000 * (retryCount + 1)); // Exponential backoff
          }
        }
      } catch (error) {
        console.error('Error saving match:', error);
        setSaveError('Failed to save match data');
      } finally {
        setIsSaving(false);
      }
    };
    
    // Debounce saves to avoid too frequent updates
    const timeoutId = setTimeout(saveMatch, 500);
    return () => clearTimeout(timeoutId);
  }, [match, retryCount]);

  // Calculate remaining runs and balls for second innings
  useEffect(() => {
    if (match.isSecondInnings && match.firstInningsScore) {
      const totalBalls = match.totalOvers * 6;
      const ballsBowled = (match.battingTeam.overs * 6) + match.battingTeam.balls;
      setRemainingBalls(totalBalls - ballsBowled);
      setRemainingRuns(match.firstInningsScore + 1 - match.battingTeam.score);
      setTarget(match.firstInningsScore + 1);
    }
  }, [match.battingTeam.score, match.battingTeam.overs, match.battingTeam.balls, match.firstInningsScore, match.isSecondInnings]);

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

  // Check if first innings is complete
  const isFirstInningsComplete = () => {
    return !match.isSecondInnings && 
           (match.battingTeam.overs >= match.totalOvers || match.battingTeam.wickets >= 10);
  };

  const handleInningsTransition = () => {
    console.log('Innings transition triggered');
    // Only show innings break if first innings is actually complete
    if (isFirstInningsComplete()) {
      setShowInningsBreak(true);
    }
  };

  const handleInningsBreakContinue = () => {
    console.log('Starting second innings setup');
    const updatedMatch = { ...match };
    updatedMatch.isSecondInnings = true;
    
    // Store first innings score
    updatedMatch.firstInningsScore = match.battingTeam.score;
    setTarget(match.battingTeam.score + 1);
    
    // Swap teams
    const tempTeam = updatedMatch.battingTeam;
    updatedMatch.battingTeam = updatedMatch.bowlingTeam;
    updatedMatch.bowlingTeam = tempTeam;
    
    // Reset batting team stats
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
    const updatedMatch = { ...match };
    updatedMatch.isCompleted = true;
    updatedMatch.endTime = Date.now();
    updatedMatch.winner = CricketEngine.getMatchResult(updatedMatch);
    
    // Calculate Man of the Match
    const motm = CricketEngine.calculateManOfTheMatch(updatedMatch);
    if (motm) {
      updatedMatch.manOfTheMatch = motm;
    }
    
    setMatch(updatedMatch);
    setShowVictoryAnimation(true);
    
    setTimeout(() => {
      setShowVictoryAnimation(false);
      onMatchComplete(updatedMatch);
    }, 3000);
  };

  const handleScoreUpdate = (ball: Ball) => {
    // Save current state for undo
    setActionHistory([...actionHistory, { ...match }]);
    setRedoStack([]); // Clear redo stack when new action is performed
    
    const updatedMatch = { ...match };
    
    // Add ball to history
    updatedMatch.balls.push(ball);
    updatedMatch.lastUpdated = Date.now();

    // Update batting team score
    updatedMatch.battingTeam.score += ball.runs;

    // Handle extras
    if (ball.isWide) {
      updatedMatch.battingTeam.extras.wides++;
    } else if (ball.isNoBall) {
      updatedMatch.battingTeam.extras.noBalls++;
    } else if (ball.isBye) {
      updatedMatch.battingTeam.extras.byes += ball.runs;
    } else if (ball.isLegBye) {
      updatedMatch.battingTeam.extras.legByes += ball.runs;
    }

    // Handle wickets
    if (ball.isWicket) {
      updatedMatch.battingTeam.wickets++;
      // Show new batsman selector if not all out
      if (updatedMatch.battingTeam.wickets < 10) {
        setShowNewBatsmanSelector(true);
      }
    }

    // Handle strike rotation
    const shouldRotateStrike = (ball.runs % 2 === 1) && !ball.isWicket;
    if (shouldRotateStrike) {
      const temp = updatedMatch.currentStriker;
      updatedMatch.currentStriker = updatedMatch.currentNonStriker;
      updatedMatch.currentNonStriker = temp;
    }

    // Check if over is complete (only for legal deliveries)
    if (!ball.isWide && !ball.isNoBall) {
      updatedMatch.battingTeam.balls++;
      
      if (updatedMatch.battingTeam.balls >= 6) {
        updatedMatch.battingTeam.overs++;
        updatedMatch.battingTeam.balls = 0;
        
        // Rotate strike at end of over
        const temp = updatedMatch.currentStriker;
        updatedMatch.currentStriker = updatedMatch.currentNonStriker;
        updatedMatch.currentNonStriker = temp;
        
        setOverCompleteMessage(`Over ${updatedMatch.battingTeam.overs} completed!`);
        
        // Check if innings is complete
        if (updatedMatch.battingTeam.overs >= match.totalOvers) {
          if (!updatedMatch.isSecondInnings) {
            setMatch(updatedMatch);
            handleInningsTransition();
            return;
          } else {
            handleMatchComplete();
            setMatch(updatedMatch);
            return;
          }
        }
        
        // Force bowler change after over completion
        setShowBowlerSelector(true);
      }
    }

    // Check for innings completion
    if (CricketEngine.isInningsComplete(updatedMatch)) {
      if (!updatedMatch.isSecondInnings) {
        setMatch(updatedMatch);
        handleInningsTransition();
        return;
      } else {
        handleMatchComplete();
      }
    }

    setMatch(updatedMatch);
  };

  const handleStrikeRotation = () => {
    setPendingStrikeRotation(false);
    setOverCompleteMessage(null);
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
    const updatedMatch = { ...match };
    
    // Replace the striker (who got out) with new batsman
    updatedMatch.currentStriker = newBatsman;
    
    // Add new batsman to batting team if not already present
    if (!updatedMatch.battingTeam.players.find(p => p.id === newBatsman.id)) {
      updatedMatch.battingTeam.players.push(newBatsman);
    }
    
    setMatch(updatedMatch);
    setShowNewBatsmanSelector(false);
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) return;

    const previousState = actionHistory[actionHistory.length - 1];
    setRedoStack([match, ...redoStack]);
    setMatch(previousState);
    setActionHistory(actionHistory.slice(0, -1));
    setPendingStrikeRotation(false);
    setOverCompleteMessage(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[0];
    setActionHistory([...actionHistory, match]);
    setMatch(nextState);
    setRedoStack(redoStack.slice(1));
  };

  const getAvailableBowlers = (): Player[] => {
    const currentOver = match.battingTeam.overs + 1;
    return CricketEngine.getAvailableBowlers(match, currentOver);
  };

  const handleMotmSelect = (player: Player) => {
    const updatedMatch = { ...match };
    updatedMatch.manOfTheMatch = player;
    setMatch(updatedMatch);
    setShowMotmSelector(false);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <div className="glass-effect shadow-lg p-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h1 className="font-bold text-lg text-gray-900 font-display">ScoreWise Live</h1>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowScorecard(true)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="View Scorecard"
          >
            <Trophy className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Over Complete Message */}
      {overCompleteMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 p-3 m-3 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-700 font-semibold">{overCompleteMessage}</p>
          </div>
          <p className="text-green-600 text-sm mt-1">
            Strike rotated. Please select new bowler to continue.
          </p>
        </div>
      )}

      {/* Floating Innings Transition Button */}
      {isFirstInningsComplete() && !showInningsBreak && !showInningsSetup && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
        >
          <button
            onClick={handleInningsTransition}
            className="gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-premium hover:shadow-xl transition-all duration-200 flex items-center space-x-3"
          >
            <Play className="w-6 h-6" />
            <span>Start 2nd Innings</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </motion.div>
      )}

      {/* Content */}
      <div className="p-3 space-y-3">
        <ScoreDisplay match={match} />
        
        {/* Target and Required Rate Display - Only for Second Innings */}
        {match.isSecondInnings && match.firstInningsScore && (
          <div className="glass-effect rounded-2xl shadow-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Target</h3>
                <p className="text-2xl font-bold text-orange-600 font-display">{target}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Required</h3>
                <p className="text-2xl font-bold text-red-600 font-display">{remainingRuns}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Balls Left</h3>
                <p className="text-2xl font-bold text-blue-600 font-display">{remainingBalls}</p>
              </div>
            </div>
            
            {/* Required Run Rate */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Required Run Rate</h3>
                <p className="text-xl font-bold text-purple-600 font-display">
                  {remainingBalls > 0 ? (remainingRuns / (remainingBalls / 6)).toFixed(2) : '0.00'} per over
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Live Stats Bars - Show when players are selected */}
        {match.currentStriker && match.currentNonStriker && match.currentBowler && (
          <div className="space-y-3">
            <LiveStatsBar 
              player={match.currentStriker} 
              balls={match.balls} 
              type="batsman" 
              isStriker={true}
            />
            <LiveStatsBar 
              player={match.currentNonStriker} 
              balls={match.balls} 
              type="batsman" 
              isStriker={false}
            />
            <LiveStatsBar 
              player={match.currentBowler} 
              balls={match.balls} 
              type="bowler"
            />
          </div>
        )}
        
        {/* Show player selection prompt if players not selected */}
        {(!match.currentStriker || !match.currentNonStriker || !match.currentBowler) && (
          <div className="glass-effect rounded-2xl shadow-lg p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-display">Setup Required</h3>
            <p className="text-gray-600 mb-4">Please select players to start scoring</p>
            <div className="space-y-3">
              {!match.currentStriker && (
                <button
                  onClick={() => setShowBatsmanSelector(true)}
                  className="w-full gradient-primary text-white py-3 px-4 rounded-xl font-semibold"
                >
                  Select Opening Batsmen
                </button>
              )}
              {match.currentStriker && match.currentNonStriker && !match.currentBowler && (
                <button
                  onClick={() => setShowBowlerSelector(true)}
                  className="w-full gradient-secondary text-white py-3 px-4 rounded-xl font-semibold"
                >
                  Select Opening Bowler
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Only show scoring panel when all players are selected */}
        {match.currentStriker && match.currentNonStriker && match.currentBowler && (
          <ScoringPanel
            match={match}
            onScoreUpdate={handleScoreUpdate}
            onUndo={handleUndo}
            canUndo={actionHistory.length > 0}
            pendingStrikeRotation={pendingStrikeRotation}
            onStrikeRotation={handleStrikeRotation}
          />
        )}

        {/* Recent Balls */}
        {match.balls.length > 0 && (
          <div className="glass-effect rounded-2xl shadow-lg p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3 font-display">Recent Balls</h3>
            <div className="space-y-2">
              {match.balls.slice(-5).reverse().map((ball, index) => (
                <div key={ball.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 text-sm">
                  <div className="text-gray-600 font-medium">
                    {ball.overNumber}.{ball.ballNumber % 6 || 6}
                  </div>
                  <div className="flex-1 mx-3 text-gray-800">{ball.commentary}</div>
                  <div className="font-bold text-emerald-600">
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
          <div className="glass-effect rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold font-display">Match Scorecard</h2>
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
            <div className="glass-effect rounded-2xl p-8 w-full max-w-2xl m-4">
              <h2 className="text-2xl font-bold mb-6 font-display">Second Innings Setup</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold mb-2 font-display">First Innings Summary</h3>
                  <p className="text-gray-600">
                    {match.bowlingTeam.name} scored {match.firstInningsScore} runs
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                  <h3 className="font-semibold mb-2 font-display">Target</h3>
                  <p className="text-3xl font-bold text-orange-600 font-display">
                    {target} runs to win
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleInningsSetup}
                    className="gradient-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200"
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
            <div className="glass-effect rounded-2xl p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 text-emerald-600 font-display">
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
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div>
            <span className="font-medium">Saving...</span>
          </div>
        )}
        {saveError && (
          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{saveError}</span>
          </div>
        )}
        {!isSaving && !saveError && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-sm font-medium">Synced</span>
          </div>
        )}
      </div>
    </div>
  );
};