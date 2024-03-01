import type { PageLoad } from './$types'
import { trpc } from '$lib/trpc/client'

export const load: PageLoad = async (event) => {
  const { parent, url } = event
  const { team } = await parent()

  let page: number | undefined = +(url.searchParams.get('page') ?? 0)
  if (isNaN(page) || page < 1) {
    page = undefined
  }

  const { qRequests } = await trpc(event).get_q_requests.query({
    team_id: team.id,
    page,
  })

  return { qRequests }
}
