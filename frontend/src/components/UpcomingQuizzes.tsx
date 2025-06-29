

import React from 'react';

const UpcomingQuizzes: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Quizzes</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Quiz */}
          <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-question text-blue-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">React Fundamentals</h4>
              <p className="text-sm text-gray-600 mb-2">25 questions • 30 minutes</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Available Now</span>
              </div>
            </div>
          </div>

          {/* Quiz */}
          <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-clock text-gray-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">CSS Grid & Flexbox</h4>
              <p className="text-sm text-gray-600 mb-2">20 questions • 25 minutes</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Available Tomorrow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingQuizzes; 