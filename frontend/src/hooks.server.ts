import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_API_URL,
} from '$env/static/public'
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit'
import type { Handle } from '@sveltejs/kit'
import { error, redirect } from '@sveltejs/kit'
import { cache } from '$lib/cache'
import type { TeamWithRole, UserWithTeams } from '$lib/types/supabase'
import { Deplio } from '@deplio/sdk'

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
  event.locals.api = new Deplio({
    accessToken: session?.access_token,
    basePath: PUBLIC_API_URL,
  })

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
  const refresh_cache = event.url.searchParams.get('refresh_cache')

  if (!user || refresh_cache) {
    const { data: user_fetch, error: user_fetch_error } = await event.locals.supabase
      .from('user')
      .select('*, team_user (team (*), role)')
      .eq('user_id', session?.user.id)
      .single()

    if (user_fetch_error) {
      throw error(500, `Error fetching user: ${user_fetch_error.message}`)
    }

    if (!user_fetch) {
      throw error(404, 'User not found')
    }

    const { team_user: team_user, ...extracted_user } = user_fetch

    let current_team_id = await cache.hgetall(`user_current_team:${session?.user.id}`)

    if (!current_team_id) {
      const earliest_team = team_user.sort((teamUser1, teamUser2) => {
        return (teamUser1?.team?.created_at ?? 0) < (teamUser2?.team?.created_at ?? 0)
          ? -1
          : 1
      })[0]?.team

      if (!earliest_team) {
        throw error(404, 'User not found')
      }
      await cache.hset(`user_current_team:${session?.user.id}`, earliest_team.id)
      current_team_id = earliest_team.id
    }

    const user_with_teams: UserWithTeams = {
      ...extracted_user,
      current_team_id,
      teams: team_user.map((teamWithRole) => {
        if (!teamWithRole.team) {
          throw error(404, 'Team not found')
        }
        return {
          ...teamWithRole.team,
          role: teamWithRole.role,
        }
      }),
    }

    await cache.hset(`user:${session?.user.id}`, user_with_teams, {
      ttlSeconds: 60 * 60, // 1 hour
    })
    user = user_with_teams
  }
  event.locals.user = user

  const new_team_id = event.url.searchParams.get('team')

  if (new_team_id) {
    event.locals.user.current_team_id = new_team_id
    await cache.hset(`user:${session?.user.id}`, event.locals.user, {
      ttlSeconds: 60 * 60, // 1 hour
    })
    await cache.hset(`user_current_team:${session?.user.id}`, new_team_id)
  }

  event.locals.team = event.locals.user.teams.find(
    (team) => team.id === event.locals.user.current_team_id,
  ) as TeamWithRole

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range'
    },
  })
}
