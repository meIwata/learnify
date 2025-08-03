import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllQuestionsWithAttempts } from '../lib/api';
import type { QuestionWithAttempts, AllQuestionsResponse } from '../lib/api';

const QuestionOverviewPage: React.FC = () => {
  const { studentId, isAuthenticated } = useAuth();
  const [data, setData] = useState<AllQuestionsResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | 'all'>('all');

  useEffect(() => {
    console.log('QuestionOverviewPage useEffect triggered');
    console.log('studentId:', studentId);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('studentId type:', typeof studentId);
    console.log('studentId truthy:', !!studentId);
    
    if (studentId && studentId.trim()) {
      loadQuestionData();
    } else {
      setError('No valid student ID found. Please log in again.');
      setIsLoading(false);
    }
  }, [studentId, isAuthenticated]);

  const loadQuestionData = async () => {
    if (!studentId) {
      setError('No student ID found. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading question data for student:', studentId);
      console.log('Student ID type:', typeof studentId);
      console.log('Student ID length:', studentId?.length);
      console.log('Student ID encoded:', encodeURIComponent(studentId));
      const result = await getAllQuestionsWithAttempts(studentId);
      console.log('Question data loaded successfully:', result);
      setData(result);
    } catch (error: any) {
      console.error('Failed to load question data:', error);
      console.error('Student ID used:', studentId);
      
      let errorMessage = `Failed to load question data for student ${studentId}.`;
      
      if (error?.response?.status === 404) {
        errorMessage = `Student ${studentId} not found in the system. Please check that you are logged in with the correct student ID, or contact your instructor if this is a new account.`;
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later or contact support.';
      } else if (error?.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuestions = data?.questions.filter(question => 
    selectedDifficulty === 'all' || question.difficulty_level === selectedDifficulty
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered': return 'text-green-600';
      case 'needs_practice': return 'text-orange-600';
      case 'never_attempted': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'mastered': return 'bg-green-100 text-green-800';
      case 'needs_practice': return 'bg-orange-100 text-orange-800';
      case 'never_attempted': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'mastered': return 'Mastered';
      case 'needs_practice': return 'Needs Practice';
      case 'never_attempted': return 'Not Attempted';
      default: return 'Unknown';
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Intermediate';
      case 3: return 'Advanced';
      default: return 'Unknown';
    }
  };

  const getOptions = (question: QuestionWithAttempts) => [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d
  ];

  const getOptionLetter = (index: number): 'A' | 'B' | 'C' | 'D' => {
    return ['A', 'B', 'C', 'D'][index] as 'A' | 'B' | 'C' | 'D';
  };

  if (isLoading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading question overview...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Questions</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Debug Info:</strong>
                </p>
                <p className="text-xs text-gray-500 font-mono">Student ID: {studentId || 'null/undefined'}</p>
                <p className="text-xs text-gray-500 font-mono">Is Authenticated: {isAuthenticated ? 'true' : 'false'}</p>
                <p className="text-xs text-gray-500 font-mono">
                  API Endpoint: /api/quiz/questions/all/{studentId || 'MISSING'}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  LocalStorage: {typeof window !== 'undefined' ? localStorage.getItem('studentId') || 'not found' : 'N/A'}
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={loadQuestionData}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <div>
                  <a
                    href="/quiz"
                    className="inline-block bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back to Quiz
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link 
              to="/quiz" 
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              Quiz
            </Link>
            <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            <span className="text-gray-700 font-medium">Questions</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Overview</h1>
          <p className="text-lg text-gray-600">All quiz questions and your attempt results</p>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.summary.total_questions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.summary.mastered_questions}</div>
              <div className="text-sm text-gray-600">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.summary.attempted_questions - data.summary.mastered_questions}</div>
              <div className="text-sm text-gray-600">Need Practice</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{data.summary.never_attempted}</div>
              <div className="text-sm text-gray-600">Not Attempted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.summary.overall_accuracy}%</div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Difficulty</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedDifficulty === 'all'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              All ({data.questions.length})
            </button>
            <button
              onClick={() => setSelectedDifficulty(1)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedDifficulty === 1
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              Beginner ({data.questions.filter(q => q.difficulty_level === 1).length})
            </button>
            <button
              onClick={() => setSelectedDifficulty(2)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedDifficulty === 2
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              Intermediate ({data.questions.filter(q => q.difficulty_level === 2).length})
            </button>
            <button
              onClick={() => setSelectedDifficulty(3)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedDifficulty === 3
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              Advanced ({data.questions.filter(q => q.difficulty_level === 3).length})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQuestions.map((question, index) => {
            const options = getOptions(question);
            
            return (
              <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg font-semibold text-gray-900">Question {index + 1}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty_level)}`}>
                        {getDifficultyText(question.difficulty_level)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(question.attempt_summary.status)}`}>
                        {getStatusText(question.attempt_summary.status)}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{question.question_text}</h3>
                  </div>
                  
                  {/* Attempt Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 ml-6 min-w-[200px]">
                    <div className="text-sm font-medium text-gray-900 mb-2">Your Performance</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Attempts: {question.attempt_summary.total_attempts}</div>
                      <div>Correct: {question.attempt_summary.correct_attempts}</div>
                      <div>Accuracy: {question.attempt_summary.accuracy_percentage}%</div>
                      <div>Points: {question.attempt_summary.total_points}</div>
                    </div>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-3 mb-4">
                  {options.map((option, optionIndex) => {
                    const optionLetter = getOptionLetter(optionIndex);
                    const isCorrect = optionLetter === question.correct_answer;
                    const isLastSelected = optionLetter === question.attempt_summary.latest_attempt?.selected_answer;
                    
                    return (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg border-2 ${
                          isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isLastSelected && question.attempt_summary.latest_attempt
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                              isCorrect
                                ? 'bg-green-500 text-white'
                                : isLastSelected && question.attempt_summary.latest_attempt
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {optionLetter}
                          </span>
                          <span className="text-gray-900">{option}</span>
                          {isCorrect && <i className="fas fa-check text-green-500 ml-auto"></i>}
                          {isLastSelected && !isCorrect && question.attempt_summary.latest_attempt && (
                            <i className="fas fa-times text-red-500 ml-auto"></i>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <i className="fas fa-lightbulb text-blue-600 mt-1"></i>
                      <div>
                        <div className="font-medium text-blue-900 mb-1">Explanation</div>
                        <div className="text-blue-800">{question.explanation}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Attempt Info */}
                {question.attempt_summary.latest_attempt && (
                  <div className="mt-4 text-sm text-gray-600">
                    Last attempted: {new Date(question.attempt_summary.latest_attempt.created_at).toLocaleDateString()} • 
                    Result: {question.attempt_summary.latest_attempt.is_correct ? 'Correct' : 'Incorrect'} • 
                    Points: {question.attempt_summary.latest_attempt.points_earned}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600">No questions match the selected difficulty filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionOverviewPage;