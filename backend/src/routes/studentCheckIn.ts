import { Router, Response } from 'express';
import { z } from 'zod';
import { StudentCheckInService } from '../services/studentCheckInService';
import { authenticateStudent, StudentAuthenticatedRequest } from '../middleware/studentAuth';
import { supabaseAdmin } from '../config/supabase';
import { 
  CheckInRequest, 
  CheckInResponse, 
  CheckInHistoryResponse, 
  ErrorResponse 
} from '../types';

const router = Router();
const studentCheckInService = new StudentCheckInService();

// Request validation schemas
const studentCheckInRequestSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  timestamp: z.string().datetime().optional(),
  full_name: z.string().optional()
});

const studentHistoryRequestSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0)
});

const studentRegisterSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  full_name: z.string().optional()
});

/**
 * POST /api/student/check-in
 * Create a new check-in using only student_id (no authentication required)
 */
router.post(
  '/student/check-in',
  async (req: StudentAuthenticatedRequest, res: Response<CheckInResponse | ErrorResponse>) => {
    try {
      // Validate request body
      const validationResult = studentCheckInRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Invalid request body: ' + validationResult.error.message
        });
        return;
      }

      const { student_id, timestamp, full_name } = validationResult.data;

      // Look up student by student_id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('student_profiles')
        .select('id, student_id, full_name')
        .eq('student_id', student_id)
        .single();

      let userId: string;
      let actualStudentId: string;

      if (profileError || !profile) {
        // Student doesn't exist, register them first
        console.log(`🆕 Registering new student: ${student_id}`);
        const result = await studentCheckInService.registerStudent(student_id, full_name);
        userId = result.userId;
        actualStudentId = result.studentId;
      } else {
        // Student exists
        userId = profile.id;
        actualStudentId = profile.student_id;
      }

      // Check if student can check-in (cooldown period)
      const cooldownResult = await studentCheckInService.checkCooldown(userId);
      
      if (!cooldownResult.canCheckIn) {
        const nextAvailable = cooldownResult.nextAvailable!.toISOString();
        res.status(400).json({
          success: false,
          error: 'CHECK_IN_TOO_SOON',
          message: `Student ${actualStudentId} can check-in again at ${nextAvailable}`,
          next_available: nextAvailable
        });
        return;
      }

      // Create the check-in record
      const checkInTime = timestamp ? new Date(timestamp) : undefined;
      const checkIn = await studentCheckInService.createCheckIn(userId, actualStudentId, checkInTime);
      
      // Calculate next available check-in time
      const nextCheckInTime = await studentCheckInService.getNextCheckInTime(userId);

      res.status(201).json({
        success: true,
        data: {
          id: checkIn.id,
          user_id: checkIn.user_id,
          checked_in_at: checkIn.created_at,
          next_check_in_available: nextCheckInTime!.toISOString()
        },
        message: `Check-in recorded successfully for student ${actualStudentId}`
      });

    } catch (error) {
      console.error('Student check-in error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to process student check-in'
      });
    }
  }
);

/**
 * POST /api/student/check-ins
 * Get check-in history using student_id (no authentication required)
 */
router.post(
  '/student/check-ins',
  async (req: any, res: Response<CheckInHistoryResponse | ErrorResponse>) => {
    try {
      // Validate request body
      const validationResult = studentHistoryRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Invalid request body: ' + validationResult.error.message
        });
        return;
      }

      const { student_id, limit, offset } = validationResult.data;

      // Look up student by student_id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('student_profiles')
        .select('id, student_id')
        .eq('student_id', student_id)
        .single();

      if (profileError || !profile) {
        res.status(404).json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: `Student with ID '${student_id}' not found`
        });
        return;
      }

      const userId = profile.id;

      // Get check-in history
      const { checkIns, total } = await studentCheckInService.getCheckInHistory(userId, limit, offset);
      
      // Get next available check-in time
      const nextCheckInTime = await studentCheckInService.getNextCheckInTime(userId);

      res.status(200).json({
        success: true,
        data: {
          check_ins: checkIns.map(checkIn => ({
            id: checkIn.id,
            checked_in_at: checkIn.created_at
          })),
          total,
          next_check_in_available: nextCheckInTime?.toISOString() || null
        }
      });

    } catch (error) {
      console.error('Student check-in history error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve student check-in history'
      });
    }
  }
);

/**
 * POST /api/student/register
 * Register a new student (optional - auto-registration happens on first check-in)
 */
router.post(
  '/student/register',
  async (req: any, res: Response) => {
    try {
      const validationResult = studentRegisterSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Invalid request body: ' + validationResult.error.message
        });
        return;
      }

      const { student_id, full_name } = validationResult.data;

      // Check if student already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('student_profiles')
        .select('student_id')
        .eq('student_id', student_id)
        .single();

      if (existingProfile) {
        res.status(409).json({
          success: false,
          error: 'STUDENT_EXISTS',
          message: `Student with ID '${student_id}' already exists`
        });
        return;
      }

      // Register new student
      const result = await studentCheckInService.registerStudent(student_id, full_name);

      res.status(201).json({
        success: true,
        data: {
          student_id: result.studentId,
          user_id: result.userId
        },
        message: `Student ${result.studentId} registered successfully`
      });

    } catch (error) {
      console.error('Student registration error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to register student'
      });
    }
  }
);

export { router as studentCheckInRouter };