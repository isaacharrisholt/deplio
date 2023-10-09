import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({
    locals: { getSession, user, team },
}) => {
    return {
        session: await getSession(),
        user,
        team,
    }
}
