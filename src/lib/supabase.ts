import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rcoklaqspdkgxrtxmdmj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjb2tsYXFzcGRrZ3hydHhtZG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjE1MjMsImV4cCI6MjA4Njk5NzUyM30.M2etc1hY5Ucuhr2hQIha3mI5YAj3gWGfKVpqay9Clmk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
