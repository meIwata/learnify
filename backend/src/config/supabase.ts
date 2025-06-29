import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment-specific config
const envFile = process.env.NODE_ENV === 'local' ? '.env.local' : '.env';
dotenv.config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error(
    `Missing required Supabase environment variables. Please check your ${envFile} file.`
  );
}

/**
 * Client-side Supabase client for user authentication and RLS
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service role client for admin operations (bypasses RLS)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const config = {
  checkInCooldownHours: parseInt(process.env.CHECK_IN_COOLDOWN_HOURS || '4', 10),
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isLocal: supabaseUrl?.includes('localhost'),
};