import { Match, Player, Ball, Team, WicketType, PlayerStats, PlayerPerformance } from '../types/cricket';

export class CricketEngine {
  static calculateManOfTheMatch(match: Match): Player | null {
    if (!match.isCompleted) return null;

    const allPlayers = [...match.team1.players, ...match.team2.players];
    const performances: PlayerPerformance[] = [];

    allPlayers.forEach(player => {
      const performance = this.calculatePlayerPerformance(player, match);
      performances.push(performance);
    });

    // Sort by total performance score
    performances.sort((a, b) => b.totalScore - a.totalScore);
    
    if (performances.length === 0) return null;
    
    const topPerformer = performances[0];
    return allPlayers.find(p => p.id === topPerformer.playerId) || null;
  }

  private static calculatePlayerPerformance(player: Player, match: Match): PlayerPerformance {
    let battingScore = 0;
    let bowlingScore = 0;
    let fieldingScore = 0;

    // Batting Performance
    const battingBalls = match.balls.filter(b => b.striker.id === player.id);
    let runsScored = 0;
    let ballsFaced = 0;
    let fours = 0;
    let sixes = 0;
    let gotOut = false;

    battingBalls.forEach(ball => {
      if (ball.striker.id === player.id) {
        if (!ball.isWide && !ball.isNoBall && !ball.isBye && !ball.isLegBye) {
          runsScored += ball.runs;
        }
        if (!ball.isWide && !ball.isNoBall) {
          ballsFaced++;
        }
        if (ball.runs === 4) fours++;
        if (ball.runs === 6) sixes++;
        if (ball.isWicket) gotOut = true;
      }
    });

    // Batting score calculation (based on CricHQ/CricHero algorithms)
    if (ballsFaced > 0) {
      const strikeRate = (runsScored / ballsFaced) * 100;
      
      // Base runs score
      battingScore += runsScored * 1.5;
      
      // Strike rate bonus/penalty
      if (strikeRate >= 150) battingScore += runsScored * 0.4;
      else if (strikeRate >= 120) battingScore += runsScored * 0.2;
      else if (strikeRate < 80 && ballsFaced >= 10) battingScore -= runsScored * 0.1;
      
      // Milestone bonuses
      if (runsScored >= 100) battingScore += 50;
      else if (runsScored >= 50) battingScore += 25;
      else if (runsScored >= 30) battingScore += 10;
      
      // Boundary bonuses
      battingScore += fours * 2;
      battingScore += sixes * 4;
      
      // Not out bonus for significant scores
      if (!gotOut && runsScored >= 20) battingScore += 10;
      
      // Duck penalty
      if (gotOut && runsScored === 0) battingScore -= 10;
    }

    // Bowling Performance
    const bowlingBalls = match.balls.filter(b => b.bowler.id === player.id);
    let wicketsTaken = 0;
    let runsConceded = 0;
    let ballsBowled = 0;
    let dotBalls = 0;

    bowlingBalls.forEach(ball => {
      if (!ball.isWide && !ball.isNoBall) {
        ballsBowled++;
        if (ball.runs === 0) dotBalls++;
      }
      if (ball.isWicket && ball.wicketType !== 'run_out') {
        wicketsTaken++;
      }
      runsConceded += ball.runs;
    });

    // Bowling score calculation
    if (ballsBowled > 0) {
      const economyRate = (runsConceded / ballsBowled) * 6;
      const dotBallPercentage = (dotBalls / ballsBowled) * 100;
      
      // Wicket points
      bowlingScore += wicketsTaken * 25;
      
      // Economy rate bonus/penalty
      if (economyRate <= 4) bowlingScore += 20;
      else if (economyRate <= 6) bowlingScore += 10;
      else if (economyRate >= 10) bowlingScore -= 10;
      
      // Dot ball bonus
      if (dotBallPercentage >= 60) bowlingScore += 15;
      else if (dotBallPercentage >= 40) bowlingScore += 8;
      
      // Wicket milestone bonuses
      if (wicketsTaken >= 5) bowlingScore += 30;
      else if (wicketsTaken >= 3) bowlingScore += 15;
      
      // Maiden over bonus (if applicable)
      const overs = Math.floor(ballsBowled / 6);
      if (overs > 0 && runsConceded === 0) bowlingScore += overs * 10;
    }

    // Fielding Performance
    const catches = match.balls.filter(b => 
      b.isWicket && b.wicketType === 'caught' && b.fielder?.id === player.id
    ).length;
    
    const runOuts = match.balls.filter(b => 
      b.isWicket && b.wicketType === 'run_out' && b.fielder?.id === player.id
    ).length;

    const stumpings = match.balls.filter(b => 
      b.isWicket && b.wicketType === 'stumped' && b.fielder?.id === player.id
    ).length;

    // Fielding score calculation
    fieldingScore += catches * 8;
    fieldingScore += runOuts * 12;
    fieldingScore += stumpings * 10;

    const totalScore = battingScore + bowlingScore + fieldingScore;

    return {
      playerId: player.id,
      battingScore,
      bowlingScore,
      fieldingScore,
      totalScore,
      runsScored,
      ballsFaced,
      wicketsTaken,
      catches,
      runOuts
    };
  }

