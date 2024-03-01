import { t } from '$lib/trpc/t'
import { authenticated_procedure } from '$lib/trpc/auth'
import { get_q_requests_schema } from '$lib/types/api/q'
import { error } from '@sveltejs/kit'

const get_q_requests = authenticated_procedure
  .input(get_q_requests_schema)
  .query(async ({ input, ctx }) => {
    const { data: q_requests, error: q_request_fetch_error } = await ctx.supabase
      .from('q_request')
      .select('*, q_response (*)')
      .eq('team_id', ctx.team.id)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, foreignTable: 'q_response' })
      .range((input.page - 1) * input.page_size, input.page * input.page_size - 1)

    if (q_request_fetch_error) {
      throw error(500, q_request_fetch_error?.message || 'No requests')
    }

    return { qRequests: q_requests }
  })

export const requests = t.router({
  get: get_q_requests,
})
