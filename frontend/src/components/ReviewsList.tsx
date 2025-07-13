import React, { useState, useEffect } from 'react';
import { getAllReviews } from '../lib/api';
import type { StudentReview } from '../lib/api';


const ReviewsList: React.FC = () => {
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appNameFilter, setAppNameFilter] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchReviews();
  }, [appNameFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllReviews({ app_name: appNameFilter || undefined });
      setReviews(data.reviews);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedReviews(prev => {
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
          <p className="text-gray-500">Loading reviews...</p>
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
            onClick={fetchReviews}
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
          <h2 className="text-xl font-bold text-gray-900">App Reviews</h2>
          <span className="text-sm text-gray-500">{reviews.length} reviews</span>
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
            onClick={fetchReviews}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-comment-dots text-gray-400 text-4xl mb-4"></i>
            <p className="text-gray-500 text-lg">No reviews found</p>
            <p className="text-gray-400 text-sm mt-2">
              {appNameFilter ? 'Try adjusting your filter' : 'Be the first to submit a review!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => {
              const isExpanded = expandedReviews.has(review.id);
              const shouldShowExpand = review.review_text.length > 150;

              return (
                <div
                  key={review.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 bg-gradient-to-r ${getGradientColor(index)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm font-medium">
                        {getInitials(review.students?.full_name || review.student_id)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {review.students?.full_name || review.student_id}
                          </h3>
                          <p className="text-sm text-gray-500">{review.student_id}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            {review.mobile_app_name}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="text-gray-700 leading-relaxed">
                        {isExpanded ? (
                          <p className="whitespace-pre-line">{review.review_text}</p>
                        ) : (
                          <p className="whitespace-pre-line">
                            {shouldShowExpand ? truncateText(review.review_text) : review.review_text}
                          </p>
                        )}
                        
                        {shouldShowExpand && (
                          <button
                            onClick={() => toggleExpanded(review.id)}
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

export default ReviewsList;