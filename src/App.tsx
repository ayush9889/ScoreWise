import React, { useState, useEffect } from 'react';
import { MatchSetup } from './components/MatchSetup';
import { LiveScorer } from './components/LiveScorer';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { GroupManagement } from './components/GroupManagement';
import { AddPlayerModal } from './components/AddPlayerModal';
import { Match, Player } from './types/cricket';
import { User, Group } from './types/auth';
import { storageService } from './services/storage';
import { authService } from './services/authService';
import { Trophy, BarChart3, Play, Award, Users, UserPlus, LogIn, LogOut, Zap } from 'lucide-react';

type AppState = 'home' | 'auth' | 'group-management' | 'match-setup' | 'live-scoring' | 'dashboard' | 'match-complete';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await storageService.init();
      
      // Check for existing user session
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const group = authService.getCurrentGroup();
        if (group) {
          setCurrentGroup(group);
        }
      }
      
      // Check for ongoing match
      const savedMatch = await storageService.getMatch('current_match');
      if (savedMatch && !savedMatch.isCompleted) {
        setCurrentMatch(savedMatch);
        setCurrentState('live-scoring');
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true); // Continue even if storage fails
    }
  };

  const handleAuthSuccess = () => {
    const user = authService.getCurrentUser();
    const group = authService.getCurrentGroup();
    setCurrentUser(user);
    setCurrentGroup(group);
    setShowAuthModal(false);
    
    if (!group) {
      setCurrentState('group-management');
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setCurrentGroup(null);
    setCurrentState('home');
  };

  const handleMatchStart = async (match: Match) => {
    // Save as current match for persistence
    await storageService.saveMatch({ ...match, id: 'current_match' });
    setCurrentMatch(match);
    setCurrentState('live-scoring');
  };

  const handleMatchComplete = async (match: Match) => {
    // Save completed match with unique ID
    const completedMatch = { ...match, id: `match_${Date.now()}` };
    await storageService.saveMatch(completedMatch);
    
    // Clear current match
    await storageService.clearCurrentMatch();
    
    setCurrentMatch(completedMatch);
    setCurrentState('match-complete');
  };

  const handleBackToHome = async () => {
    // Clear current match if going back to home
    if (currentMatch && !currentMatch.isCompleted) {
      await storageService.clearCurrentMatch();
    }
    setCurrentState('home');
    setCurrentMatch(null);
  };

  const handlePlayerAdded = async (player: Player) => {
    // Refresh any necessary data
    console.log('Player added:', player);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-brand mb-2">ScoreWise</h1>
          <p className="text-gray-600 text-lg">Initializing your cricket experience...</p>
        </div>
      </div>
    );
  }

  if (currentState === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Header */}
        <div className="pt-8 pb-4 px-4">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <div></div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddPlayerModal(true)}
                className="p-3 glass-effect rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                title="Add Player"
              >
                <UserPlus className="w-5 h-5 text-emerald-600" />
              </button>
              
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                    {currentUser.photoUrl ? (
                      <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-3 glass-effect rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="p-3 glass-effect rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  title="Sign In"
                >
                  <LogIn className="w-5 h-5 text-emerald-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4">
          <div className="text-center mb-12">
            <div className="gradient-primary w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-premium">
              <Zap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-black text-gray-900 mb-4 font-brand text-shadow">
              Score<span className="text-emerald-600">Wise</span>
            </h1>
            <p className="text-gray-600 text-xl font-medium">Professional Cricket Scoring Made Simple</p>
            
            {currentUser && currentGroup && (
              <div className="mt-6 p-4 glass-effect rounded-2xl shadow-lg max-w-md mx-auto">
                <p className="text-sm text-gray-600">Welcome back, <span className="font-semibold text-gray-900">{currentUser.name}</span></p>
                <p className="text-sm text-emerald-600 font-medium">Group: {currentGroup.name}</p>
              </div>
            )}
          </div>

          {/* Main Actions */}
          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={() => {
                if (currentUser) {
                  setCurrentState('match-setup');
                } else {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }
              }}
              className="w-full glass-effect rounded-3xl shadow-premium p-8 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-emerald-200 group"
            >
              <div className="flex items-center">
                <div className="gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-200">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">New Match</h3>
                  <p className="text-gray-600 font-medium">Start scoring a new cricket match</p>
                  {!currentUser && (
                    <p className="text-sm text-orange-600 mt-2 font-medium">Sign in required</p>
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={() => setCurrentState('dashboard')}
              className="w-full glass-effect rounded-3xl shadow-premium p-8 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 group"
            >
              <div className="flex items-center">
                <div className="gradient-secondary w-16 h-16 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">Dashboard</h3>
                  <p className="text-gray-600 font-medium">View stats, leaderboards & match history</p>
                </div>
              </div>
            </button>

            {currentUser && (
              <button
                onClick={() => setCurrentState('group-management')}
                className="w-full glass-effect rounded-3xl shadow-premium p-8 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200 group"
              >
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">Manage Group</h3>
                    <p className="text-gray-600 font-medium">Create or join cricket groups</p>
                  </div>
                </div>
              </button>
            )}

            {!currentUser && (
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="w-full glass-effect rounded-3xl shadow-premium p-8 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-emerald-200 group"
              >
                <div className="flex items-center">
                  <div className="gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">Join Community</h3>
                    <p className="text-gray-600 font-medium">Create account to manage groups & track stats</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Features */}
          <div className="max-w-4xl mx-auto mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 font-display">Built for Modern Cricket</h2>
              <p className="text-gray-600 text-lg">Everything you need for professional scoring</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-effect rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all duration-300">
                <div className="gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg font-display">Lightning Fast</h3>
                <p className="text-gray-600">Instant setup with just team names and toss</p>
              </div>

              <div className="glass-effect rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all duration-300">
                <div className="gradient-secondary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg font-display">Smart Analytics</h3>
                <p className="text-gray-600">Real-time stats and professional leaderboards</p>
              </div>

              <div className="glass-effect rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg font-display">Team Features</h3>
                <p className="text-gray-600">Groups, invitations, and shared statistics</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-20 pb-12">
            <p className="text-gray-500 font-medium">
              Perfect for club matches, tournaments & practice games
            </p>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
        />

        {/* Add Player Modal */}
        <AddPlayerModal
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          onPlayerAdded={handlePlayerAdded}
          groupId={currentGroup?.id}
        />
      </div>
    );
  }

  if (currentState === 'group-management') {
    return <GroupManagement onBack={handleBackToHome} />;
  }

  if (currentState === 'match-setup') {
    return <MatchSetup onMatchStart={handleMatchStart} />;
  }

  if (currentState === 'live-scoring' && currentMatch) {
    return (
      <LiveScorer
        match={currentMatch}
        onMatchComplete={handleMatchComplete}
        onBack={handleBackToHome}
      />
    );
  }

  if (currentState === 'dashboard') {
    return <Dashboard onBack={handleBackToHome} />;
  }

  if (currentState === 'match-complete' && currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="glass-effect rounded-3xl shadow-premium p-8 w-full max-w-md text-center">
          <div className="gradient-primary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3 font-display">Match Complete!</h1>
          
          {/* Match Result */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 text-center font-display">
              {currentMatch.team1.name} vs {currentMatch.team2.name}
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium">{currentMatch.team1.name}</span>
                <span className="font-bold text-lg">
                  {currentMatch.team1.score}/{currentMatch.team1.wickets} ({currentMatch.team1.overs}.{currentMatch.team1.balls})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">{currentMatch.team2.name}</span>
                <span className="font-bold text-lg">
                  {currentMatch.team2.score}/{currentMatch.team2.wickets} ({currentMatch.team2.overs}.{currentMatch.team2.balls})
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Winner</div>
              <div className="text-2xl font-bold text-emerald-600 font-display">{currentMatch.winner}</div>
            </div>
          </div>

          {/* Man of the Match */}
          {currentMatch.manOfTheMatch && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8 border border-yellow-200">
              <div className="flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-yellow-600 mr-2" />
                <span className="font-bold text-yellow-700 font-display">Man of the Match</span>
              </div>
              <div className="text-xl font-bold text-gray-900 font-display">
                {currentMatch.manOfTheMatch.name}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => setCurrentState('match-setup')}
              className="w-full gradient-primary text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-200"
            >
              Start New Match
            </button>
            
            <button
              onClick={() => setCurrentState('dashboard')}
              className="w-full gradient-secondary text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-200"
            >
              View Dashboard
            </button>
            
            <button
              onClick={handleBackToHome}
              className="w-full bg-gray-200 text-gray-700 py-4 px-6 rounded-2xl font-bold text-lg hover:bg-gray-300 transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;