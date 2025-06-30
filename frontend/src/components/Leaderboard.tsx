


const Leaderboard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
          <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
            <option>This Week</option>
            <option>This Month</option>
            <option>All Time</option>
          </select>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Rank 1 */}
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Sarah Chen</p>
              <p className="text-sm text-gray-600">SARAH2025</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">1,456</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>

          {/* Rank 2 */}
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-slate-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Mike Rodriguez</p>
              <p className="text-sm text-gray-600">MIKE2025</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">1,298</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>

          {/* Current User (Rank 3) */}
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              3
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Alex Johnson (You)</p>
              <p className="text-sm text-gray-600">ALEX2025</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">1,247</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>

          {/* Other ranks */}
          <div className="flex items-center space-x-3 p-2">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm">
              4
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">Emma Davis</p>
            </div>
            <p className="text-sm text-gray-600">1,156</p>
          </div>

          <div className="flex items-center space-x-3 p-2">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm">
              5
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">James Wilson</p>
            </div>
            <p className="text-sm text-gray-600">1,089</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 