import React, { useState, useEffect } from 'react';
import { getAllStudents, getStudentCheckIns } from '../lib/api';
import type { Student, StudentCheckIn } from '../lib/api';

const StudentsOverview: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [checkIns, setCheckIns] = useState<StudentCheckIn[]>([]);
  const [checkInsLoading, setCheckInsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const studentsData = await getAllStudents();
        setStudents(studentsData);
      } catch (err) {
        setError('Failed to fetch students');
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleStudentClick = async (student: Student) => {
    setSelectedStudent(student);
    setCheckInsLoading(true);
    try {
      const studentCheckIns = await getStudentCheckIns(student.student_id);
      setCheckIns(studentCheckIns);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
      setCheckIns([]);
    } finally {
      setCheckInsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setCheckIns([]);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradientColor = (index: number): string => {
    const gradients = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-yellow-400 to-orange-500',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-red-400 to-red-600',
    ];
    return gradients[index % gradients.length];
  };

  const formatDate = (dateString: string): string => {
    try {
      console.log('Formatting date:', dateString, 'Type:', typeof dateString);
      
      if (!dateString) {
        return 'No date';
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
              paddedMs = ms.padEnd(3, '0'); // Pad with zeros: .1 -> .100, .12 -> .120
            } else if (ms.length > 3) {
              paddedMs = ms.substring(0, 3); // Truncate: .123456 -> .123
            }
          } else {
            paddedMs = '000'; // No milliseconds -> .000
          }
          
          const isoString = `${datePart}T${timePart}.${paddedMs}Z`;
          console.log('Manual parsing to ISO:', isoString);
          date = new Date(isoString);
        } else {
          // Fallback: try simple replacements
          const formats = [
            dateString.replace(/\+00:00$/, 'Z'), // Replace +00:00 with Z
            dateString.replace(/\.\d+\+00:00$/, 'Z'), // Remove any decimals and replace +00:00 with Z
            dateString.replace(/\.\d+/, ''), // Remove decimals entirely
          ];
          
          for (const format of formats) {
            console.log('Trying fallback format:', format);
            date = new Date(format);
            if (!isNaN(date.getTime())) {
              console.log('Successfully parsed with fallback format:', format);
              break;
            }
          }
        }
        
        if (isNaN(date.getTime())) {
          console.warn('Could not parse date:', dateString);
          return dateString; // Return original string if all parsing fails
        }
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Date parsing error:', error, 'Input:', dateString);
      return dateString; // Return original string on error
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      console.log('Formatting datetime:', dateString, 'Type:', typeof dateString);
      
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
              paddedMs = ms.padEnd(3, '0'); // Pad with zeros: .1 -> .100, .12 -> .120
            } else if (ms.length > 3) {
              paddedMs = ms.substring(0, 3); // Truncate: .123456 -> .123
            }
          } else {
            paddedMs = '000'; // No milliseconds -> .000
          }
          
          const isoString = `${datePart}T${timePart}.${paddedMs}Z`;
          console.log('Manual parsing datetime to ISO:', isoString);
          date = new Date(isoString);
        } else {
          // Fallback: try simple replacements
          const formats = [
            dateString.replace(/\+00:00$/, 'Z'), // Replace +00:00 with Z
            dateString.replace(/\.\d+\+00:00$/, 'Z'), // Remove any decimals and replace +00:00 with Z
            dateString.replace(/\.\d+/, ''), // Remove decimals entirely
          ];
          
          for (const format of formats) {
            console.log('Trying datetime fallback format:', format);
            date = new Date(format);
            if (!isNaN(date.getTime())) {
              console.log('Successfully parsed datetime with fallback format:', format);
              break;
            }
          }
        }
        
        if (isNaN(date.getTime())) {
          console.warn('Could not parse datetime:', dateString);
          return dateString; // Return original string if all parsing fails
        }
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error('DateTime parsing error:', error, 'Input:', dateString);
      return dateString; // Return original string on error
    }
  };

  const displayStudents = showAll ? students : students.slice(0, 8);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">All Students</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">Loading students...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">All Students</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">All Students</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{students.length} students enrolled</span>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View Details</button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayStudents.map((student, index) => (
            <button
              key={student.id}
              onClick={() => handleStudentClick(student)}
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all cursor-pointer text-left"
            >
              <div className={`w-10 h-10 bg-gradient-to-r ${getGradientColor(index)} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">{getInitials(student.full_name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{student.full_name}</p>
                <p className="text-xs text-gray-500">{student.student_id}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <i className="fas fa-calendar text-blue-400 text-xs"></i>
                  <span className="text-xs text-gray-600">
                    Joined {formatDate(student.created_at)}
                  </span>
                </div>
              </div>
              <div className="text-blue-400">
                <i className="fas fa-chevron-right text-xs"></i>
              </div>
            </button>
          ))}
        </div>
        
        {/* Show More Button */}
        {students.length > 8 && (
          <div className="mt-6 text-center">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showAll ? 'Show Less' : `Show More Students (${students.length - 8} remaining)`}
            </button>
          </div>
        )}
      </div>

      {/* Check-ins Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center`}>
                    <span className="text-white text-lg font-medium">{getInitials(selectedStudent.full_name)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.full_name}</h3>
                    <p className="text-blue-100">{selectedStudent.student_id}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Check-in Activities</h4>
              
              {checkInsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-500 mt-2">Loading check-ins...</p>
                </div>
              ) : checkIns.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {checkIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-check text-green-600"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Daily Check-in</p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(checkIn.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          +10 points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-calendar-times text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-500">No check-in activities found</p>
                  <p className="text-sm text-gray-400 mt-1">This student hasn't checked in yet</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsOverview;