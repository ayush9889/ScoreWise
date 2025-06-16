import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { Match } from '../types/cricket';

const MATCHES_COLLECTION = 'matches';

// Helper function to check if we're online
const isOnline = () => navigator.onLine;

// Helper function to check if error is permission-related
const isPermissionError = (error: any): boolean => {
  return error?.code === 'permission-denied' || 
         error?.message?.includes('Missing or insufficient permissions') ||
         error?.message?.includes('permission-denied');
};

// Helper function to check if error is network-related
const isNetworkError = (error: any): boolean => {
  return error?.code === 'unavailable' ||
         error?.message?.includes('unavailable') || 
         error?.message?.includes('network') ||
         error?.message?.includes('offline') ||
         error?.message?.includes('Failed to get document because the client is offline');
};

// Helper function to clean and prepare match data for Firestore
const prepareMatchData = (match: Match) => {
  // Create a deep copy of the match object
  const matchData = JSON.parse(JSON.stringify(match));

  // Convert dates to Firestore timestamps
  matchData.lastUpdated = serverTimestamp();
  matchData.startTime = Timestamp.fromDate(new Date(match.startTime));
  if (match.endTime) {
    matchData.endTime = Timestamp.fromDate(new Date(match.endTime));
  }

  // Ensure all nested objects are properly serialized
  if (matchData.battingTeam) {
    matchData.battingTeam = {
      ...matchData.battingTeam,
      players: matchData.battingTeam.players.map((player: any) => ({
        ...player,
        stats: { ...player.stats }
      }))
    };
  }

  if (matchData.bowlingTeam) {
    matchData.bowlingTeam = {
      ...matchData.bowlingTeam,
      players: matchData.bowlingTeam.players.map((player: any) => ({
        ...player,
        stats: { ...player.stats }
      }))
    };
  }

  if (matchData.balls) {
    matchData.balls = matchData.balls.map((ball: any) => ({
      ...ball,
      striker: { ...ball.striker },
      nonStriker: { ...ball.nonStriker },
      bowler: { ...ball.bowler }
    }));
  }

  return matchData;
};

