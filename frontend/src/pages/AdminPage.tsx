import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAdminStatus, getAllStudentsAsAdmin, deleteStudent } from '../lib/api';
import type { Student, AdminStatus } from '../lib/api';

const AdminPage: React.FC = () => {
  const { studentId } = useAuth();
  const navigate = useNavigate();
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check admin status
        const status = await getAdminStatus(studentId);
        setAdminStatus(status);

        // Get all students
        const allStudents = await getAllStudentsAsAdmin(studentId);
        setStudents(allStudents);
      } catch (error: any) {
        setError(error.message || 'Failed to load admin data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [studentId]);

  const handleDeleteStudent = async (targetStudentId: string) => {
    if (!studentId || !window.confirm(`Are you sure you want to delete student ${targetStudentId}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(targetStudentId);
      const result = await deleteStudent(studentId, targetStudentId);
      
      // Remove deleted student from local state
      setStudents(prev => prev.filter(s => s.student_id !== targetStudentId));
      
      alert(`✅ ${result.message}`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleStudentClick = (targetStudentId: string) => {
    navigate(`/profile/${targetStudentId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100">
                Welcome, {adminStatus?.admin.full_name} ({adminStatus?.admin.student_id})
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {adminStatus?.permissions.map((permission) => (
              <span
                key={permission}
                className="bg-red-500 text-red-100 px-3 py-1 rounded-full text-sm"
              >
                {permission.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admin Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.is_admin).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-shield-alt text-red-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regular Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => !s.is_admin).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-graduate text-green-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">All Students</h2>
            <p className="text-sm text-gray-600 mt-1">Manage student accounts • Click on any student to view their profile</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr 
                    key={student.student_id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleStudentClick(student.student_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {student.student_id.substring(0, 2)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-gray-500">{student.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.is_admin ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Student
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!student.is_admin && student.student_id !== studentId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudent(student.student_id);
                          }}
                          disabled={deleteLoading === student.student_id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          {deleteLoading === student.student_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-trash"></i>
                              <span>Delete</span>
                            </>
                          )}
                        </button>
                      )}
                      {student.is_admin && (
                        <span className="text-gray-400 text-sm">Protected</span>
                      )}
                      {student.student_id === studentId && (
                        <span className="text-blue-600 text-sm">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;