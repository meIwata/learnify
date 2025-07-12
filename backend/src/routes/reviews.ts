import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// POST /api/reviews - Submit a new review
router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const { student_id, mobile_app_name, review_text } = req.body;

    // Validate required fields
    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_STUDENT_ID',
        message: 'student_id is required'
      });
    }

    if (!mobile_app_name) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_APP_NAME',
        message: 'mobile_app_name is required'
      });
    }

    if (!review_text || review_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REVIEW',
        message: 'review_text is required and cannot be empty'
      });
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_id, full_name')
      .eq('student_id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student ${student_id} not found`
      });
    }

    // Insert the review
    const { data: review, error: insertError } = await supabase
      .from('student_reviews')
      .insert({
        student_id: student_id,
        student_uuid: student.id,
        mobile_app_name: mobile_app_name.trim(),
        review_text: review_text.trim()
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Failed to create review:', insertError);
      return res.status(500).json({
        success: false,
        error: 'REVIEW_CREATE_FAILED',
        message: 'Failed to submit review'
      });
    }

    console.log(`✅ Review submitted: ${student_id} - ${mobile_app_name}`);

    return res.status(201).json({
      success: true,
      data: {
        review_id: review.id,
        student_id: review.student_id,
        student_name: student.full_name,
        mobile_app_name: review.mobile_app_name,
        review_text: review.review_text,
        submitted_at: review.created_at
      },
      message: `Review on ${mobile_app_name} submitted successfully`
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// GET /api/reviews/:student_id - Get student's reviews
router.get('/reviews/:student_id', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_id, full_name')
      .eq('student_id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student ${student_id} not found`
      });
    }

    // Get reviews with pagination
    const { data: reviews, error: reviewsError } = await supabase
      .from('student_reviews')
      .select('id, mobile_app_name, review_text, created_at')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reviewsError) {
      console.error('Failed to fetch reviews:', reviewsError);
      return res.status(500).json({
        success: false,
        error: 'REVIEWS_FETCH_FAILED',
        message: 'Failed to fetch reviews'
      });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('student_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student_id);

    if (countError) {
      console.error('Failed to count reviews:', countError);
    }

    return res.status(200).json({
      success: true,
      data: {
        student: {
          student_id: student.student_id,
          full_name: student.full_name,
          uuid: student.id
        },
        reviews: reviews || [],
        total_reviews: count || 0,
        showing: {
          limit,
          offset
        }
      }
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// GET /api/reviews - Get all reviews (admin view)
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const app_name = req.query.app_name as string;

    let query = supabase
      .from('student_reviews')
      .select(`
        id,
        student_id,
        mobile_app_name,
        review_text,
        created_at,
        students!student_reviews_student_uuid_fkey (
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by app name if provided
    if (app_name) {
      query = query.ilike('mobile_app_name', `%${app_name}%`);
    }

    const { data: reviews, error: reviewsError } = await query
      .range(offset, offset + limit - 1);

    if (reviewsError) {
      console.error('Failed to fetch all reviews:', reviewsError);
      return res.status(500).json({
        success: false,
        error: 'REVIEWS_FETCH_FAILED',
        message: 'Failed to fetch reviews'
      });
    }

    // Get total count
    let countQuery = supabase
      .from('student_reviews')
      .select('*', { count: 'exact', head: true });

    if (app_name) {
      countQuery = countQuery.ilike('mobile_app_name', `%${app_name}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Failed to count reviews:', countError);
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews: reviews || [],
        total_reviews: count || 0,
        showing: {
          limit,
          offset,
          app_name_filter: app_name || null
        }
      }
    });

  } catch (error) {
    console.error('All reviews fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export { router as reviewsRouter };