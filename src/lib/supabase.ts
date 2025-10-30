/**
 * Supabase Client Configuration
 *
 * SECURITY WARNING:
 * - NEVER hardcode API keys in this file
 * - ALWAYS use environment variables (import.meta.env.VITE_*)
 * - NEVER use SUPABASE_SERVICE_ROLE_KEY in client code (bypasses RLS)
 *
 * Required environment variables:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_PUBLISHABLE_KEY: Anon/public key (safe for client use with RLS)
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
