import { auth_schema } from '$lib/types/api/auth'
import { getSupabaseAdminClient } from '$lib/utils.server'
import { error } from '@sveltejs/kit'
import { t } from './t'
import { hashApiKey } from '$lib/apiKeys'

const auth_middleware = t.middleware(async ({ input, ctx, next }) => {
  if (ctx.team) {
    return next({ ctx })
  }

  const result = auth_schema.required().safeParse(input)
  if (!result.success) {
    throw error(400, 'Invalid API key')
  }

  const api_key = result.data.api_key

  const supabase_admin = getSupabaseAdminClient()

  const key_hash = await hashApiKey(api_key)
  const key_prefix = api_key.slice(0, 6)

  const { data: stored_api_key, error: api_key_fetch_error } = await supabase_admin
    .from('api_key')
    .select('*, team(*)')
    .eq('key_hash', key_hash)
    .eq('key_prefix', key_prefix)
    .or(`expires_at.lte.${new Date().toISOString()}, expires_at.is.null`)
    .is('revoked_at', null)
    .is('deleted_at', null)
    .maybeSingle()

  if (api_key_fetch_error) {
    console.error('error fetching api key', api_key_fetch_error)
    throw error(500, api_key_fetch_error.message)
  }

  if (!stored_api_key) {
    throw error(401, 'Invalid API key')
  }

  return await next({
    ctx: { ...ctx, team: stored_api_key.team, api_key: stored_api_key },
  })
})

export const authenticated_procedure = t.procedure
  .input(auth_schema)
  .use(auth_middleware)
