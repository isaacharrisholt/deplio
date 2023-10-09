import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, team } }) => {
    const { data: projects, error: projectFetchError } = await supabase
        .from('project')
        .select('id, name, description, repos:repo (*)')
        .eq('team_id', team.id)

    if (projectFetchError) {
        throw error(500, `Error fetching projects: ${projectFetchError.message}`)
    }

    if (projects.length) {
        return { projects, githubInstallations: [] }
    }

    const { data: githubInstallations, error: githubInstallationFetchError } =
        await supabase
            .from('github_installation')
            .select('installation_id')
            .eq('team_id', team.id)

    if (githubInstallationFetchError) {
        throw error(
            500,
            `Error fetching GitHub installations: ${githubInstallationFetchError.message}`,
        )
    }

    return { githubInstallations, projects: [] }
}
