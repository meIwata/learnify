
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStudentCheckIns, getStudentReviews } from '../lib/api';

interface Course {
  id: string;
  name: string;
  description: string;
  progress: number;
  icon: string;
  color: string;
  buttonColor: string;
}

const CurrentCourses: React.FC = () => {
  const { studentId } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!studentId) return;

      try {
        setIsLoading(true);
        
        // Fetch user data to determine course progress
        const checkIns = await getStudentCheckIns(studentId);
        let reviewsCount = 0;
        
        try {
          const reviewsData = await getStudentReviews(studentId);
          reviewsCount = reviewsData.data.reviews.length;
        } catch (error) {
          reviewsCount = 0;
        }

        // Generate courses based on user activity
        const userCourses: Course[] = [
          {
            id: 'mobile-app-review',
            name: 'Mobile App Review Mastery',
            description: 'Learn to write comprehensive app reviews',
            progress: Math.min(reviewsCount * 25, 100), // 25% per review, max 100%
            icon: 'fas fa-mobile-alt',
            color: 'from-blue-500 to-purple-600',
            buttonColor: 'text-blue-600 hover:text-blue-700'
          },
          {
            id: 'daily-engagement',
            name: 'Daily Engagement Challenge',
            description: 'Build consistent learning habits',
            progress: Math.min(checkIns.length * 10, 100), // 10% per check-in, max 100%
            icon: 'fas fa-calendar-check',
            color: 'from-green-500 to-teal-600',
            buttonColor: 'text-green-600 hover:text-green-700'
          }
        ];

        setCourses(userCourses);
      } catch (error) {
        console.error('Error fetching user progress:', error);
        // Set default courses if there's an error
        setCourses([
          {
            id: 'mobile-app-review',
            name: 'Mobile App Review Mastery',
            description: 'Learn to write comprehensive app reviews',
            progress: 0,
            icon: 'fas fa-mobile-alt',
            color: 'from-blue-500 to-purple-600',
            buttonColor: 'text-blue-600 hover:text-blue-700'
          },
          {
            id: 'daily-engagement',
            name: 'Daily Engagement Challenge',
            description: 'Build consistent learning habits',
            progress: 0,
            icon: 'fas fa-calendar-check',
            color: 'from-green-500 to-teal-600',
            buttonColor: 'text-green-600 hover:text-green-700'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, [studentId]);

  const getProgressWidth = (progress: number) => {
    return `${Math.min(progress, 100)}%`;
  };

  const getActionText = (progress: number) => {
    if (progress === 0) return 'Start';
    if (progress === 100) return 'Complete';
    return 'Continue';
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Current Courses</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-full"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 bg-gradient-to-r ${course.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <i className={`${course.icon} text-white`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{course.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">{course.progress}% Complete</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                          style={{ width: getProgressWidth(course.progress) }}
                        ></div>
                      </div>
                    </div>
                    <button className={`${course.buttonColor} text-sm font-medium transition-colors`}>
                      {getActionText(course.progress)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-graduation-cap text-gray-400 text-xl"></i>
            </div>
            <p className="text-gray-500 text-sm">No courses available</p>
            <p className="text-gray-400 text-xs mt-1">Start your learning journey by checking in!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentCourses; 