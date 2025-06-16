import React from 'react';
import { Trophy, Target, Clock, TrendingUp } from 'lucide-react';
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-2xl text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Innings Break</h2>
          <p className="text-green-100 mt-1">First innings completed!</p>
        </div>

        {/* First Innings Summary */}
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">First Innings Summary</h3>
            
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-gray-800">{firstInningsTeam.name}</div>
              <div className="text-3xl font-bold text-green-600 my-2">
                {firstInningsTeam.score}/{firstInningsTeam.wickets}
              </div>
              <div className="text-gray-600">
                {firstInningsTeam.overs}.{firstInningsTeam.balls} overs
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{runRate}</div>
                <div className="text-xs text-gray-600">Run Rate</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{match.totalOvers}</div>
                <div className="text-xs text-gray-600">Total Overs</div>
              </div>
            </div>
          </div>

          {/* Target Information */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
            <div className="text-center">
              <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-800 mb-2">Target for {match.isSecondInnings ? match.battingTeam.name : match.bowlingTeam.name}</h3>
              <div className="text-4xl font-bold text-orange-600 mb-2">{target}</div>
              <div className="text-orange-700">runs to win</div>
              <div className="text-sm text-orange-600 mt-2">
                Required run rate: {(target / match.totalOvers).toFixed(2)} per over
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
          >
            Start Second Innings
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};