import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.')
}

// Server-side admin client that bypasses Row Level Security.
// NEVER expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser.
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)
