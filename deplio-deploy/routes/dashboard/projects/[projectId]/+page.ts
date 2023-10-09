import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params }) => {
    const { supabase } = await parent()

    const { data: project, error: projectFetchError } = await supabase
        .from('project')
        .select()
        .eq('id', params.projectId)
        .single()

    if (projectFetchError) {
        throw error(500, `Error fetching project: ${projectFetchError.message}`)
    }

    return { project }
}
