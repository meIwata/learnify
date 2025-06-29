import { Router, Response } from 'express';
import { z } from 'zod';
import { CheckInService } from '../services/checkInService';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { 
  CheckInRequest, 
  CheckInResponse, 
  CheckInHistoryResponse, 
  ErrorResponse 
} from '../types';

const router = Router();
const checkInService = new CheckInService();

// Request validation schemas
const checkInRequestSchema = z.object({
  timestamp: z.string().datetime().optional()
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0)
});

/**
 * POST /api/check-in
 * Create a new check-in for the authenticated user
 */
router.post(
  '/check-in',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response<CheckInResponse | ErrorResponse>) => {
    try {
      // Validate request body
      const validationResult = checkInRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Invalid request body: ' + validationResult.error.message
        });
        return;
      }

      const { timestamp } = validationResult.data;
      const userId = req.user.id;

      // Check if user can check-in (cooldown period)
      const cooldownResult = await checkInService.checkCooldown(userId);
      
      if (!cooldownResult.canCheckIn) {
        const nextAvailable = cooldownResult.nextAvailable!.toISOString();
        res.status(400).json({
          success: false,
          error: 'CHECK_IN_TOO_SOON',
          message: `You can check-in again at ${nextAvailable}`,
          next_available: nextAvailable
        });
        return;
      }

      // Create the check-in record
      const checkInTime = timestamp ? new Date(timestamp) : undefined;
      const checkIn = await checkInService.createCheckIn(userId, checkInTime);
      
      // Calculate next available check-in time
      const nextCheckInTime = await checkInService.getNextCheckInTime(userId);

      res.status(201).json({
        success: true,
        data: {
          id: checkIn.id,
          user_id: checkIn.user_id,
          checked_in_at: checkIn.created_at,
          next_check_in_available: nextCheckInTime!.toISOString()
        },
        message: 'Check-in recorded successfully'
      });

    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to process check-in'
      });
    }
  }
);

/**
 * GET /api/check-ins
 * Get check-in history for the authenticated user
 */
router.get(
  '/check-ins',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response<CheckInHistoryResponse | ErrorResponse>) => {
    try {
      // Validate query parameters
      const validationResult = historyQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Invalid query parameters: ' + validationResult.error.message
        });
        return;
      }

      const { limit, offset } = validationResult.data;
      const userId = req.user.id;

      // Get check-in history
      const { checkIns, total } = await checkInService.getCheckInHistory(userId, limit, offset);
      
      // Get next available check-in time
      const nextCheckInTime = await checkInService.getNextCheckInTime(userId);

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
      console.error('Check-in history error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve check-in history'
      });
    }
  }
);

export { router as checkInRouter };