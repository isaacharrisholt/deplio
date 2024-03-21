import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { api }, url }) => {
  let page: number | undefined = +(url.searchParams.get('page') ?? 0)
  if (isNaN(page) || page < 1) {
    page = undefined
  }

  return { stream: { q_request_promise: api.q.list({ page }) } }
}
