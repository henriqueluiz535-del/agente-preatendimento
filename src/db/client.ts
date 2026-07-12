import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Cliente Supabase usando a service role key (backend confiável).
export const db = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { persistSession: false },
});
