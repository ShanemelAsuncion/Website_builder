import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jnqoeraxlajlwofvcawf.supabase.co';
// Prefer service role key on the server (never expose to client). Fallback to anon key.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
  console.warn('SUPABASE_URL is not set; Supabase client will not be initialized properly.');
}
if (!SUPABASE_KEY) {
  console.warn('Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_KEY is set; Supabase client will not be initialized properly.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || '');

export default supabase;
