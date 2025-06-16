import React, { useState, useEffect } from 'react';
import { Users, Plus, Share2, Settings, Crown, UserPlus, Copy, Check, Phone, Mail, Link, Eye } from 'lucide-react';
import { Group, User } from '../types/auth';
import { Player } from '../types/cricket';
import { authService } from '../services/authService';
import { storageService } from '../services/storage';

interface GroupManagementProps {
  onBack: () => void;
}

export const GroupManagement: React.FC<GroupManagementProps> = ({ onBack }) => {
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddEmail, setQuickAddEmail] = useState('');
  const [quickAddPhone, setQuickAddPhone] = useState('');
  const [guestLink, setGuestLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroupData();
  }, []);

  const loadGroupData = async () => {
    const group = authService.getCurrentGroup();
    setCurrentGroup(group);
    
    if (group) {
      const groupMembers = await authService.getGroupMembers(group.id);
      setMembers(groupMembers);
      setGuestLink(authService.generateGuestLink(group.id));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const group = await authService.createGroup(groupName, groupDescription);
      setCurrentGroup(group);
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDescription('');
      await loadGroupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const group = await authService.joinGroup(inviteCode);
      setCurrentGroup(group);
      setShowJoinGroup(false);
      setInviteCode('');
      await loadGroupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;

    setLoading(true);
    setError('');

    try {
      await authService.inviteToGroup(
        currentGroup.id,
        inviteEmail || undefined,
        invitePhone || undefined
      );
      setShowInviteModal(false);
      setInviteEmail('');
      setInvitePhone('');
      alert('Invitation sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup || !quickAddName.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Create player with enhanced member information
      const player: Player = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: quickAddName.trim(),
        isGroupMember: true,
        groupIds: [currentGroup.id],
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

      // Send invitation if contact info provided
      if (quickAddEmail.trim() || quickAddPhone.trim()) {
        try {
          await authService.inviteToGroup(
            currentGroup.id, 
            quickAddEmail.trim() || undefined, 
            quickAddPhone.trim() || undefined
          );
        } catch (inviteError) {
          console.warn('Failed to send invitation:', inviteError);
        }
      }

      setShowQuickAddModal(false);
      setQuickAddName('');
      setQuickAddEmail('');
      setQuickAddPhone('');
      
      const contactMethod = quickAddEmail ? 'email' : quickAddPhone ? 'SMS' : 'manually';
      alert(`Player "${player.name}" added successfully!${quickAddEmail || quickAddPhone ? ` Invitation sent via ${contactMethod}.` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const currentUser = authService.getCurrentUser();
  const canManageGroup = currentGroup ? authService.canUserManageGroup(currentGroup.id) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-green-600 hover:text-green-700 font-semibold"
        >
          ← Back
        </button>
        <h1 className="font-bold text-xl text-gray-900">Group Management</h1>
        <div className="w-16"></div>
      </div>

      <div className="p-4 space-y-6">
        {!currentGroup ? (
          /* No Group State */
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join or Create a Group</h2>
            <p className="text-gray-600 mb-8">
              Create a group for your cricket team or join an existing one
            </p>

            <div className="space-y-4 max-w-md mx-auto">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Create New Group
              </button>

              <button
                onClick={() => setShowJoinGroup(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Users className="w-5 h-5 inline mr-2" />
                Join Existing Group
              </button>
            </div>
          </div>
        ) : (
          /* Group Dashboard */
          <div className="space-y-6">
            {/* Group Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentGroup.name}</h2>
                  {currentGroup.description && (
                    <p className="text-gray-600 mt-1">{currentGroup.description}</p>
                  )}
                </div>
                {canManageGroup && (
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{members.length}</div>
                  <div className="text-sm text-green-600">Members</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-700">{currentGroup.inviteCode}</div>
                  <div className="text-sm text-blue-600">Invite Code</div>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Actions */}
            {canManageGroup && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowQuickAddModal(true)}
                    className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <UserPlus className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-green-700">Quick Add Member</div>
                    <div className="text-xs text-green-600">Add player with email/phone</div>
                  </button>

                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-blue-700">Send Invitation</div>
                    <div className="text-xs text-blue-600">Email or SMS invite</div>
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => copyToClipboard(currentGroup.inviteCode)}
                    className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <Copy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-purple-700">Copy Invite Code</div>
                    <div className="text-xs text-purple-600">Share with new members</div>
                  </button>

                  <button
                    onClick={() => copyToClipboard(guestLink)}
                    className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <Eye className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-orange-700">Guest View Link</div>
                    <div className="text-xs text-orange-600">View-only access</div>
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Members List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Members ({members.length})
              </h3>
              <div className="space-y-3">
                {members.map((member) => {
                  const memberInfo = currentGroup.members.find(m => m.userId === member.id);
                  const isCurrentUser = member.id === currentUser?.id;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="font-semibold text-green-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900">{member.name}</div>
                            {isCurrentUser && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                          {member.phone && (
                            <div className="text-xs text-gray-400">{member.phone}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {memberInfo?.role === 'admin' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-sm text-gray-600 capitalize">{memberInfo?.role}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Sharing Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share & Invite</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={currentGroup.inviteCode}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(currentGroup.inviteCode)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this code with new members to join the group
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guest View Link (Read-Only Access)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={guestLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(guestLink)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Anyone with this link can view group stats without signing up
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter group name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe your group"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Join Group</h2>
            </div>
            <form onSubmit={handleJoinGroup} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                  placeholder="Enter 6-character invite code"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinGroup(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Send Invitation</h2>
            </div>
            <form onSubmit={handleInviteMember} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Alternative)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Provide either email or phone number to send invitation.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (!inviteEmail && !invitePhone)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Quick Add Player Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Quick Add Member</h2>
              <p className="text-sm text-gray-600 mt-1">Add a player and optionally invite them to join</p>
            </div>
            <form onSubmit={handleQuickAddPlayer} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player Name *
                </label>
                <input
                  type="text"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter player's name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={quickAddEmail}
                    onChange={(e) => setQuickAddEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter email for invitation"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={quickAddPhone}
                    onChange={(e) => setQuickAddPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter phone for invitation"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  💡 <strong>Tip:</strong> If you provide email or phone, we'll send them an invitation to join the group with their own account. They can then see their personalized dashboard when they sign up with the same contact info.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !quickAddName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};