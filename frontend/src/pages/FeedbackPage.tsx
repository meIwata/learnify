import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getFeedbackTopics, 
  submitFeedback, 
  getMyFeedback
} from '../lib/api';
import type { FeedbackTopic, FeedbackSubmissionRequest } from '../lib/api';
// Using simple icons without heroicons dependency
const CheckCircleIcon = () => <span className="text-green-500">✓</span>;
const StarIcon = () => <span className="text-yellow-400">★</span>;
const StarOutlineIcon = () => <span className="text-gray-300">☆</span>;

const FeedbackPage: React.FC = () => {
  const { studentId } = useAuth();
  const [topics, setTopics] = useState<{
    current: FeedbackTopic[];
    improvement: FeedbackTopic[];
    future: FeedbackTopic[];
  }>({ current: [], improvement: [], future: [] });
  
  const [formData, setFormData] = useState<FeedbackSubmissionRequest>({
    semester_feedback: '',
    overall_rating: undefined,
    liked_topics: [],
    improvement_topics: [],
    future_topics: [],
    additional_comments: ''
  });
  
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load feedback topics
        const topicsResponse = await getFeedbackTopics();
        setTopics(topicsResponse.data.topics);
        
        // Load existing feedback if any
        if (studentId) {
          const myFeedbackResponse = await getMyFeedback(studentId);
          if (myFeedbackResponse.data.has_submitted && myFeedbackResponse.data.feedback) {
            const feedback = myFeedbackResponse.data.feedback;
            setFormData({
              semester_feedback: feedback.semester_feedback || '',
              overall_rating: feedback.overall_rating,
              liked_topics: feedback.liked_topics || [],
              improvement_topics: feedback.improvement_topics || [],
              future_topics: feedback.future_topics || [],
              additional_comments: feedback.additional_comments || ''
            });
            setHasSubmitted(true);
          }
        }
      } catch (error) {
        console.error('Error loading feedback data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [studentId]);

  const handleTopicToggle = (topicName: string, category: 'liked_topics' | 'improvement_topics' | 'future_topics') => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(topicName)
        ? prev[category].filter(t => t !== topicName)
        : [...prev[category], topicName]
    }));
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, overall_rating: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId) {
      alert('Please log in to submit feedback');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitFeedback(studentId, formData);
      setSubmitMessage(response.data.message);
      setHasSubmitted(true);
      setTimeout(() => setSubmitMessage(''), 5000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitMessage('Failed to submit feedback. Please try again.');
      setTimeout(() => setSubmitMessage(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Semester Feedback
            </h1>
            <p className="text-gray-600">
              Help us improve the course by sharing your thoughts and suggestions
            </p>
            {hasSubmitted && (
              <div className="mt-4 flex items-center text-green-600">
                <CheckCircleIcon />
                <span className="text-sm ml-2">You have already submitted feedback. You can update it anytime.</span>
              </div>
            )}
          </div>

          {submitMessage && (
            <div className={`mb-6 p-4 rounded-lg ${
              submitMessage.includes('Failed') 
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {submitMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Overall Experience */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                How would you rate your overall experience this semester?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingClick(rating)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors text-2xl"
                  >
                    {formData.overall_rating && formData.overall_rating >= rating ? (
                      <StarIcon />
                    ) : (
                      <StarOutlineIcon />
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* General Feedback */}
            <div>
              <label htmlFor="semester_feedback" className="block text-lg font-semibold text-gray-900 mb-4">
                What are your overall thoughts about this semester?
              </label>
              <textarea
                id="semester_feedback"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Share your thoughts about the course content, teaching style, pace, etc..."
                value={formData.semester_feedback}
                onChange={(e) => setFormData(prev => ({ ...prev, semester_feedback: e.target.value }))}
              />
            </div>

            {/* Topics you liked */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Which topics did you enjoy the most? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topics.current.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicToggle(topic.topic_name, 'liked_topics')}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      formData.liked_topics.includes(topic.topic_name)
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{topic.topic_name}</div>
                    {topic.description && (
                      <div className="text-sm opacity-75 mt-1">{topic.description}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics needing improvement */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Which topics need more explanation or improvement? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topics.improvement.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicToggle(topic.topic_name, 'improvement_topics')}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      formData.improvement_topics.includes(topic.topic_name)
                        ? 'bg-orange-50 border-orange-200 text-orange-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{topic.topic_name}</div>
                    {topic.description && (
                      <div className="text-sm opacity-75 mt-1">{topic.description}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Future learning topics */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                What would you like to learn next? (Select all that interest you)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topics.future.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicToggle(topic.topic_name, 'future_topics')}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      formData.future_topics.includes(topic.topic_name)
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{topic.topic_name}</div>
                    {topic.description && (
                      <div className="text-sm opacity-75 mt-1">{topic.description}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Comments */}
            <div>
              <label htmlFor="additional_comments" className="block text-lg font-semibold text-gray-900 mb-4">
                Any additional suggestions or comments?
              </label>
              <textarea
                id="additional_comments"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Share any other feedback, suggestions for improvement, or ideas you have..."
                value={formData.additional_comments}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_comments: e.target.value }))}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {isSubmitting ? 'Submitting...' : hasSubmitted ? 'Update Feedback' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;