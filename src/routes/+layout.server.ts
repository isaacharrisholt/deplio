import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { getSession, user } }) => {
    console.log('user', user)
    return {
        session: await getSession(),
        user,
    }
}
