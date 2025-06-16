import React, { useState, useEffect } from 'react';
import { MatchSetup } from './components/MatchSetup';
import { LiveScorer } from './components/LiveScorer';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { GroupManagement } from './components/GroupManagement';
import { AdminDashboard } from './components/AdminDashboard';
import { AddPlayerModal } from './components/AddPlayerModal';
import { Match, Player } from './types/cricket';
import { User, Group } from './types/auth';
import { storageService } from './services/storage';
import { authService } from './services/authService';
import { Trophy, BarChart3, Play, Award, Users, UserPlus, LogIn, LogOut, Crown } from 'lucide-react';

type AppState = 'home' | 'auth' | 'group-management' | 'admin-dashboard' | 'match-setup' | 'live-scoring' | 'dashboard' | 'match-complete';

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
        await authService.loadUserGroups();
        const group = authService.getCurrentGroup();
        if (group) {
          setCurrentGroup(group);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true); // Continue even if storage fails
    }
  };

  const handleAuthSuccess = async () => {
    const user = authService.getCurrentUser();
    await authService.loadUserGroups();
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

  const handleMatchStart = (match: Match) => {
    setCurrentMatch(match);
    setCurrentState('live-scoring');
  };

  const handleMatchComplete = (match: Match) => {
    setCurrentMatch(match);
    setCurrentState('match-complete');
  };

  const handleBackToHome = () => {
    setCurrentState('home');
    setCurrentMatch(null);
  };

  const handlePlayerAdded = async (player: Player) => {
    // Refresh any necessary data
    console.log('Player added:', player);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Initializing Cricket Scorer...</p>
        </div>
      </div>
    );
  }

  if (currentState === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        {/* Header */}
        <div className="pt-8 pb-4 px-4">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <div></div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddPlayerModal(true)}
                className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                title="Add Player"
              >
                <UserPlus className="w-5 h-5 text-green-600" />
              </button>
              
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  {/* Admin Dashboard Button */}
                  <button
                    onClick={() => setCurrentState('admin-dashboard')}
                    className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                    title="Admin Dashboard"
                  >
                    <Crown className="w-5 h-5 text-yellow-600" />
                  </button>
                  
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    {currentUser.photoUrl ? (
                      <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-green-600 font-semibold text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
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
                  className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                  title="Sign In"
                >
                  <LogIn className="w-5 h-5 text-green-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4">
          <div className="text-center mb-8">
            <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Cricket Scorer</h1>
            <p className="text-gray-600 text-lg">Fast & Simple Community Cricket Scoring</p>
            
            {currentUser && currentGroup && (
              <div className="mt-4 p-3 bg-white rounded-lg shadow-sm max-w-md mx-auto">
                <p className="text-sm text-gray-600">Signed in as <span className="font-semibold">{currentUser.name}</span></p>
                <p className="text-sm text-green-600">Group: {currentGroup.name}</p>
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
              className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-green-200"
            >
              <div className="flex items-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">New Match</h3>
                  <p className="text-gray-600">Start scoring a new cricket match</p>
                  {!currentUser && (
                    <p className="text-sm text-orange-600 mt-1">Sign in required</p>
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={() => setCurrentState('dashboard')}
              className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Dashboard</h3>
                  <p className="text-gray-600">View stats, leaderboards & match history</p>
                </div>
              </div>
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => setCurrentState('admin-dashboard')}
                  className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-yellow-200"
                >
                  <div className="flex items-center">
                    <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                      <Crown className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Admin Dashboard</h3>
                      <p className="text-gray-600">Manage groups & view personal stats</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentState('group-management')}
                  className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-200"
                >
                  <div className="flex items-center">
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Manage Group</h3>
                      <p className="text-gray-600">Create or join cricket groups</p>
                    </div>
                  </div>
                </button>
              </>
            )}

            {!currentUser && (
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-green-200"
              >
                <div className="flex items-center">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">Join Community</h3>
                    <p className="text-gray-600">Create account to manage groups & track stats</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Features */}
          <div className="max-w-4xl mx-auto mt-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Built for Community Cricket</h2>
              <p className="text-gray-600">Everything you need for local matches</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">STRICT Match Format</h3>
                <p className="text-gray-600 text-sm">Exactly N overs - no more, no less. Perfect format enforcement</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Stats</h3>
                <p className="text-gray-600 text-sm">Automatic player tracking and personalized dashboards</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Member Management</h3>
                <p className="text-gray-600 text-sm">Email/phone invites, guest links, admin controls</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16 pb-8">
            <p className="text-gray-500 text-sm">
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

  if (currentState === 'admin-dashboard') {
    return <AdminDashboard onBack={handleBackToHome} />;
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Match Complete!</h1>
          
          {/* Match Result */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="text-lg font-semibold text-gray-900 mb-4">
              {currentMatch.team1.name} vs {currentMatch.team2.name}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>{currentMatch.team1.name}</span>
                <span className="font-semibold">
                  {currentMatch.team1.score}/{currentMatch.team1.wickets} ({currentMatch.team1.overs}.{currentMatch.team1.balls})
                </span>
              </div>
              <div className="flex justify-between">
                <span>{currentMatch.team2.name}</span>
                <span className="font-semibold">
                  {currentMatch.team2.score}/{currentMatch.team2.wickets} ({currentMatch.team2.overs}.{currentMatch.team2.balls})
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Winner</div>
              <div className="text-xl font-bold text-green-600">{currentMatch.winner}</div>
            </div>
          </div>

          {/* Man of the Match */}
          {currentMatch.manOfTheMatch && (
            <div className="bg-yellow-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-semibold text-yellow-700">Man of the Match</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {currentMatch.manOfTheMatch.name}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setCurrentState('match-setup')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Start New Match
            </button>
            
            <button
              onClick={() => setCurrentState('dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              View Dashboard
            </button>
            
            <button
              onClick={handleBackToHome}
              className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
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