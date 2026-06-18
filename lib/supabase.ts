import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

// Admin client — service role, bypasses RLS. Use ONLY in admin API routes.
export const supabase = createClient(url, serviceKey);

// Public client — anon key, respects RLS. Use in public-facing API routes.
export const supabasePublic = anonKey
  ? createClient(url, anonKey)
  : supabase; // fallback to service role if anon key not configured
