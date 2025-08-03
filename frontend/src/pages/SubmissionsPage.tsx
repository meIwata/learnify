import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SubmissionsList from '../components/SubmissionsList';
import SubmissionUpload from '../components/SubmissionUpload';
import { Upload, List, Users } from 'lucide-react';
import { getAdminStatus } from '../lib/api';

const SubmissionsPage: React.FC = () => {
  const { studentId } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'all' | 'upload'>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!studentId) return;
      
      try {
        await getAdminStatus(studentId);
        setIsAdmin(true);
        // Set default tab to "all" for admin users
        if (activeTab === 'list') {
          setActiveTab('all');
        }
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [studentId]);

  const handleUploadSuccess = () => {
    // Refresh the submissions list
    setRefreshKey(prev => prev + 1);
    // Switch to list view to see the new submission
    setActiveTab('list');
  };

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to view submissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage your assignment submissions
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>All Submissions</span>
                  </div>
                </button>
              )}
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <List className="w-4 h-4" />
                  <span>My Submissions</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload New</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'list' ? (
            <SubmissionsList 
              key={refreshKey}
              studentId={studentId}
              showFilters={false}
            />
          ) : activeTab === 'all' ? (
            <SubmissionsList 
              key={`all-${refreshKey}`}
              showFilters={true}
            />
          ) : (
            <SubmissionUpload
              studentId={studentId}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;