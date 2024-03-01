import type { RequestEvent } from '@sveltejs/kit'

export async function createContext<TEvent extends RequestEvent>(event: TEvent) {
  return {
    supabase: event.locals.supabase,
    user: event.locals.user,
    team: event.locals.team,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
