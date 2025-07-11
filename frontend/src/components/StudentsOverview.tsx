import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStudents } from '../lib/api';
import type { Student } from '../lib/api';

const StudentsOverview: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

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

  const handleStudentClick = (student: Student) => {
    navigate(`/profile/${student.student_id}`);
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

    </div>
  );
};

export default StudentsOverview;