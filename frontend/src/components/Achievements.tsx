


const Achievements: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Achievement */}
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-fire text-yellow-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Week Warrior</p>
              <p className="text-sm text-gray-600">7 consecutive check-ins</p>
            </div>
          </div>

          {/* Achievement */}
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-brain text-purple-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Quiz Master</p>
              <p className="text-sm text-gray-600">90%+ on 5 quizzes</p>
            </div>
          </div>

          {/* Achievement */}
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-code text-green-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Code Contributor</p>
              <p className="text-sm text-gray-600">10 GitHub submissions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements; 