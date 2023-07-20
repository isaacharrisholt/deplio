import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { getSession, user } }) => {
    return {
        session: await getSession(),
        user,
    }
}
