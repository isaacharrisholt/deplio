import type { PageServerLoad } from './$types'
import { ResponseError } from '@deplio/sdk'
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

  try {
    const {
      page: usedPage,
      count,
      total,
      requests,
      page_size,
    } = await api.q.list({ page })
    return {
      page: usedPage,
      count,
      total,
      q_requests: requests,
      page_size,
    }
  } catch (e: unknown) {
    if (e instanceof ResponseError) {
      console.log(await e.response.json())
      throw error(500, 'Internal Server Error')
    }
    console.log('unknown error', e)
    throw error(500, 'Internal Server Error')
  }
}
