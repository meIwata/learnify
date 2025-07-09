import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// POST /api/reflections - Submit a new reflection
router.post('/reflections', async (req: Request, res: Response) => {
  try {
    const { student_id, mobile_app_name, reflection_text } = req.body;

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

    if (!reflection_text || reflection_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REFLECTION',
        message: 'reflection_text is required and cannot be empty'
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

    // Insert the reflection
    const { data: reflection, error: insertError } = await supabase
      .from('student_reflections')
      .insert({
        student_id: student_id,
        student_uuid: student.id,
        mobile_app_name: mobile_app_name.trim(),
        reflection_text: reflection_text.trim()
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Failed to create reflection:', insertError);
      return res.status(500).json({
        success: false,
        error: 'REFLECTION_CREATE_FAILED',
        message: 'Failed to submit reflection'
      });
    }

    console.log(`✅ Reflection submitted: ${student_id} - ${mobile_app_name}`);

    return res.status(201).json({
      success: true,
      data: {
        reflection_id: reflection.id,
        student_id: reflection.student_id,
        student_name: student.full_name,
        mobile_app_name: reflection.mobile_app_name,
        reflection_text: reflection.reflection_text,
        submitted_at: reflection.created_at
      },
      message: `Reflection on ${mobile_app_name} submitted successfully`
    });

  } catch (error) {
    console.error('Reflection submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// GET /api/reflections/:student_id - Get student's reflections
router.get('/reflections/:student_id', async (req: Request, res: Response) => {
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

    // Get reflections with pagination
    const { data: reflections, error: reflectionsError } = await supabase
      .from('student_reflections')
      .select('id, mobile_app_name, reflection_text, created_at')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reflectionsError) {
      console.error('Failed to fetch reflections:', reflectionsError);
      return res.status(500).json({
        success: false,
        error: 'REFLECTIONS_FETCH_FAILED',
        message: 'Failed to fetch reflections'
      });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('student_reflections')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student_id);

    if (countError) {
      console.error('Failed to count reflections:', countError);
    }

    return res.status(200).json({
      success: true,
      data: {
        student: {
          student_id: student.student_id,
          full_name: student.full_name,
          uuid: student.id
        },
        reflections: reflections || [],
        total_reflections: count || 0,
        showing: {
          limit,
          offset
        }
      }
    });

  } catch (error) {
    console.error('Reflections fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// GET /api/reflections - Get all reflections (admin view)
router.get('/reflections', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const app_name = req.query.app_name as string;

    let query = supabase
      .from('student_reflections')
      .select(`
        id,
        student_id,
        mobile_app_name,
        reflection_text,
        created_at,
        students!student_reflections_student_uuid_fkey (
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by app name if provided
    if (app_name) {
      query = query.ilike('mobile_app_name', `%${app_name}%`);
    }

    const { data: reflections, error: reflectionsError } = await query
      .range(offset, offset + limit - 1);

    if (reflectionsError) {
      console.error('Failed to fetch all reflections:', reflectionsError);
      return res.status(500).json({
        success: false,
        error: 'REFLECTIONS_FETCH_FAILED',
        message: 'Failed to fetch reflections'
      });
    }

    // Get total count
    let countQuery = supabase
      .from('student_reflections')
      .select('*', { count: 'exact', head: true });

    if (app_name) {
      countQuery = countQuery.ilike('mobile_app_name', `%${app_name}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Failed to count reflections:', countError);
    }

    return res.status(200).json({
      success: true,
      data: {
        reflections: reflections || [],
        total_reflections: count || 0,
        showing: {
          limit,
          offset,
          app_name_filter: app_name || null
        }
      }
    });

  } catch (error) {
    console.error('All reflections fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export { router as reflectionsRouter };