import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { supabase } = await parent()
  const { data: requests, error: requestsFetchError } = await supabase
    .from('q_request')
    .select('*, q_response (*)')
    .order('created_at', { ascending: false })
    .order('created_at', { ascending: true, foreignTable: 'q_response' })
    .limit(25)

  if (requestsFetchError) {
    throw error(500, requestsFetchError?.message || 'No requests')
  }

  return { qRequests: requests }
}
