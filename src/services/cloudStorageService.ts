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
  serverTimestamp 
} from 'firebase/firestore';
import { Match } from '../types/match';

const MATCHES_COLLECTION = 'matches';

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
      if (error instanceof Error) {
        throw new Error(`Failed to get match: ${error.message}`);
      }
      throw new Error('Failed to get match from cloud storage');
    }
  },

  // Get recent matches
  async getRecentMatches(limit: number = 10): Promise<Match[]> {
    try {
      console.log('Attempting to get recent matches');
      
      const matchesQuery = query(
        collection(db, MATCHES_COLLECTION),
        orderBy('lastUpdated', 'desc'),
        limit(limit)
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
      if (error instanceof Error) {
        throw new Error(`Failed to get recent matches: ${error.message}`);
      }
      throw new Error('Failed to get recent matches from cloud storage');
    }
  },

  // Get match history for a team
  async getTeamMatches(teamName: string, limit: number = 10): Promise<Match[]> {
    try {
      console.log('Attempting to get team matches:', teamName);
      
      if (!teamName) {
        throw new Error('Team name is required');
      }

      const matchesQuery = query(
        collection(db, MATCHES_COLLECTION),
        orderBy('lastUpdated', 'desc'),
        limit(limit)
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
      if (error instanceof Error) {
        throw new Error(`Failed to get team matches: ${error.message}`);
      }
      throw new Error('Failed to get team matches from cloud storage');
    }
  }
};