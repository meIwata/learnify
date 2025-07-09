import React, { useState } from 'react';
import ReflectionForm from '../components/ReflectionForm';
import ReflectionsList from '../components/ReflectionsList';

const ReflectionsPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmissionSuccess = () => {
    // Trigger a refresh of the reflections list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Mobile App Reflections</h1>
          <p className="text-blue-100">
            Share your thoughts and experiences with mobile applications
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Submission Form */}
          <div>
            <ReflectionForm onSubmissionSuccess={handleSubmissionSuccess} />
          </div>

          {/* Right Column - Reflections List */}
          <div>
            <ReflectionsList key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectionsPage;