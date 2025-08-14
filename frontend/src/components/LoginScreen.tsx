import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const { login, loginError, isLoggingIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.trim()) {
      return;
    }

    const trimmedStudentId = studentId.trim().toUpperCase();
    
    // Basic format validation (optional)
    if (trimmedStudentId.length < 3) {
      return;
    }

    await login(trimmedStudentId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-graduation-cap text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learnify</h1>
          <p className="text-gray-600">Enter your Student ID to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your student ID (e.g., STUDENT2025)"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg ${
                  loginError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isLoggingIn}
                autoFocus
              />
              {loginError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {loginError}
                  </p>
                </div>
              )}
              
              {/* Show validation hint for empty or too short input */}
              {studentId.trim() && studentId.trim().length < 3 && (
                <p className="mt-2 text-sm text-orange-600 flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  Student ID must be at least 3 characters long
                </p>
              )}
              
              {!studentId.trim() && (
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  Please enter your Student ID
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !studentId.trim() || studentId.trim().length < 3}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoggingIn ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Validating...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {loginError ? (
                <span className="text-red-600">
                  <i className="fas fa-user-times mr-1"></i>
                  Student ID not found? Contact your instructor to get registered.
                </span>
              ) : (
                <>
                  <i className="fas fa-question-circle mr-1"></i>
                  Don't have a Student ID? Contact your instructor.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <i className="fas fa-check text-blue-600 text-sm"></i>
              </div>
              <span>Daily Check-ins</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <i className="fas fa-star text-purple-600 text-sm"></i>
              </div>
              <span>App Reviews</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <i className="fas fa-trophy text-green-600 text-sm"></i>
              </div>
              <span>Leaderboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;