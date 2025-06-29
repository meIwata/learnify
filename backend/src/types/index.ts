/**
 * Type definitions for the Learnify backend API
 */

export interface CheckInRecord {
  id: string;
  user_id: string;
  created_at: string;
}

export interface CheckInRequest {
  timestamp?: string;
}

export interface CheckInResponse {
  success: true;
  data: {
    id: string;
    user_id: string;
    checked_in_at: string;
    next_check_in_available: string;
  };
  message: string;
}

export interface CheckInHistoryResponse {
  success: true;
  data: {
    check_ins: Array<{
      id: string;
      checked_in_at: string;
    }>;
    total: number;
    next_check_in_available: string | null;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  next_available?: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string | undefined;
  student_id?: string | undefined;
}

export interface CheckInCooldownResult {
  canCheckIn: boolean;
  lastCheckIn?: Date;
  nextAvailable?: Date;
}