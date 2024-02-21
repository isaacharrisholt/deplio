import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

export function getSupabaseAdminClient() {
  return createClient<Database>(
    PUBLIC_SUPABASE_URL,
    PRIVATE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )
}
