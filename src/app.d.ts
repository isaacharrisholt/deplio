import type { PageMeta } from '$lib/components/Meta.svelte'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'
import type { UserWithTeams, TeamWithRole } from '$lib/types/supabase'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>
      getSession: () => Promise<Session | null>
      user: UserWithTeams
      team: TeamWithRole
    }
    interface PageData {
      session: Session | null
      user: UserWithTeams
      team: TeamWithRole
      meta?: PageMeta
    }
    // interface Error {}
    // interface Platform {}
  }
}
