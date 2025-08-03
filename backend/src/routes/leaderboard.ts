import { Request, Response, Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

interface LeaderboardEntry {
  student_id: string;
  full_name: string;
  total_marks: number;
  total_check_ins: number;
  latest_check_in: string | null;
  rank: number;
}

/**
 * Shared function to get leaderboard data
 */
async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
  // Query to get leaderboard data with scores calculated
  const { data: leaderboardData, error } = await supabase
    .from('students')
    .select(`
      student_id,
      full_name,
      created_at,
      student_check_ins (
        id,
        created_at
      ),
      student_reviews (
        id,
        created_at
      ),
      submissions (
        id,
        submission_type,
        created_at
      ),
      student_quiz_scores (
        total_points
      )
    `)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch leaderboard data');
  }

  if (!leaderboardData) {
    return [];
  }

  // Calculate scores and prepare leaderboard entries
  const leaderboardEntries: Omit<LeaderboardEntry, 'rank'>[] = leaderboardData.map(student => {
    const checkIns = student.student_check_ins || [];
    const reviews = student.student_reviews || [];
    const submissions = student.submissions || [];
    const quizScores = student.student_quiz_scores?.[0]; // Get first (and only) quiz score record
    const totalCheckIns = checkIns.length;
    const totalReviews = reviews.length;
    const totalSubmissions = submissions.length;
    
    // Scoring: 10 marks for check-ins (if any), 10 marks for app review (if any), 10 marks for submissions (if any)
    // Plus variable points from quiz (5 points per correct answer)
    let totalMarks = 0;
    if (totalCheckIns > 0) totalMarks += 10; // Check-in marks
    if (totalReviews > 0) totalMarks += 10;  // App review marks
    if (totalSubmissions > 0) totalMarks += 10; // Submission marks (any number of screenshots = 10 points)
    if (quizScores?.total_points) totalMarks += quizScores.total_points; // Quiz points (5 per correct answer)
    
    // Find latest check-in
    const latestCheckIn = checkIns.length > 0 
      ? checkIns.reduce((latest, current) => 
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        ).created_at
      : null;

    return {
      student_id: student.student_id,
      full_name: student.full_name,
      total_marks: totalMarks,
      total_check_ins: totalCheckIns,
      latest_check_in: latestCheckIn
    };
  });

  // Sort by ranking criteria
  const sortedEntries = leaderboardEntries.sort((a, b) => {
    // Primary: Total marks (descending)
    if (a.total_marks !== b.total_marks) {
      return b.total_marks - a.total_marks;
    }
    
    // Tiebreaker 1: Number of check-ins (descending)
    if (a.total_check_ins !== b.total_check_ins) {
      return b.total_check_ins - a.total_check_ins;
    }
    
    // Tiebreaker 2: Most recent check-in (more recent first)
    if (a.latest_check_in && b.latest_check_in) {
      const dateA = new Date(a.latest_check_in);
      const dateB = new Date(b.latest_check_in);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
    } else if (a.latest_check_in && !b.latest_check_in) {
      return -1;
    } else if (!a.latest_check_in && b.latest_check_in) {
      return 1;
    }
    
    // Tiebreaker 3: Alphabetical by name
    return a.full_name.localeCompare(b.full_name);
  });

  // Add rank numbers
  const rankedEntries: LeaderboardEntry[] = sortedEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));

  return rankedEntries;
}

/**
 * GET /api/leaderboard
 * Get ranked leaderboard of all students based on their current marks
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    // Get query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    // Get leaderboard data using shared function
    const rankedEntries = await getLeaderboardData();

    // Apply pagination
    const paginatedEntries = rankedEntries.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: {
        leaderboard: paginatedEntries,
        total_students: rankedEntries.length,
        showing: {
          limit,
          offset,
          total_pages: Math.ceil(rankedEntries.length / limit),
          current_page: Math.floor(offset / limit) + 1
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/leaderboard/student/:student_id
 * Get specific student's ranking and nearby competitors
 */
router.get('/leaderboard/student/:student_id', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const context = Math.min(parseInt(req.query.context as string) || 5, 20); // Students above/below

    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_STUDENT_ID',
        message: 'student_id parameter is required'
      });
    }

    // Get the full leaderboard using the same logic as the main endpoint
    const fullLeaderboard = await getLeaderboardData();
    
    // Find the student
    const studentIndex = fullLeaderboard.findIndex(entry => entry.student_id === student_id);
    
    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student ${student_id} not found in leaderboard`
      });
    }

    const studentEntry = fullLeaderboard[studentIndex];
    
    // Get context around the student
    const startIndex = Math.max(0, studentIndex - context);
    const endIndex = Math.min(fullLeaderboard.length, studentIndex + context + 1);
    const contextEntries = fullLeaderboard.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        student: studentEntry,
        context: contextEntries,
        total_students: fullLeaderboard.length,
        student_index: studentIndex
      }
    });

  } catch (error) {
    console.error('Student leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export default router;