import { t } from '$lib/trpc/t'
import { metadataSchema } from '$lib/types/api/meta'
import { getQRequestSchema } from '$lib/types/api/q'
import { error } from '@sveltejs/kit'
import { z } from 'zod'

export const get_q_requests = t.procedure
  .input(z.intersection(metadataSchema.required(), getQRequestSchema))
  .query(async ({ input, ctx }) => {
    const { data: qRequests, error: requestsFetchError } = await ctx.supabase
      .from('q_request')
      .select('*, q_response (*)')
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, foreignTable: 'q_response' })
      .range((input.page - 1) * input.page_size, input.page * input.page_size - 1)

    if (requestsFetchError) {
      throw error(500, requestsFetchError?.message || 'No requests')
    }

    return { qRequests }
  })
