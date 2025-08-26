import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

interface FeedbackRequest extends Request {
  studentId?: string;
  studentUuid?: string;
}

// Simple student auth middleware for feedback
const requireAuth = async (req: FeedbackRequest, res: Response, next: Function) => {
  try {
    const studentId = req.headers['x-student-id'] as string;
    
    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Student ID required in x-student-id header'
      });
    }

    // Check if student exists
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('id, student_id')
      .eq('student_id', studentId)
      .single();

    if (error || !student) {
      return res.status(403).json({
        success: false,
        error: 'Student not found'
      });
    }

    req.studentId = studentId;
    req.studentUuid = student.id;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

const router = Router();

// Get all feedback topics (for form options)
router.get('/topics', async (req: Request, res: Response) => {
  try {
    const { data: topics, error } = await supabaseAdmin
      .from('feedback_topics')
      .select('*')
      .eq('is_active', true)
      .order('category, display_order');

    if (error) {
      throw error;
    }

    // Group topics by category for easier frontend consumption
    const groupedTopics = topics.reduce((acc: any, topic) => {
      if (!acc[topic.category]) {
        acc[topic.category] = [];
      }
      acc[topic.category].push(topic);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        topics: groupedTopics,
        total: topics.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching feedback topics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch feedback topics'
    });
  }
});

// Submit student feedback
router.post('/submit', requireAuth, async (req: FeedbackRequest, res: Response) => {
  try {
    const {
      semester_feedback,
      overall_rating,
      liked_topics,
      improvement_topics,
      future_topics,
      additional_comments
    } = req.body;

    // Validation
    if (overall_rating && (overall_rating < 1 || overall_rating > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Overall rating must be between 1 and 5'
      });
    }

    // Check if student already submitted feedback
    const { data: existingFeedback } = await supabaseAdmin
      .from('student_feedback')
      .select('id')
      .eq('student_id', req.studentId)
      .single();

    if (existingFeedback) {
      // Update existing feedback
      const { data: updatedFeedback, error } = await supabaseAdmin
        .from('student_feedback')
        .update({
          semester_feedback,
          overall_rating,
          liked_topics: JSON.stringify(liked_topics || []),
          improvement_topics: JSON.stringify(improvement_topics || []),
          future_topics: JSON.stringify(future_topics || []),
          additional_comments,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', req.studentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          feedback: updatedFeedback,
          message: 'Feedback updated successfully'
        }
      });
    } else {
      // Create new feedback
      const { data: newFeedback, error } = await supabaseAdmin
        .from('student_feedback')
        .insert({
          student_id: req.studentId,
          student_uuid: req.studentUuid,
          semester_feedback,
          overall_rating,
          liked_topics: JSON.stringify(liked_topics || []),
          improvement_topics: JSON.stringify(improvement_topics || []),
          future_topics: JSON.stringify(future_topics || []),
          additional_comments
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json({
        success: true,
        data: {
          feedback: newFeedback,
          message: 'Feedback submitted successfully'
        }
      });
    }
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit feedback'
    });
  }
});

// Get student's current feedback
router.get('/my-feedback', requireAuth, async (req: FeedbackRequest, res: Response) => {
  try {
    const { data: feedback, error } = await supabaseAdmin
      .from('student_feedback')
      .select('*')
      .eq('student_id', req.studentId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    res.json({
      success: true,
      data: {
        feedback: feedback || null,
        has_submitted: !!feedback
      }
    });
  } catch (error: any) {
    console.error('Error fetching student feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch feedback'
    });
  }
});

// Admin route: Get all feedback (for instructors)
router.get('/all', requireAuth, async (req: FeedbackRequest, res: Response) => {
  try {
    // TODO: Add admin check here if needed
    const { data: allFeedback, error } = await supabaseAdmin
      .from('student_feedback')
      .select(`
        *,
        students!inner(student_id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Parse JSON fields for easier consumption
    const processedFeedback = allFeedback.map(feedback => ({
      ...feedback,
      liked_topics: typeof feedback.liked_topics === 'string' 
        ? JSON.parse(feedback.liked_topics) 
        : feedback.liked_topics,
      improvement_topics: typeof feedback.improvement_topics === 'string'
        ? JSON.parse(feedback.improvement_topics)
        : feedback.improvement_topics,
      future_topics: typeof feedback.future_topics === 'string'
        ? JSON.parse(feedback.future_topics)
        : feedback.future_topics
    }));

    res.json({
      success: true,
      data: {
        feedback: processedFeedback,
        total: processedFeedback.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch feedback'
    });
  }
});

// Admin route: Get feedback analytics/summary
router.get('/analytics', requireAuth, async (req: FeedbackRequest, res: Response) => {
  try {
    // TODO: Add admin check here if needed
    const { data: allFeedback, error } = await supabaseAdmin
      .from('student_feedback')
      .select('overall_rating, liked_topics, improvement_topics, future_topics');

    if (error) {
      throw error;
    }

    // Calculate analytics
    const analytics = {
      total_responses: allFeedback.length,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      popular_liked_topics: {} as Record<string, number>,
      popular_improvement_topics: {} as Record<string, number>,
      popular_future_topics: {} as Record<string, number>
    };

    if (allFeedback.length > 0) {
      // Calculate rating analytics
      const ratings = allFeedback.filter(f => f.overall_rating).map(f => f.overall_rating);
      analytics.average_rating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      
      allFeedback.forEach(feedback => {
        if (feedback.overall_rating) {
          analytics.rating_distribution[feedback.overall_rating as keyof typeof analytics.rating_distribution]++;
        }

        // Count topic mentions
        const countTopics = (topics: any, targetObj: Record<string, number>) => {
          const topicArray = typeof topics === 'string' ? JSON.parse(topics) : topics;
          if (Array.isArray(topicArray)) {
            topicArray.forEach((topic: string) => {
              targetObj[topic] = (targetObj[topic] || 0) + 1;
            });
          }
        };

        countTopics(feedback.liked_topics, analytics.popular_liked_topics);
        countTopics(feedback.improvement_topics, analytics.popular_improvement_topics);
        countTopics(feedback.future_topics, analytics.popular_future_topics);
      });
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Error fetching feedback analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics'
    });
  }
});

export default router;