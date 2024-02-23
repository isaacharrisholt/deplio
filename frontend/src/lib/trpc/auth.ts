import { auth_schema } from '$lib/types/api/auth'
import { getSupabaseAdminClient } from '$lib/utils.server'
import { error } from '@sveltejs/kit'
import { t } from './t'

const auth_middleware = t.middleware(async ({ input, ctx, next }) => {
  if (ctx.team) {
    return next({ ctx })
  }

  const result = auth_schema.safeParse(input)
  if (!result.success) {
    throw error(400, 'Invalid API key')
  }

  const api_key = result.data.api_key

  const supabase_admin = getSupabaseAdminClient()

  const { data: stored_api_key, error: api_key_fetch_error } = await supabase_admin
    .from('api_key')
    .select('*, team(*)')
    .eq('key', api_key)
    .maybeSingle()

  if (api_key_fetch_error) {
    throw error(500, api_key_fetch_error.message)
  }

  if (!stored_api_key) {
    throw error(401, 'Invalid API key')
  }

  return await next({ ctx: { ...ctx, team: stored_api_key.team } })
})

export const authenticated_procedure = t.procedure.use(auth_middleware)
