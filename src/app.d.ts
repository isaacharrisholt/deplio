import type { PageMeta } from '$lib/components/Meta.svelte'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

declare namespace App {
    interface Locals {
        supabase: SupabaseClient<Database>
        getSession: () => Promise<Session | null>
    }
    interface PageData {
        session: Session | null
        meta?: PageMeta
    }
    // interface Error {}
    // interface Platform {}
}