  static updatePlayerStats(player: Player, match: Match): PlayerStats {
    const stats = { ...player.stats };
    stats.matchesPlayed++;

    // Batting stats
    const battingBalls = match.balls.filter(b => b.striker.id === player.id);
    let runsScored = 0;
    let ballsFaced = 0;
    let fours = 0;
    let sixes = 0;
    let gotOut = false;
    let dotBalls = 0;

    battingBalls.forEach(ball => {
      if (ball.striker.id === player.id) {
        if (!ball.isWide && !ball.isNoBall && !ball.isBye && !ball.isLegBye) {
          runsScored += ball.runs;
        }
        if (!ball.isWide && !ball.isNoBall) {
          ballsFaced++;
          if (ball.runs === 0) dotBalls++;
        }
        if (ball.runs === 4) fours++;
        if (ball.runs === 6) sixes++;
        if (ball.isWicket) gotOut = true;
      }
    });

    stats.runsScored += runsScored;
    stats.ballsFaced += ballsFaced;
    stats.fours += fours;
    stats.sixes += sixes;
    stats.dotBalls += dotBalls;
    if (gotOut) stats.timesOut++;
    if (gotOut && runsScored === 0) stats.ducks++;
    if (runsScored >= 50 && runsScored < 100) stats.fifties++;
    if (runsScored >= 100) stats.hundreds++;
    if (runsScored > stats.highestScore) stats.highestScore = runsScored;

    // Bowling stats
    const bowlingBalls = match.balls.filter(b => b.bowler.id === player.id);
    let wicketsTaken = 0;
    let runsConceded = 0;
    let ballsBowled = 0;
    let maidenOvers = 0;

    // Calculate bowling stats per over
    const bowlingOvers = new Map<number, { runs: number, wickets: number, balls: number }>();
    
    bowlingBalls.forEach(ball => {
      if (!ball.isWide && !ball.isNoBall) {
        ballsBowled++;
      }
      if (ball.isWicket && ball.wicketType !== 'run_out') {
        wicketsTaken++;
      }
      runsConceded += ball.runs;

      // Track per over
      const overKey = ball.overNumber;
      if (!bowlingOvers.has(overKey)) {
        bowlingOvers.set(overKey, { runs: 0, wickets: 0, balls: 0 });
      }
      const overStats = bowlingOvers.get(overKey)!;
      overStats.runs += ball.runs;
      if (ball.isWicket && ball.wicketType !== 'run_out') {
        overStats.wickets++;
      }
      if (!ball.isWide && !ball.isNoBall) {
        overStats.balls++;
      }
    });

    // Count maiden overs
    bowlingOvers.forEach(overStat => {
      if (overStat.balls === 6 && overStat.runs === 0) {
        maidenOvers++;
      }
    });

    stats.wicketsTaken += wicketsTaken;
    stats.ballsBowled += ballsBowled;
    stats.runsConceded += runsConceded;
    stats.maidenOvers += maidenOvers;

    // Update best bowling figures
    if (wicketsTaken > 0) {
      const currentFigures = `${wicketsTaken}/${runsConceded}`;
      if (!stats.bestBowlingFigures || this.compareBowlingFigures(currentFigures, stats.bestBowlingFigures)) {
        stats.bestBowlingFigures = currentFigures;
      }
    }

    // Fielding stats
    const catches = match.balls.filter(b => 
      b.isWicket && b.wicketType === 'caught' && b.fielder?.id === player.id
    ).length;
    
    const runOuts = match.balls.filter(b => 
      b.isWicket && b.wicketType === 'run_out' && b.fielder?.id === player.id
    ).length;

    stats.catches += catches;
    stats.runOuts += runOuts;

    // MOTM awards
    if (match.manOfTheMatch?.id === player.id) {
      stats.motmAwards++;
    }

    return stats;
  }

  private static compareBowlingFigures(current: string, best: string): boolean {
    const [currentWickets, currentRuns] = current.split('/').map(Number);
    const [bestWickets, bestRuns] = best.split('/').map(Number);
    
    if (currentWickets > bestWickets) return true;
    if (currentWickets === bestWickets && currentRuns < bestRuns) return true;
    return false;
  }

