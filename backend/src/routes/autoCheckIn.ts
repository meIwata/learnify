import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

/**
 * POST /api/auto/check-in
 * Auto-registration check-in - creates student on first use
 */
router.post('/auto/check-in', async (req: Request, res: Response) => {
  try {
    const { student_id, full_name } = req.body;
    
    if (!student_id || typeof student_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'MISSING_STUDENT_ID',
        message: 'student_id is required'
      });
    }

    // Look up student in simplified students table
    let { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, student_id, full_name')
      .eq('student_id', student_id)
      .single();

    // If student doesn't exist, prevent new signups
    if (studentError || !student) {
      console.log(`❌ Unknown student attempted check-in: ${student_id}`);
      return res.status(403).json({
        success: false,
        error: 'STUDENT_NOT_REGISTERED',
        message: `Student ID '${student_id}' is not registered. Please contact your instructor.`
      });
    }

    // Create check-in record
    const { data: checkIn, error: checkInError } = await supabaseAdmin
      .from('student_check_ins')
      .insert({
        student_id: student.student_id,
        student_uuid: student.id,
        created_at: new Date().toISOString()
      })
      .select('id, student_id, created_at')
      .single();

    if (checkInError || !checkIn) {
      console.error('Failed to create check-in:', checkInError);
      return res.status(500).json({
        success: false,
        error: 'CHECK_IN_FAILED',
        message: 'Failed to create check-in record'
      });
    }

    console.log(`✅ Check-in recorded: ${student.student_id} (ID: ${checkIn.id})`);

    res.status(201).json({
      success: true,
      data: {
        check_in_id: checkIn.id,
        student_id: student.student_id,
        student_name: student.full_name,
        checked_in_at: checkIn.created_at
      },
      message: `Check-in recorded for ${student.full_name || student.student_id}`
    });

  } catch (error) {
    console.error('Auto check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/auto/check-ins/:student_id
 * Get check-in history for a student
 */
router.get('/auto/check-ins/:student_id', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    // Look up student
    const { data: student, error: studentError } = await supabaseAdmin
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

    // Get check-ins
    const { data: checkIns, error: checkInError } = await supabaseAdmin
      .from('student_check_ins')
      .select('id, created_at')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (checkInError) {
      return res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Failed to fetch check-ins'
      });
    }

    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from('student_check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student_id);

    res.status(200).json({
      success: true,
      data: {
        student: {
          student_id: student.student_id,
          full_name: student.full_name,
          uuid: student.id
        },
        check_ins: checkIns || [],
        total_check_ins: count || 0,
        showing: {
          limit: Number(limit),
          offset: Number(offset)
        }
      }
    });

  } catch (error) {
    console.error('Get check-ins error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/auto/students/:student_id
 * Get individual student information for authentication
 */
router.get('/auto/students/:student_id', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    
    // Look up student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, student_id, full_name, created_at')
      .eq('student_id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(403).json({
        success: false,
        error: 'STUDENT_NOT_REGISTERED',
        message: `Student ID '${student_id}' is not registered. Please contact your instructor.`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          student_id: student.student_id,
          full_name: student.full_name,
          uuid: student.id,
          created_at: student.created_at
        }
      }
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/auto/students
 * Get all students (for admin purposes)
 */
router.get('/auto/students', async (req: Request, res: Response) => {
  try {
    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select('id, student_id, full_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Failed to fetch students'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        students: students || [],
        total: students?.length || 0
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export { router as autoCheckInRouter };