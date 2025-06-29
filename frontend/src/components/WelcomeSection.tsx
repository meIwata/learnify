
import React from 'react';

const WelcomeSection: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome back, Alex! 👋</h2>
          <p className="text-blue-100 text-lg mb-6">Ready to continue your learning journey? You're doing great!</p>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-fire text-orange-400"></i>
              <span className="font-semibold">7 day streak</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-star text-yellow-400"></i>
              <span className="font-semibold">1,247 points</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-trophy text-yellow-400"></i>
              <span className="font-semibold">Rank #3</span>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
      </div>
    </div>
  );
};

export default WelcomeSection; 