export const cloudStorageService = {
  // Save match to cloud storage
  async saveMatch(match: Match): Promise<void> {
    try {
      console.log('Attempting to save match to cloud:', match.id);
      
      // Check if we're online
      if (!isOnline()) {
        console.log('Device is offline, match will be saved when connection is restored');
        return;
      }
      
      // Validate match data
      if (!match.id) {
        throw new Error('Match ID is required');
      }

      const matchData = prepareMatchData(match);
      const matchRef = doc(db, MATCHES_COLLECTION, match.id);
      
      await setDoc(matchRef, matchData, { merge: true });
      console.log('Successfully saved match to cloud:', match.id);
    } catch (error) {
      console.error('Error saving match to cloud:', error);
      
      // Handle permission errors gracefully
      if (isPermissionError(error)) {
        console.log('Permission denied - continuing in offline mode');
        return;
      }
      
      // Don't throw error for connection issues - let the app work offline
      if (isNetworkError(error)) {
        console.log('Network issue detected, continuing in offline mode');
        return;
      }
      
      // Only throw for other types of errors
      if (error instanceof Error) {
        throw new Error(`Failed to save match: ${error.message}`);
      }
      throw new Error('Failed to save match to cloud storage');
    }
  },

  // Get match from cloud storage
  async getMatch(matchId: string): Promise<Match | null> {
    try {
      console.log('Attempting to get match from cloud:', matchId);
      
      if (!matchId) {
        throw new Error('Match ID is required');
      }

      // Check if we're online
      if (!isOnline()) {
        console.log('Device is offline, cannot fetch from cloud');
        return null;
      }

      const matchRef = doc(db, MATCHES_COLLECTION, matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (matchDoc.exists()) {
        const data = matchDoc.data();
        console.log('Successfully retrieved match from cloud:', matchId);
        
        // Convert Firestore timestamps back to dates
        return {
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate(),
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        } as Match;
      }
      
      console.log('Match not found in cloud:', matchId);
      return null;
    } catch (error) {
      console.error('Error getting match from cloud:', error);
      
      // Handle permission errors gracefully
      if (isPermissionError(error)) {
        console.log('Permission denied - unable to access cloud data. Please check Firebase security rules.');
        return null;
      }
      
      // Don't throw error for connection issues
      if (isNetworkError(error)) {
        console.log('Network issue detected, returning null');
        return null;
      }
      
      // For other errors, return null instead of throwing
      console.log('Unexpected error accessing cloud storage, continuing with local data');
      return null;
    }
  },

  // Get recent matches
  async getRecentMatches(limitCount: number = 10): Promise<Match[]> {
    try {
      console.log('Attempting to get recent matches');
      
      // Check if we're online
      if (!isOnline()) {
        console.log('Device is offline, cannot fetch recent matches');
        return [];
      }
      
      const matchesQuery = query(
        collection(db, MATCHES_COLLECTION),
        orderBy('lastUpdated', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(matchesQuery);
      const matches = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime?.toDate(),
          lastUpdated: data.lastUpdated.toDate()
        } as Match;
      });
      
      console.log('Successfully retrieved recent matches:', matches.length);
      return matches;
    } catch (error) {
      console.error('Error getting recent matches:', error);
      
      // Handle permission errors gracefully
      if (isPermissionError(error)) {
        console.log('Permission denied - unable to access recent matches');
        return [];
      }
      
      // Don't throw error for connection issues
      if (isNetworkError(error)) {
        console.log('Network issue detected, returning empty array');
        return [];
      }
      
      // For other errors, return empty array instead of throwing
      console.log('Unexpected error accessing recent matches, returning empty array');
      return [];
    }
  },

  // Get match history for a team
  async getTeamMatches(teamName: string, limitCount: number = 10): Promise<Match[]> {
    try {
      console.log('Attempting to get team matches:', teamName);
      
      if (!teamName) {
        throw new Error('Team name is required');
      }

      // Check if we're online
      if (!isOnline()) {
        console.log('Device is offline, cannot fetch team matches');
        return [];
      }

      const matchesQuery = query(
        collection(db, MATCHES_COLLECTION),
        orderBy('lastUpdated', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(matchesQuery);
      const matches = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            ...data,
            startTime: data.startTime.toDate(),
            endTime: data.endTime?.toDate(),
            lastUpdated: data.lastUpdated.toDate()
          } as Match;
        })
        .filter(match => 
          match.team1.name === teamName || 
          match.team2.name === teamName
        );
      
      console.log('Successfully retrieved team matches:', matches.length);
      return matches;
    } catch (error) {
      console.error('Error getting team matches:', error);
      
      // Handle permission errors gracefully
      if (isPermissionError(error)) {
        console.log('Permission denied - unable to access team matches');
        return [];
      }
      
      // Don't throw error for connection issues
      if (isNetworkError(error)) {
        console.log('Network issue detected, returning empty array');
        return [];
      }
      
      // For other errors, return empty array instead of throwing
      console.log('Unexpected error accessing team matches, returning empty array');
      return [];
    }
  },

  // Check connection status
  async checkConnection(): Promise<boolean> {
    try {
      if (!isOnline()) {
        return false;
      }
      
      // Try to enable network connection
      await enableNetwork(db);
      return true;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  },

  // Force offline mode
  async goOffline(): Promise<void> {
    try {
      await disableNetwork(db);
      console.log('Firestore is now offline');
    } catch (error) {
      console.error('Failed to go offline:', error);
    }
  },

  // Force online mode
  async goOnline(): Promise<void> {
    try {
      await enableNetwork(db);
      console.log('Firestore is now online');
    } catch (error) {
      console.error('Failed to go online:', error);
    }
  }
};