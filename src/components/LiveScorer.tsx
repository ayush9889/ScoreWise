import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, BarChart3, RefreshCw, AlertCircle, Trophy, UserPlus, X, Wifi, WifiOff } from 'lucide-react';
import { Match, Ball, Player } from '../types/cricket';
import { CompactScoreDisplay } from './CompactScoreDisplay';
import { ScoringPanel } from './ScoringPanel';
import { PlayerSelector } from './PlayerSelector';
import { InningsBreakModal } from './InningsBreakModal';
import { InningsSetupModal } from './InningsSetupModal';
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
  const [actionHistory, setActionHistory] = useState<Ball[]>([]);
  const [redoStack, setRedoStack] = useState<Ball[]>([]);

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [needsBowlerChange, setNeedsBowlerChange] = useState(false);
  const [needsNewBatsman, setNeedsNewBatsman] = useState(false);

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
          }
        }
      } catch (error) {
        console.error('Error loading match from cloud:', error);
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
        
        await cloudStorageService.saveMatch(match).catch((error) => {
          console.log('Cloud sync temporarily unavailable, continuing in offline mode');
        });
        
        setRetryCount(0);
      } catch (error) {
        console.log('Unexpected error during save operation, continuing in offline mode');
      } finally {
        setIsSaving(false);
      }
    };
    saveMatch();
  }, [match, isOnline]);

  // Calculate remaining runs and balls
  useEffect(() => {
    if (match.isSecondInnings) {
      const totalBalls = match.totalOvers * 6;
      const ballsBowled = (match.battingTeam.overs * 6) + match.battingTeam.balls;
      setTarget(match.firstInningsScore + 1);
    }
  }, [match.battingTeam.score, match.battingTeam.overs, match.battingTeam.balls, match.isSecondInnings, match.firstInningsScore]);

  // Update player stats after match completion with enhanced tracking
  useEffect(() => {
    const updatePlayerStats = async () => {
      if (match.isCompleted) {
        try {
          console.log('Updating player stats after match completion...');
          
          // Get all players who participated in the match
          const allMatchPlayers = [...match.team1.players, ...match.team2.players];
          console.log('Players to update:', allMatchPlayers.map(p => p.name));
          
          // Update stats for each player
          for (const player of allMatchPlayers) {
            console.log(`Updating stats for ${player.name}...`);
            
            // Calculate updated stats using cricket engine
            const updatedStats = CricketEngine.updatePlayerStats(player, match);
            
            // Create updated player object
            const updatedPlayer = { 
              ...player, 
              stats: updatedStats 
            };
            
            // Save to storage
            await storageService.savePlayer(updatedPlayer);
            console.log(`Stats updated for ${player.name}:`, {
              matches: updatedStats.matchesPlayed,
              runs: updatedStats.runsScored,
              wickets: updatedStats.wicketsTaken,
              motm: updatedStats.motmAwards
            });
          }
          
          console.log('All player stats updated successfully');
          
          // Force refresh of dashboard data by triggering a storage event
          window.dispatchEvent(new CustomEvent('playerStatsUpdated'));
          
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
    
    // Swap teams
    const temp = updatedMatch.battingTeam;
    updatedMatch.battingTeam = updatedMatch.bowlingTeam;
    updatedMatch.bowlingTeam = temp;
    
    updatedMatch.firstInningsScore = temp.score;
    setTarget(temp.score + 1);
    
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

  const handleInningsSetup = (striker: Player, nonStriker: Player, bowler: Player) => {
    const updatedMatch = { ...match };
    updatedMatch.currentStriker = striker;
    updatedMatch.currentNonStriker = nonStriker;
    updatedMatch.currentBowler = bowler;

    // Add players to their respective teams if not already present
    if (!updatedMatch.battingTeam.players.find(p => p.id === striker.id)) {
      updatedMatch.battingTeam.players.push(striker);
    }
    if (!updatedMatch.battingTeam.players.find(p => p.id === nonStriker.id)) {
      updatedMatch.battingTeam.players.push(nonStriker);
    }
    if (!updatedMatch.bowlingTeam.players.find(p => p.id === bowler.id)) {
      updatedMatch.bowlingTeam.players.push(bowler);
    }

    setMatch(updatedMatch);
    setShowInningsSetup(false);
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
      console.log('Man of the Match:', motm.name);
    }
    
    setMatch(updatedMatch);
    setShowVictoryAnimation(true);
    
    setTimeout(() => {
      setShowVictoryAnimation(false);
      onMatchComplete(updatedMatch);
    }, 3000);
  };

  const handleScoreUpdate = (ball: Ball) => {
    console.log(`\n🏏 PROCESSING BALL: ${ball.runs} runs by ${ball.striker.name} off ${ball.bowler.name}`);
    
    // Add to action history for undo functionality
    setActionHistory([...actionHistory, ball]);
    setRedoStack([]); // Clear redo stack when new action is performed

    // Process the ball using cricket engine
    let updatedMatch = CricketEngine.processBall(match, ball);

    console.log(`📊 After ball: ${updatedMatch.battingTeam.score}/${updatedMatch.battingTeam.wickets} in ${updatedMatch.battingTeam.overs}.${updatedMatch.battingTeam.balls}`);

    // CRITICAL: Check if over is complete and bowler needs to be changed
    const isOverComplete = CricketEngine.isOverComplete(updatedMatch);
    
    if (isOverComplete) {
      console.log(`🚨 OVER ${updatedMatch.battingTeam.overs} COMPLETED - BOWLER CHANGE MANDATORY!`);
      
      setOverCompleteMessage(`Over ${updatedMatch.battingTeam.overs} completed!`);
      setNeedsBowlerChange(true);
      
      // Get available bowlers for next over with ABSOLUTE filtering
      const nextOver = updatedMatch.battingTeam.overs + 1;
      const availableBowlers = CricketEngine.getAvailableBowlers(updatedMatch, nextOver);
      
      console.log(`🔍 Available bowlers for over ${nextOver}:`, availableBowlers.map(b => b.name));
      
      if (availableBowlers.length === 0) {
        console.log(`🚨 CRITICAL: NO AVAILABLE BOWLERS FOR OVER ${nextOver}!`);
        alert('🚨 CRITICAL ERROR: No eligible bowlers available for the next over!\n\nPlease add more bowlers to the team immediately.');
        setAddPlayerType('bowling');
        setShowAddPlayerModal(true);
      } else {
        console.log(`✅ Showing bowler selector for over ${nextOver}`);
        setShowBowlerSelector(true);
      }
    }

    // Check for wicket - need new batsman
    if (ball.isWicket) {
      console.log(`🏏 WICKET! ${ball.striker.name} is out`);
      setNeedsNewBatsman(true);
      setShowNewBatsmanSelector(true);
    }

    // Check for innings completion
    if (CricketEngine.isInningsComplete(updatedMatch)) {
      console.log(`🏁 INNINGS COMPLETE!`);
      if (!updatedMatch.isSecondInnings) {
        console.log(`🔄 Moving to second innings`);
        handleInningsTransition();
      } else {
        console.log(`🏆 MATCH COMPLETE!`);
        handleMatchComplete();
      }
    }

    setMatch(updatedMatch);
  };

  const handleBowlerChange = (newBowler: Player) => {
    console.log(`\n🏏 ATTEMPTING BOWLER CHANGE TO: ${newBowler.name}`);
    
    const updatedMatch = { ...match };
    
    // ABSOLUTE VALIDATION: Check if this bowler can bowl the next over
    const nextOver = updatedMatch.battingTeam.overs + 1;
    const canBowl = CricketEngine.canBowlerBowlNextOver(newBowler, updatedMatch);
    
    if (!canBowl) {
      console.log(`❌ BOWLER CHANGE REJECTED: ${newBowler.name} cannot bowl consecutive overs!`);
      alert(`🚫 RULE VIOLATION!\n\n${newBowler.name} cannot bowl consecutive overs!\n\nThis is a fundamental cricket rule. Please select a different bowler.`);
      return;
    }
    
    console.log(`✅ BOWLER CHANGE APPROVED: ${newBowler.name} can bowl over ${nextOver}`);
    
    // Update bowler
    updatedMatch.previousBowler = updatedMatch.currentBowler;
    updatedMatch.currentBowler = newBowler;
    
    console.log(`🔄 Bowler changed: ${updatedMatch.previousBowler?.name} → ${newBowler.name}`);
    
    // Add bowler to bowling team if not already present
    if (!updatedMatch.bowlingTeam.players.find(p => p.id === newBowler.id)) {
      updatedMatch.bowlingTeam.players.push(newBowler);
      console.log(`➕ Added ${newBowler.name} to bowling team`);
    }
    
    setMatch(updatedMatch);
    setShowBowlerSelector(false);
    setNeedsBowlerChange(false);
    setOverCompleteMessage(null);
    
    console.log(`✅ BOWLER CHANGE COMPLETE - READY FOR OVER ${nextOver}`);
  };

  const handleNewBatsman = (newBatsman: Player) => {
    const updatedMatch = { ...match };
    
    // Replace the out batsman (striker) with new batsman
    updatedMatch.currentStriker = newBatsman;
    
    // Add new batsman to batting team if not already present
    if (!updatedMatch.battingTeam.players.find(p => p.id === newBatsman.id)) {
      updatedMatch.battingTeam.players.push(newBatsman);
    }
    
    setMatch(updatedMatch);
    setShowNewBatsmanSelector(false);
    setNeedsNewBatsman(false);
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) return;

    const lastBall = actionHistory[actionHistory.length - 1];
    const updatedMatch = { ...match };

    // Remove last ball from match
    updatedMatch.balls = updatedMatch.balls.filter(b => b.id !== lastBall.id);

    // Revert score changes
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

    // Revert ball count and overs
    if (!lastBall.isWide && !lastBall.isNoBall) {
      if (updatedMatch.battingTeam.balls === 0 && updatedMatch.battingTeam.overs > 0) {
        updatedMatch.battingTeam.overs--;
        updatedMatch.battingTeam.balls = 5;
      } else {
        updatedMatch.battingTeam.balls--;
      }
    }

    setMatch(updatedMatch);
    setActionHistory(actionHistory.slice(0, -1));
    setRedoStack([lastBall, ...redoStack]);
    setPendingStrikeRotation(false);
    setOverCompleteMessage(null);
    setNeedsBowlerChange(false);
    setNeedsNewBatsman(false);
  };

  const getAvailableBowlers = (): Player[] => {
    const nextOver = match.battingTeam.overs + 1;
    const availableBowlers = CricketEngine.getAvailableBowlers(match, nextOver);
    
    console.log(`🏏 GETTING AVAILABLE BOWLERS FOR SELECTOR:`);
    console.log(`Available bowlers:`, availableBowlers.map(b => b.name));
    
    return availableBowlers;
  };

  const getAvailableBatsmen = (): Player[] => {
    return match.battingTeam.players.filter(p => 
      p.id !== match.currentStriker?.id && 
      p.id !== match.currentNonStriker?.id
    );
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

      {/* CRITICAL: Over Complete Message with MANDATORY Bowler Change */}
      {overCompleteMessage && needsBowlerChange && (
        <div className="bg-red-100 border-l-4 border-red-500 p-3 m-2">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p className="text-red-700 text-sm font-bold">{overCompleteMessage}</p>
              <p className="text-red-600 text-xs mt-1 font-semibold">
                🚫 MANDATORY: Select new bowler to continue. Same bowler CANNOT bowl consecutive overs!
              </p>
            </div>
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
          onStrikeRotation={() => setPendingStrikeRotation(false)}
        />

        {/* Recent Balls */}
        {match.balls.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-2">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Recent Balls</h3>
            <div className="space-y-1">
              {match.balls.slice(-5).reverse().map((ball, index) => (
                <div key={ball.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0 text-xs">
                  <div className="text-gray-600">
                    {ball.overNumber}.{((ball.ballNumber - 1) % 6) + 1}
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

      {/* Innings Setup Modal */}
      {showInningsSetup && (
        <InningsSetupModal
          match={match}
          isOpen={showInningsSetup}
          onClose={() => setShowInningsSetup(false)}
          onSetupComplete={handleInningsSetup}
          isSecondInnings={isSecondInningsSetup}
        />
      )}

      {/* CRITICAL: Bowler Selector Modal with ABSOLUTE filtering and MANDATORY selection */}
      {showBowlerSelector && (
        <PlayerSelector
          title="🚫 MANDATORY: Select New Bowler (Cannot Bowl Consecutive Overs)"
          onPlayerSelect={handleBowlerChange}
          onClose={() => {
            // CRITICAL: Don't allow closing without selecting a bowler when it's mandatory
            if (needsBowlerChange) {
              alert('🚫 You MUST select a new bowler to continue!\n\nSame bowler cannot bowl consecutive overs.\n\nThis is a fundamental cricket rule.');
              return;
            }
            setShowBowlerSelector(false);
            setOverCompleteMessage(null);
            setNeedsBowlerChange(false);
          }}
          players={getAvailableBowlers()}
          excludePlayerIds={[
            match.currentBowler?.id || '',
            match.previousBowler?.id || '',
            match.currentStriker?.id || '',
            match.currentNonStriker?.id || ''
          ].filter(Boolean)}
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
          onClose={() => {
            setShowNewBatsmanSelector(false);
            setNeedsNewBatsman(false);
          }}
          players={getAvailableBatsmen()}
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

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <PlayerSelector
          title={`🚨 URGENT: Add ${addPlayerType === 'batting' ? 'Batsman' : 'Bowler'}`}
          onPlayerSelect={handleAddPlayer}
          onClose={() => setShowAddPlayerModal(false)}
          players={allPlayers}
          showOnlyAvailable={false}
          allowAddPlayer={true}
          groupId={currentGroup?.id}
        />
      )}

      <AnimatePresence>
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
              {match.manOfTheMatch && (
                <div className="mt-4">
                  <p className="text-lg font-semibold text-yellow-600">Man of the Match</p>
                  <p className="text-xl font-bold text-gray-900">{match.manOfTheMatch.name}</p>
                </div>
              )}
            </div>
          </motion.div>
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
          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
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