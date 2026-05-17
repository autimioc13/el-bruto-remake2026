import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

// Service client bypasses RLS — server-side only
export const supabase = createClient(url, serviceKey);
