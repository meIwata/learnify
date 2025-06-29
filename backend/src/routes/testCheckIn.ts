import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

/**
 * POST /api/test/create-student
 * Create a test student for demo purposes
 */
router.post('/test/create-student', async (req: Request, res: Response) => {
  try {
    const { student_id, full_name } = req.body;
    
    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id is required'
      });
    }

    // First create a real auth user
    const email = `${student_id.toLowerCase()}@school.local`;
    const password = 'testpassword123';

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        student_id,
        full_name: full_name || `Test Student ${student_id}`
      },
      email_confirm: true
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return res.status(500).json({
        success: false,
        error: authError.message
      });
    }

    if (!authUser.user) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create auth user'
      });
    }

    // Wait a moment for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the created profile
    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (error) {
      console.error('Error creating test student:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: data,
      message: `Test student ${student_id} created successfully`
    });

  } catch (error) {
    console.error('Test student creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/test/check-in
 * Simple check-in for testing (assumes student exists)
 */
router.post('/test/check-in', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id is required'
      });
    }

    // Look up student
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('student_profiles')
      .select('id, student_id, full_name')
      .eq('student_id', student_id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student ${student_id} not found. Create student first with /api/test/create-student`
      });
    }

    // Create check-in record
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
        student_id: profile.student_id,
        student_name: profile.full_name,
        checked_in_at: checkIn.created_at
      },
      message: `Check-in recorded for ${profile.full_name} (${student_id})`
    });

  } catch (error) {
    console.error('Test check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/test/check-ins/:student_id
 * Get check-in history for testing
 */
router.get('/test/check-ins/:student_id', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    
    // Look up student
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('student_profiles')
      .select('id, student_id, full_name')
      .eq('student_id', student_id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student ${student_id} not found`
      });
    }

    // Get check-ins
    const { data: checkIns, error: checkInError } = await supabaseAdmin
      .from('check_ins')
      .select('id, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (checkInError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch check-ins'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: profile.id,
          student_id: profile.student_id,
          full_name: profile.full_name
        },
        check_ins: checkIns || [],
        total_check_ins: checkIns?.length || 0
      }
    });

  } catch (error) {
    console.error('Get check-ins error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as testCheckInRouter };