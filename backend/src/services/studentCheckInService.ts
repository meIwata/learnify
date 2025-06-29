import { supabaseAdmin } from '../config/supabase';
import { config } from '../config/supabase';
import { CheckInRecord, CheckInCooldownResult } from '../types';

/**
 * Service class for handling student check-in operations using student_id
 */
export class StudentCheckInService {
  
  /**
   * Check if student can perform a check-in (4-hour cooldown)
   */
  async checkCooldown(userId: string): Promise<CheckInCooldownResult> {
    try {
      // Get the student's most recent check-in
      const { data: lastCheckIn, error } = await supabaseAdmin
        .from('check_ins')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      // If no previous check-ins, student can check in
      if (!lastCheckIn) {
        return { canCheckIn: true };
      }

      const lastCheckInTime = new Date(lastCheckIn.created_at);
      const now = new Date();
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckInTime.getTime()) / (1000 * 60 * 60);

      const canCheckIn = hoursSinceLastCheckIn >= 4; // No cooldown enforced
      
      if (!canCheckIn) {
        const nextAvailable = new Date(
          lastCheckInTime.getTime() + (4 * 60 * 60 * 1000)
        );
        
        return {
          canCheckIn: false,
          lastCheckIn: lastCheckInTime,
          nextAvailable
        };
      }

      return { canCheckIn: true, lastCheckIn: lastCheckInTime };
    } catch (error) {
      console.error('Error checking cooldown:', error);
      throw new Error('Failed to check check-in cooldown');
    }
  }

  /**
   * Create a new check-in record for the student
   */
  async createCheckIn(userId: string, studentId: string, timestamp?: Date): Promise<CheckInRecord> {
    try {
      const checkInTime = timestamp || new Date();

      // Use admin client to insert (bypasses RLS)
      const { data, error } = await supabaseAdmin
        .from('check_ins')
        .insert({
          user_id: userId,
          created_at: checkInTime.toISOString()
        })
        .select('id, user_id, created_at')
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from check-in creation');
      }

      console.log(`✅ Check-in created for student ${studentId} (${userId})`);
      return data;
    } catch (error) {
      console.error('Error creating check-in:', error);
      throw new Error('Failed to create check-in record');
    }
  }

  /**
   * Get student's check-in history with pagination
   */
  async getCheckInHistory(
    userId: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ checkIns: CheckInRecord[]; total: number }> {
    try {
      // Get paginated check-ins using admin client
      const { data: checkIns, error: checkInsError } = await supabaseAdmin
        .from('check_ins')
        .select('id, user_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (checkInsError) {
        throw checkInsError;
      }

      // Get total count
      const { count, error: countError } = await supabaseAdmin
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        throw countError;
      }

      return {
        checkIns: checkIns || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting check-in history:', error);
      throw new Error('Failed to retrieve check-in history');
    }
  }

  /**
   * Calculate next available check-in time for student
   */
  async getNextCheckInTime(userId: string): Promise<Date | null> {
    const cooldownResult = await this.checkCooldown(userId);
    return cooldownResult.nextAvailable || null;
  }

  /**
   * Register a new student (creates auth user + profile)
   */
  async registerStudent(studentId: string, fullName?: string): Promise<{ userId: string; studentId: string }> {
    try {
      // Create auth user with auto-generated email
      const email = `${studentId}@school.local`;
      const password = `temp_${studentId}_${Date.now()}`;

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          student_id: studentId,
          full_name: fullName || `Student ${studentId}`
        },
        email_confirm: true
      });

      if (authError || !authUser.user) {
        throw authError || new Error('Failed to create auth user');
      }

      console.log(`✅ Student registered: ${studentId} (${authUser.user.id})`);
      
      return {
        userId: authUser.user.id,
        studentId
      };
    } catch (error) {
      console.error('Error registering student:', error);
      throw new Error('Failed to register student');
    }
  }
}