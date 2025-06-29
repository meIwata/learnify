

import React from 'react';

const CurrentCourses: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Current Courses</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {/* Course 1 */}
        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-code text-white"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1">Advanced JavaScript</h4>
            <p className="text-sm text-gray-600 mb-3">Learn modern JS concepts and frameworks</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-500">75% Complete</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div className="w-3/4 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Continue</button>
            </div>
          </div>
        </div>

        {/* Course 2 */}
        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-palette text-white"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1">UI/UX Design Fundamentals</h4>
            <p className="text-sm text-gray-600 mb-3">Master the principles of great design</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-500">45% Complete</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div className="w-2/5 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm font-medium">Continue</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentCourses; 