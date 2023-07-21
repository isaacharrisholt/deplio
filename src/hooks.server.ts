import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit'
import type { Handle } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'
import { cache } from '$lib/cache'
import type { TeamWithRole, UserWithTeams } from '$lib/types/supabase'

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createSupabaseServerClient({
        supabaseUrl: PUBLIC_SUPABASE_URL,
        supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
        event,
    })

    /**
     * a little helper that is written for convenience so that instead
     * of calling `const { data: { session } } = await supabase.auth.getSession()`
     * you just call this `await getSession()`
     */
    event.locals.getSession = async () => {
        const {
            data: { session },
        } = await event.locals.supabase.auth.getSession()
        return session
    }
    const session = await event.locals.getSession()

    if (event.url.pathname.startsWith('/dashboard') && !session) {
        if (!session) {
            throw redirect(303, '/login')
        }
    } else if (!session) {
        return resolve(event, {
            filterSerializedResponseHeaders(name) {
                return name === 'content-range'
            },
        })
    }

    let user = await cache.hgetall(`user:${session?.user.id}`)
    const refreshCache = event.url.searchParams.get('refreshCache')

    if (!user || refreshCache) {
        const { data: userFetch, error: userFetchError } = await event.locals.supabase
            .from('user')
            .select('*, team_user (team (*), role)')
            .eq('user_id', session?.user.id)
            .single()

        if (userFetchError) {
            throw userFetchError
        }

        if (!userFetch) {
            throw new Error('User not found')
        }

        const { team_user: teamUser, ...extractedUser } = userFetch

        const userWithTeams: UserWithTeams = {
            ...extractedUser,
            teams: teamUser.map(
                (teamWithRole) =>
                    ({
                        ...teamWithRole.team,
                        role: teamWithRole.role,
                    } as TeamWithRole),
            ),
        }

        await cache.hset(`user:${session?.user.id}`, userWithTeams, {
            ttlSeconds: 60 * 60, // 1 hour
        })
        user = userWithTeams
    }
    event.locals.user = user

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range'
        },
    })
}
