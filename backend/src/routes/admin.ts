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

// Fix quiz scores - recalculate to award points only once per question
router.post('/fix-quiz-scores', requireAdmin, async (req: AdminRequest, res) => {
  try {
    console.log(`Admin ${req.adminStudentId} requested quiz score fix`);

    // Step 1: Get all students who have quiz attempts
    const { data: allAttempts, error: studentsError } = await supabase
      .from('student_quiz_attempts')
      .select('student_id, student_uuid');

    if (studentsError) {
      throw studentsError;
    }

    // Get unique students
    const studentMap = new Map();
    allAttempts?.forEach(attempt => {
      if (!studentMap.has(attempt.student_id)) {
        studentMap.set(attempt.student_id, {
          student_id: attempt.student_id,
          student_uuid: attempt.student_uuid
        });
      }
    });
    const studentsWithAttempts = Array.from(studentMap.values());

    if (!studentsWithAttempts || studentsWithAttempts.length === 0) {
      return res.json({
        success: true,
        message: 'No quiz attempts found to fix',
        data: {
          students_processed: 0,
          total_points_corrected: 0
        }
      });
    }

    let totalStudentsProcessed = 0;
    let totalPointsCorrected = 0;
    const results: any[] = [];

    // Step 2: Process each student
    for (const student of studentsWithAttempts) {
      // Get all correct attempts for this student (only the first correct attempt per question)
      const { data: correctAttempts, error: attemptsError } = await supabase
        .from('student_quiz_attempts')
        .select('question_id, created_at, points_earned')
        .eq('student_id', student.student_id)
        .eq('is_correct', true)
        .order('question_id, created_at');

      if (attemptsError) {
        console.error(`Error fetching attempts for ${student.student_id}:`, attemptsError);
        continue;
      }

      if (!correctAttempts || correctAttempts.length === 0) {
        continue;
      }

      // Group by question_id and keep only the first (earliest) correct attempt
      const uniqueQuestions = new Map();
      for (const attempt of correctAttempts) {
        if (!uniqueQuestions.has(attempt.question_id)) {
          uniqueQuestions.set(attempt.question_id, attempt);
        }
      }

      // Calculate correct scores (5 points per unique question answered correctly)
      const uniqueCorrectAttempts = Array.from(uniqueQuestions.values());
      const correctTotalPoints = uniqueCorrectAttempts.length * 5;

      // Get all attempts for this student to calculate total attempts
      const { data: allAttempts, error: allAttemptsError } = await supabase
        .from('student_quiz_attempts')
        .select('question_id, is_correct, created_at')
        .eq('student_id', student.student_id)
        .order('created_at');

      if (allAttemptsError) {
        console.error(`Error fetching all attempts for ${student.student_id}:`, allAttemptsError);
        continue;
      }

      const totalAttempts = allAttempts?.length || 0;
      const totalCorrectAnswers = uniqueCorrectAttempts.length;

      // Get current score to compare
      const { data: currentScore } = await supabase
        .from('student_quiz_scores')
        .select('total_points, total_questions_attempted, total_correct_answers')
        .eq('student_id', student.student_id)
        .single();

      const oldPoints = currentScore?.total_points || 0;
      const pointsCorrection = correctTotalPoints - oldPoints;

      // Step 3: Fix individual attempt records - set points_earned to 0 for duplicate attempts
      // Keep only the first (earliest) correct attempt with points for each question
      for (const attempt of correctAttempts) {
        const isFirstAttempt = uniqueQuestions.get(attempt.question_id)?.created_at === attempt.created_at;
        const expectedPoints = isFirstAttempt ? 5 : 0;
        
        // Update this attempt if points are incorrect
        if (attempt.points_earned !== expectedPoints) {
          await supabase
            .from('student_quiz_attempts')
            .update({ points_earned: expectedPoints })
            .eq('student_id', student.student_id)
            .eq('question_id', attempt.question_id)
            .eq('created_at', attempt.created_at);
        }
      }

      // Update the score record
      const { error: updateError } = await supabase
        .from('student_quiz_scores')
        .update({
          total_questions_attempted: totalAttempts,
          total_correct_answers: totalCorrectAnswers,
          total_points: correctTotalPoints,
          last_quiz_date: allAttempts?.[allAttempts.length - 1]?.created_at,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', student.student_id);

      if (updateError) {
        console.error(`Error updating score for ${student.student_id}:`, updateError);
        continue;
      }

      totalStudentsProcessed++;
      totalPointsCorrected += Math.abs(pointsCorrection);

      results.push({
        student_id: student.student_id,
        old_points: oldPoints,
        new_points: correctTotalPoints,
        points_corrected: pointsCorrection,
        unique_questions_answered: totalCorrectAnswers,
        total_attempts: totalAttempts
      });

      console.log(`Fixed ${student.student_id}: ${oldPoints} → ${correctTotalPoints} points (${pointsCorrection >= 0 ? '+' : ''}${pointsCorrection})`);
    }

    res.json({
      success: true,
      message: `Quiz scores fixed for ${totalStudentsProcessed} students`,
      data: {
        students_processed: totalStudentsProcessed,
        total_points_corrected: totalPointsCorrected,
        details: results
      }
    });

  } catch (error: any) {
    console.error('Error fixing quiz scores:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fix quiz scores'
    });
  }
});

export default router;