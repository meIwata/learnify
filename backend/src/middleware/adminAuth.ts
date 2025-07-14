import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AdminRequest extends Request {
  adminStudentId?: string;
}

export const requireAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.headers['x-student-id'] as string;
    
    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Student ID required in x-student-id header'
      });
    }

    // Check if student exists and is admin
    const { data: student, error } = await supabase
      .from('students')
      .select('student_id, is_admin')
      .eq('student_id', studentId)
      .eq('is_admin', true)
      .single();

    if (error || !student) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    req.adminStudentId = studentId;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin authentication failed'
    });
  }
};