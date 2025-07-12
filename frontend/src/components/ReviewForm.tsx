import React, { useState } from 'react';
import { submitReview } from '../lib/api';

interface ReviewFormProps {
  onSubmissionSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmissionSuccess }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    mobileAppName: '',
    reviewText: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId.trim() || !formData.mobileAppName.trim() || !formData.reviewText.trim()) {
      setError('All fields are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitReview({
        student_id: formData.studentId.trim(),
        mobile_app_name: formData.mobileAppName.trim(),
        review_text: formData.reviewText.trim()
      });

      setShowSuccess(true);
      setFormData({ studentId: '', mobileAppName: '', reviewText: '' });
      
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Submit App Review</h2>
        <p className="text-gray-600">Share your thoughts about a mobile app you've been using.</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-check-circle text-green-600 mr-3"></i>
            <div>
              <p className="text-green-800 font-medium">Review submitted successfully!</p>
              <p className="text-green-700 text-sm">Thank you for sharing your insights.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-exclamation-circle text-red-600 mr-3"></i>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student ID */}
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
            Student ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="studentId"
            value={formData.studentId}
            onChange={(e) => handleChange('studentId', e.target.value)}
            placeholder="Enter your student ID (e.g., STUDENT2025)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Mobile App Name */}
        <div>
          <label htmlFor="mobileAppName" className="block text-sm font-medium text-gray-700 mb-2">
            Mobile App Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="mobileAppName"
            value={formData.mobileAppName}
            onChange={(e) => handleChange('mobileAppName', e.target.value)}
            placeholder="Enter the name of the mobile app (e.g., Instagram, TikTok, Duolingo)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reviewText"
            value={formData.reviewText}
            onChange={(e) => handleChange('reviewText', e.target.value)}
            placeholder="Share your thoughts about this app. What do you like? What could be improved? How does it impact your daily life?"
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
          <p className="text-sm text-gray-500 mt-2">
            {formData.reviewText.length}/1000 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.studentId.trim() || !formData.mobileAppName.trim() || !formData.reviewText.trim()}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
            isSubmitting || !formData.studentId.trim() || !formData.mobileAppName.trim() || !formData.reviewText.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-700 text-white hover:from-blue-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Submitting...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <i className="fas fa-paper-plane mr-2"></i>
              Submit Review
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;