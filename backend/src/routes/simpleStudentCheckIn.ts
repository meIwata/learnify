import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

/**
 * POST /api/simple/check-in
 * Simple check-in with just student_id
 */
router.post('/simple/check-in', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_STUDENT_ID',
        message: 'student_id is required'
      });
    }

    // Check if student is registered (no auto-registration)
    const { data: profile, error } = await supabaseAdmin
      .from('students')
      .select('id, student_id')
      .eq('student_id', student_id)
      .single();

    if (error || !profile) {
      // Student doesn't exist - prevent new signups
      return res.status(403).json({
        success: false,
        error: 'STUDENT_NOT_REGISTERED',
        message: `Student ID '${student_id}' is not registered. Please contact your instructor.`
      });
    }

    // No cooldown - students can check-in anytime

    // Create check-in
    const { data: checkIn, error: checkInError } = await supabaseAdmin
      .from('check_ins')
      .insert({
        user_id: profile.id,
        created_at: new Date().toISOString()
      })
      .select('id, user_id, created_at')
      .single();

    if (checkInError || !checkIn) {
      return res.status(500).json({
        success: false,
        error: 'CHECK_IN_FAILED',
        message: 'Failed to create check-in record'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: checkIn.id,
        user_id: checkIn.user_id,
        checked_in_at: checkIn.created_at,
        student_id: student_id
      },
      message: `Check-in recorded successfully for student ${student_id}`
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/simple/check-ins
 * Get student check-in history
 */
router.post('/simple/check-ins', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_STUDENT_ID',
        message: 'student_id is required'
      });
    }

    // Look up student
    const { data: profile, error } = await supabaseAdmin
      .from('students')
      .select('id, student_id')
      .eq('student_id', student_id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student with ID '${student_id}' not found`
      });
    }

    // Get check-ins
    const { data: checkIns } = await supabaseAdmin
      .from('check_ins')
      .select('id, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        check_ins: (checkIns || []).map(checkIn => ({
          id: checkIn.id,
          checked_in_at: checkIn.created_at
        })),
        total: checkIns?.length || 0
      }
    });

  } catch (error) {
    console.error('Check-in history error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export { router as simpleStudentCheckInRouter };