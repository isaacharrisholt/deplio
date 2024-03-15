import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async (event) => {
  const {
    locals: { api },
    url,
  } = event

  let page: number | undefined = +(url.searchParams.get('page') ?? 0)
  if (isNaN(page) || page < 1) {
    page = undefined
  }

  const { data: q_requests, error: q_requests_error } = await api.q.list({ page })
  if (q_requests_error) {
    console.log('error fetching q messages', q_requests_error)
    throw error(500, 'Internal Server Error')
  }

  const { page: usedPage, count, total, requests, page_size } = q_requests

  return {
    page: usedPage,
    count,
    total,
    q_requests: requests,
    page_size,
  }
}
