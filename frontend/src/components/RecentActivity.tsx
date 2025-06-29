

import React from 'react';

const RecentActivity: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Activity Item */}
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-check text-green-600 text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900"><span className="font-medium">Daily check-in completed</span></p>
              <p className="text-xs text-gray-500">+10 points • 2 hours ago</p>
            </div>
          </div>

          {/* Activity Item */}
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-question text-blue-600 text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900"><span className="font-medium">Quiz completed: JavaScript Basics</span></p>
              <p className="text-xs text-gray-500">Score: 92% • +35 points • 5 hours ago</p>
            </div>
          </div>

          {/* Activity Item */}
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-upload text-purple-600 text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900"><span className="font-medium">Assignment submitted: Portfolio Design</span></p>
              <p className="text-xs text-gray-500">GitHub repository linked • Yesterday</p>
            </div>
          </div>

          {/* Activity Item */}
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-trophy text-yellow-600 text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900"><span className="font-medium">Achievement unlocked: Week Warrior</span></p>
              <p className="text-xs text-gray-500">7 consecutive check-ins • 2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity; 