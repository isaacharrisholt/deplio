import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({
  locals: { getSession, user, team, api },
}) => {
  return {
    session: await getSession(),
    user,
    team,
    api,
  }
}