  static calculateBattingAverage(stats: PlayerStats): number {
    if (stats.timesOut === 0) return stats.runsScored;
    return Number((stats.runsScored / stats.timesOut).toFixed(2));
  }

  static calculateStrikeRate(stats: PlayerStats): number {
    if (stats.ballsFaced === 0) return 0;
    return Number(((stats.runsScored / stats.ballsFaced) * 100).toFixed(2));
  }

  static calculateBowlingAverage(stats: PlayerStats): number {
    if (stats.wicketsTaken === 0) return 0;
    return Number((stats.runsConceded / stats.wicketsTaken).toFixed(2));
  }

  static calculateEconomyRate(stats: PlayerStats): number {
    if (stats.ballsBowled === 0) return 0;
    return Number(((stats.runsConceded / stats.ballsBowled) * 6).toFixed(2));
  }

  static isOverComplete(balls: Ball[], currentOver: number): boolean {
    const overBalls = balls.filter(b => 
      b.overNumber === currentOver && !b.isWide && !b.isNoBall
    );
    return overBalls.length >= 6;
  }

  static shouldRotateStrike(ball: Ball, isOverComplete: boolean): boolean {
    // Rotate strike on odd runs or at end of over
    return (ball.runs % 2 === 1) || isOverComplete;
  }

  static validateBowlerChange(bowler: Player, balls: Ball[], currentOver: number, maxOversPerBowler: number): boolean {
    const bowlerOvers = new Set(
      balls.filter(b => b.bowler.id === bowler.id).map(b => b.overNumber)
    );
    
    return bowlerOvers.size < maxOversPerBowler;
  }

  static canBowlerBowlConsecutiveOvers(bowler: Player, balls: Ball[], currentOver: number): boolean {
    // Check if bowler bowled the previous over
    const previousOverBalls = balls.filter(b => b.overNumber === currentOver - 1);
    if (previousOverBalls.length === 0) return true;
    
    const previousOverBowler = previousOverBalls[0]?.bowler;
    return previousOverBowler?.id !== bowler.id;
  }

  static getAvailableBowlers(match: Match, nextOver: number): Player[] {
    // Get all players from the bowling team
    const allBowlers = match.bowlingTeam.players;
    
    // Filter out bowlers who have bowled in the last 2 overs
    const recentBowlers = match.balls
      .slice(-12) // Last 2 overs (6 balls each)
      .map(ball => ball.bowler.id);
    
    return allBowlers.filter(bowler => 
      // Must not be the current bowler
      bowler.id !== match.currentBowler?.id &&
      // Must not be the previous bowler
      bowler.id !== match.previousBowler?.id &&
      // Must not have bowled in the last 2 overs
      !recentBowlers.includes(bowler.id)
    );
  }

  static canBowlerContinue(match: Match, bowler: Player): boolean {
    // Check if this bowler has bowled in the last 2 overs
    const recentBowlers = match.balls
      .slice(-12) // Last 2 overs (6 balls each)
      .map(ball => ball.bowler.id);
    
    return !recentBowlers.includes(bowler.id);
  }

  static getNextBatsmen(match: Match): Player[] {
    const battingTeam = match.battingTeam;
    const allBatsmen = battingTeam.players;
    
    // Get players who haven't batted yet
    const battedPlayers = match.balls
      .filter(ball => ball.isWicket)
      .map(ball => ball.striker.id);
    
    return allBatsmen.filter(player => !battedPlayers.includes(player.id));
  }

  static isInningsComplete(match: Match): boolean {
    const battingTeam = match.battingTeam;
    
    // Check if all overs are completed
    if (battingTeam.overs >= match.totalOvers) {
      return true;
    }
    
    // Check if all wickets are lost
    const wicketsLost = match.balls.filter(ball => ball.isWicket).length;
    if (wicketsLost >= match.wicketsPerInnings) {
      return true;
    }
    
    // Check if target is reached (for second innings)
    if (match.isSecondInnings && battingTeam.score > match.firstInningsScore) {
      return true;
    }
    
    return false;
  }

  static getMatchResult(match: Match): string {
    if (!match.isComplete) {
      return 'Match in progress';
    }

    if (match.isSecondInnings) {
      const battingTeam = match.battingTeam;
      const bowlingTeam = match.bowlingTeam;
      
      if (battingTeam.score > match.firstInningsScore) {
        return `${battingTeam.name} won by ${match.wicketsPerInnings - match.balls.filter(b => b.isWicket).length} wickets`;
      } else if (battingTeam.score < match.firstInningsScore) {
        return `${bowlingTeam.name} won by ${match.firstInningsScore - battingTeam.score} runs`;
      } else {
        return 'Match tied';
      }
    }

    return 'Match completed';
  }
}