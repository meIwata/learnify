
import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../lib/api';
import type { LeaderboardEntry } from '../lib/api';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const leaderboardData = await getLeaderboard();
        setLeaderboard(leaderboardData);
      } catch (err) {
        setError('Failed to fetch leaderboard');
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-gray-600 bg-gray-100';
      case 3: return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getGradientColor = (index: number): string => {
    const gradients = [
      'from-yellow-400 to-yellow-600',
      'from-gray-400 to-gray-600',
      'from-orange-400 to-orange-600',
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">🏆 Leaderboard</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">🏆 Leaderboard</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">🏆 Leaderboard</h3>
        </div>
        <div className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-trophy text-gray-400 text-2xl"></i>
            </div>
            <p className="text-gray-500">No students on the leaderboard yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">🏆 Leaderboard</h3>
          <span className="text-sm text-gray-500">{leaderboard.length} students ranked</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
          <div className="flex justify-center items-end space-x-8">
            {/* 2nd Place */}
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${getGradientColor(1)} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white text-lg font-bold">{getInitials(leaderboard[1].full_name)}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{leaderboard[1].full_name}</p>
              <p className="text-xs text-gray-500 mb-2">{leaderboard[1].total_marks} pts</p>
              <div className="w-12 h-16 bg-gray-400 rounded-t-lg mx-auto flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <div className="text-2xl mt-1">🥈</div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className={`w-20 h-20 bg-gradient-to-r ${getGradientColor(0)} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white text-xl font-bold">{getInitials(leaderboard[0].full_name)}</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1">{leaderboard[0].full_name}</p>
              <p className="text-sm text-gray-500 mb-2">{leaderboard[0].total_marks} pts</p>
              <div className="w-16 h-20 bg-yellow-400 rounded-t-lg mx-auto flex items-center justify-center">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <div className="text-3xl mt-1">🥇</div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${getGradientColor(2)} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white text-lg font-bold">{getInitials(leaderboard[2].full_name)}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{leaderboard[2].full_name}</p>
              <p className="text-xs text-gray-500 mb-2">{leaderboard[2].total_marks} pts</p>
              <div className="w-12 h-12 bg-orange-400 rounded-t-lg mx-auto flex items-center justify-center">
                <span className="text-white font-bold">3</span>
              </div>
              <div className="text-2xl mt-1">🥉</div>
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings List */}
      <div className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">All Rankings</h4>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div key={entry.student_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(entry.rank)}`}>
                {entry.rank}
              </div>

              {/* Avatar */}
              <div className={`w-12 h-12 bg-gradient-to-r ${getGradientColor(index)} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">{getInitials(entry.full_name)}</span>
              </div>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">{entry.full_name}</p>
                  {entry.rank <= 3 && (
                    <span className="text-lg">{getRankEmoji(entry.rank)}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span>{entry.student_id}</span>
                  {entry.total_check_ins > 0 && (
                    <span>• {entry.total_check_ins} check-ins</span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">{entry.total_marks}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 