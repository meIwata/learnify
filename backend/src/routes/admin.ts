import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAdmin, AdminRequest } from '../middleware/adminAuth';

const router = Router();

// Get all students (admin only)
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: students
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch students'
    });
  }
});

// Delete student (admin only)
router.delete('/students/:studentId', requireAdmin, async (req: AdminRequest, res) => {
  try {
    const { studentId } = req.params;
    
    // Prevent admin from deleting themselves
    if (studentId === req.adminStudentId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own admin account'
      });
    }

    // Check if student exists
    const { data: existingStudent, error: selectError } = await supabase
      .from('students')
      .select('student_id, full_name, is_admin')
      .eq('student_id', studentId)
      .single();

    if (selectError || !existingStudent) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Prevent deletion of other admins
    if (existingStudent.is_admin) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete admin accounts'
      });
    }

    // Delete related data first (check-ins, reviews)
    await supabase
      .from('student_check_ins')
      .delete()
      .eq('student_id', studentId);

    await supabase
      .from('student_reviews')
      .delete()
      .eq('student_id', studentId);

    // Delete the student
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('student_id', studentId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: `Student ${studentId} (${existingStudent.full_name}) has been deleted`,
      data: {
        deleted_student: existingStudent
      }
    });

  } catch (error: any) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete student'
    });
  }
});

// Get admin status
router.get('/status', requireAdmin, async (req: AdminRequest, res) => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('student_id, full_name, is_admin')
      .eq('student_id', req.adminStudentId)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        admin: student,
        permissions: ['delete_students', 'view_all_students']
      }
    });
  } catch (error: any) {
    console.error('Error getting admin status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get admin status'
    });
  }
});

export default router;