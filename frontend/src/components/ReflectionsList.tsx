import React, { useState, useEffect } from 'react';
import { getAllReflections } from '../lib/api';

interface Reflection {
  id: number;
  student_id: string;
  mobile_app_name: string;
  reflection_text: string;
  created_at: string;
  students: {
    full_name: string;
  } | null;
}

const ReflectionsList: React.FC = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appNameFilter, setAppNameFilter] = useState('');
  const [expandedReflections, setExpandedReflections] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchReflections();
  }, [appNameFilter]);

  const fetchReflections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllReflections({ app_name: appNameFilter || undefined });
      setReflections(data.reflections);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reflections');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedReflections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading reflections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center text-red-500">
          <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
          <p>{error}</p>
          <button
            onClick={fetchReflections}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">App Reflections</h2>
          <span className="text-sm text-gray-500">{reflections.length} reflections</span>
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by app name..."
              value={appNameFilter}
              onChange={(e) => setAppNameFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchReflections}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Reflections List */}
      <div className="p-6">
        {reflections.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-comment-dots text-gray-400 text-4xl mb-4"></i>
            <p className="text-gray-500 text-lg">No reflections found</p>
            <p className="text-gray-400 text-sm mt-2">
              {appNameFilter ? 'Try adjusting your filter' : 'Be the first to submit a reflection!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reflections.map((reflection, index) => {
              const isExpanded = expandedReflections.has(reflection.id);
              const shouldShowExpand = reflection.reflection_text.length > 150;

              return (
                <div
                  key={reflection.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 bg-gradient-to-r ${getGradientColor(index)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm font-medium">
                        {getInitials(reflection.students?.full_name || reflection.student_id)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {reflection.students?.full_name || reflection.student_id}
                          </h3>
                          <p className="text-sm text-gray-500">{reflection.student_id}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            {reflection.mobile_app_name}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(reflection.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Reflection Text */}
                      <div className="text-gray-700 leading-relaxed">
                        {isExpanded ? (
                          <p className="whitespace-pre-line">{reflection.reflection_text}</p>
                        ) : (
                          <p className="whitespace-pre-line">
                            {shouldShowExpand ? truncateText(reflection.reflection_text) : reflection.reflection_text}
                          </p>
                        )}
                        
                        {shouldShowExpand && (
                          <button
                            onClick={() => toggleExpanded(reflection.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                          >
                            {isExpanded ? 'Show Less' : 'Show More'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReflectionsList;