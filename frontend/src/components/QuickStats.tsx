


const QuickStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Check-in Button */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-check text-green-600 text-xl"></i>
          </div>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Available</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Daily Check-in</h3>
        <p className="text-sm text-gray-600 mb-4">Earn 10 points for checking in today</p>
        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
          Check In Now
        </button>
      </div>

      {/* Total Points */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-coins text-blue-600 text-xl"></i>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">+45 today</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Total Points</h3>
        <p className="text-2xl font-bold text-gray-900">1,247</p>
        <p className="text-sm text-gray-600">Keep it up! 🚀</p>
      </div>

      {/* Quiz Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-brain text-purple-600 text-xl"></i>
          </div>
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">85% avg</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Quiz Score</h3>
        <p className="text-2xl font-bold text-gray-900">85%</p>
        <p className="text-sm text-gray-600">Last 5 quizzes</p>
      </div>

      {/* Submissions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-upload text-orange-600 text-xl"></i>
          </div>
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">12 total</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Submissions</h3>
        <p className="text-2xl font-bold text-gray-900">12</p>
        <p className="text-sm text-gray-600">This month</p>
      </div>
    </div>
  );
};

export default QuickStats; 