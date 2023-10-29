import { PUBLIC_DEPLOYMENT_ENV, PUBLIC_SUPABASE_URL } from '$env/static/public'
import { VERCEL_URL } from '$env/static/private'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

export function getSiteUrl() {
  const protocol = PUBLIC_DEPLOYMENT_ENV === 'local' ? 'http' : 'https'
  return `${protocol}://${VERCEL_URL}`
}

export function getSupabaseAdminClient() {
  return createClient<Database>(
    PUBLIC_SUPABASE_URL,
    PRIVATE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )
}
