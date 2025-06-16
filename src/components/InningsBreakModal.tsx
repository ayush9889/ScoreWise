import React from 'react';
import { Trophy, Target, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Match } from '../types/cricket';
import { motion } from 'framer-motion';

interface InningsBreakModalProps {
  match: Match;
  onContinue: () => void;
}

export const InningsBreakModal: React.FC<InningsBreakModalProps> = ({ match, onContinue }) => {
  const firstInningsTeam = match.isSecondInnings ? match.bowlingTeam : match.battingTeam;
  const target = firstInningsTeam.score + 1;
  const runRate = ((firstInningsTeam.score / ((firstInningsTeam.overs * 6) + firstInningsTeam.balls)) * 6).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-effect rounded-3xl w-full max-w-lg shadow-premium"
      >
        {/* Header */}
        <div className="gradient-primary text-white p-8 rounded-t-3xl text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-display">Innings Break</h2>
          <p className="text-emerald-100 mt-2 font-medium">First innings completed!</p>
        </div>

        {/* First Innings Summary */}
        <div className="p-8 space-y-8">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-center font-display">First Innings Summary</h3>
            
            <div className="text-center mb-6">
              <div className="text-xl font-bold text-gray-800 font-display">{firstInningsTeam.name}</div>
              <div className="text-4xl font-black text-emerald-600 my-3 font-display">
                {firstInningsTeam.score}/{firstInningsTeam.wickets}
              </div>
              <div className="text-gray-600 font-medium">
                {firstInningsTeam.overs}.{firstInningsTeam.balls} overs
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-effect rounded-xl p-4 text-center">
                <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl font-bold text-gray-900 font-display">{runRate}</div>
                <div className="text-xs text-gray-600 font-medium">Run Rate</div>
              </div>
              <div className="glass-effect rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl font-bold text-gray-900 font-display">{match.totalOvers}</div>
                <div className="text-xs text-gray-600 font-medium">Total Overs</div>
              </div>
            </div>
          </div>

          {/* Target Information */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
            <div className="text-center">
              <Target className="w-10 h-10 text-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-orange-800 mb-3 font-display">Target for {match.isSecondInnings ? match.battingTeam.name : match.bowlingTeam.name}</h3>
              <div className="text-5xl font-black text-orange-600 mb-3 font-display">{target}</div>
              <div className="text-orange-700 font-bold text-lg">runs to win</div>
              <div className="text-sm text-orange-600 mt-3 font-medium">
                Required run rate: {(target / match.totalOvers).toFixed(2)} per over
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full gradient-primary text-white py-5 px-8 rounded-2xl font-bold text-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
          >
            <span>Start Second Innings</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};