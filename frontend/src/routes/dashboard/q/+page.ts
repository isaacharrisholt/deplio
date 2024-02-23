import type { PageLoad } from './$types'
import { trpc } from '$lib/trpc/client'

export const load: PageLoad = async (event) => {
  const { team } = await event.parent()
  const { qRequests } = await trpc(event).get_q_requests.query({
    team_id: team.id,
  })

  return { qRequests }
}
