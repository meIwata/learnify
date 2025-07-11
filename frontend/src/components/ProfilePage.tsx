import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentCheckIns, getAllStudents } from '../lib/api';
import type { Student, StudentCheckIn } from '../lib/api';

const ProfilePage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [checkIns, setCheckIns] = useState<StudentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInsLoading, setCheckInsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) {
        setError('Student ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all students to find the specific student
        const allStudents = await getAllStudents();
        const foundStudent = allStudents.find(s => s.student_id === studentId);
        
        if (!foundStudent) {
          setError('Student not found');
          setLoading(false);
          return;
        }

        setStudent(foundStudent);
        
        // Fetch check-ins for this student
        setCheckInsLoading(true);
        const studentCheckIns = await getStudentCheckIns(studentId);
        setCheckIns(studentCheckIns);
        
      } catch (err) {
        setError('Failed to fetch student data');
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
        setCheckInsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDateTime = (dateString: string): string => {
    try {
      if (!dateString) {
        return 'No date time';
      }
      
      // Handle PostgreSQL timestamp format with variable decimal precision
      let date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        // Manual parsing for PostgreSQL format with any number of decimal digits
        const match = dateString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d+))?\+00:00$/);
        if (match) {
          const [, datePart, timePart, ms = ''] = match;
          let paddedMs = ms;
          
          if (ms) {
            // Normalize milliseconds to exactly 3 digits
            if (ms.length < 3) {
              paddedMs = ms.padEnd(3, '0');
            } else if (ms.length > 3) {
              paddedMs = ms.substring(0, 3);
            }
          } else {
            paddedMs = '000';
          }
          
          const isoString = `${datePart}T${timePart}.${paddedMs}Z`;
          date = new Date(isoString);
        }
        
        if (isNaN(date.getTime())) {
          return dateString;
        }
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error('DateTime parsing error:', error);
      return dateString;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) {
        return 'No date';
      }
      
      let date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        const match = dateString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d+))?\+00:00$/);
        if (match) {
          const [, datePart, timePart, ms = ''] = match;
          let paddedMs = ms;
          
          if (ms) {
            if (ms.length < 3) {
              paddedMs = ms.padEnd(3, '0');
            } else if (ms.length > 3) {
              paddedMs = ms.substring(0, 3);
            }
          } else {
            paddedMs = '000';
          }
          
          const isoString = `${datePart}T${timePart}.${paddedMs}Z`;
          date = new Date(isoString);
        }
        
        if (isNaN(date.getTime())) {
          return dateString;
        }
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <button
                onClick={() => navigate('/admin')}
                className="hover:text-gray-700 transition-colors"
              >
                Admin
              </button>
              <i className="fas fa-chevron-right text-xs"></i>
              <span className="text-gray-900 font-medium">Student Profile</span>
              {student && (
                <>
                  <i className="fas fa-chevron-right text-xs"></i>
                  <span className="text-gray-900 font-medium">{student.full_name}</span>
                </>
              )}
            </nav>
            
            {/* Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {student ? `${student.full_name}'s Profile` : 'Student Profile'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">{getInitials(student.full_name)}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{student.full_name}</h2>
                <p className="text-lg text-gray-600 mb-4">{student.student_id}</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <i className="fas fa-calendar text-blue-500"></i>
                  <span>Joined {formatDate(student.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Check-ins</span>
                  <span className="text-2xl font-bold text-blue-600">{checkIns.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Check-in</span>
                  <span className="text-sm text-gray-500">
                    {checkIns.length > 0 ? formatDate(checkIns[0]?.created_at) : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Marks Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Marks</h3>
              <div className="space-y-4">
                {/* Check-in Marks */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      checkIns.length > 0 ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <i className={`fas fa-check text-sm ${
                        checkIns.length > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Check-in</p>
                      <p className="text-xs text-gray-500">
                        {checkIns.length > 0 ? 'Completed' : 'Not started'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      checkIns.length > 0 ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {checkIns.length > 0 ? '10' : '0'}/10
                    </span>
                  </div>
                </div>

                {/* App Review Marks */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-mobile-alt text-sm text-gray-400"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">App Review</p>
                      <p className="text-xs text-gray-500">Not submitted</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-400">0/10</span>
                  </div>
                </div>

                {/* Profile Picture Marks */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-user-circle text-sm text-gray-400"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Profile Picture</p>
                      <p className="text-xs text-gray-500">Not submitted</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-400">0/10</span>
                  </div>
                </div>

                {/* GitHub Repository Marks */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fab fa-github text-sm text-gray-400"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">GitHub Repository</p>
                      <p className="text-xs text-gray-500">Not submitted</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-400">0/10</span>
                  </div>
                </div>

                {/* GitHub Organization Marks */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-users text-sm text-gray-400"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">GitHub Organization</p>
                      <p className="text-xs text-gray-500">Not submitted</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-400">0/10</span>
                  </div>
                </div>

                {/* Total Marks */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Marks</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {checkIns.length > 0 ? '10' : '0'}/50
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${checkIns.length > 0 ? '20' : '0'}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {checkIns.length > 0 ? '20' : '0'}% Complete
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Check-ins List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Check-in History</h3>
                  <span className="text-sm text-gray-500">{checkIns.length} total check-ins</span>
                </div>
              </div>
              
              <div className="p-6">
                {checkInsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 mt-2">Loading check-ins...</p>
                  </div>
                ) : checkIns.length > 0 ? (
                  <div className="space-y-4">
                    {checkIns.map((checkIn, index) => (
                      <div key={checkIn.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-check text-green-600 text-lg"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Daily Check-in #{checkIns.length - index}</p>
                              <p className="text-sm text-gray-600">{formatDateTime(checkIn.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Completed
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-calendar-times text-gray-400 text-2xl"></i>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Check-ins Yet</h4>
                    <p className="text-gray-500">This student hasn't completed any check-ins yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;