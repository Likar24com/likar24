import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewlgummqacagkdumjysj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bGd1bW1xYWNhZ2tkdW1qeXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzIyODYsImV4cCI6MjA2NzMwODI4Nn0.4zIAw0FVcHzL8pRbmsV5CEFSwrbljnfl8bRehKoxHLw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
