import type { Team } from '$lib/types/supabase'
import type { RequestEvent } from '@sveltejs/kit'

export async function create_trpc_context<TEvent extends RequestEvent>(event: TEvent) {
  return {
    supabase: event.locals.supabase,
    user: event.locals.user,
    team: event.locals.team as Team,
  }
}

export type Context = Awaited<ReturnType<typeof create_trpc_context>>