import { supabase } from '../config/supabase';
import { config } from '../config/supabase';
import { CheckInRecord, CheckInCooldownResult } from '../types';

/**
 * Service class for handling check-in operations
 */
export class CheckInService {
  
  /**
   * Check if user can perform a check-in (4-hour cooldown)
   */
  async checkCooldown(userId: string): Promise<CheckInCooldownResult> {
    try {
      // Get the user's most recent check-in
      const { data: lastCheckIn, error } = await supabase
        .from('check_ins')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      // If no previous check-ins, user can check in
      if (!lastCheckIn) {
        return { canCheckIn: true };
      }

      const lastCheckInTime = new Date(lastCheckIn.created_at);
      const now = new Date();
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckInTime.getTime()) / (1000 * 60 * 60);

      const canCheckIn = hoursSinceLastCheckIn >= config.checkInCooldownHours;
      
      if (!canCheckIn) {
        const nextAvailable = new Date(
          lastCheckInTime.getTime() + (config.checkInCooldownHours * 60 * 60 * 1000)
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
   * Create a new check-in record for the user
   */
  async createCheckIn(userId: string, timestamp?: Date): Promise<CheckInRecord> {
    try {
      const checkInTime = timestamp || new Date();

      const { data, error } = await supabase
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

      return data;
    } catch (error) {
      console.error('Error creating check-in:', error);
      throw new Error('Failed to create check-in record');
    }
  }

  /**
   * Get user's check-in history with pagination
   */
  async getCheckInHistory(
    userId: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ checkIns: CheckInRecord[]; total: number }> {
    try {
      // Get paginated check-ins
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id, user_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (checkInsError) {
        throw checkInsError;
      }

      // Get total count
      const { count, error: countError } = await supabase
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
   * Calculate next available check-in time for user
   */
  async getNextCheckInTime(userId: string): Promise<Date | null> {
    const cooldownResult = await this.checkCooldown(userId);
    return cooldownResult.nextAvailable || null;
  }
}