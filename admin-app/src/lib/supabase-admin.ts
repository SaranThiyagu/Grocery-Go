import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

let _supabaseAdmin: SupabaseClient<Database> | null = null

// Server-side admin client that bypasses Row Level Security.
// NEVER expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser.
export const supabaseAdmin: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.')
      }
      _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)
    }
    return (_supabaseAdmin as any)[prop]
  },
})
