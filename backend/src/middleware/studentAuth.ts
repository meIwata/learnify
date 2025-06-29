import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedUser, ErrorResponse } from '../types';

/**
 * Extended Express Request interface with authenticated student
 */
export interface StudentAuthenticatedRequest extends Request {
  student: AuthenticatedUser & { student_id: string };
}

/**
 * Middleware to authenticate requests using student_id
 * This allows check-in without requiring email/password login
 */
export const authenticateStudent = async (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { student_id } = req.body;
    
    if (!student_id || typeof student_id !== 'string') {
      res.status(400).json({
        success: false,
        error: 'MISSING_STUDENT_ID',
        message: 'student_id is required in request body'
      });
      return;
    }

    // Look up student profile by student_id using admin client (bypasses RLS)
    const { data: profile, error } = await supabaseAdmin
      .from('student_profiles')
      .select('id, student_id, full_name, role')
      .eq('student_id', student_id)
      .single();

    if (error || !profile) {
      res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student with ID '${student_id}' not found. Please register first.`
      });
      return;
    }

    // Attach student info to request
    (req as StudentAuthenticatedRequest).student = {
      id: profile.id,
      student_id: profile.student_id,
      email: undefined, // Not needed for student_id auth
    };

    next();
  } catch (error) {
    console.error('Student authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error during student authentication'
    });
  }
};