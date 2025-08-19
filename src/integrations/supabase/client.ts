import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://uheksobnyedarrpgxhju.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZWtzb2JueWVkYXJycGd4aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDk0NDUsImV4cCI6MjA2NTg4NTQ0NX0.dlbs4P3ZgXByNj7H1_k99YcOok9WmqgLZ1NtjONJYVs";
const SUPABASE_FUNCTIONS_URL = "https://uheksobnyedarrpgxhju.functions.supabase.co";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  functions: {
    url: SUPABASE_FUNCTIONS_URL
  },
  global: {
    headers: {
      'x-client-info': 'matbakh-app'
    }
  }
});