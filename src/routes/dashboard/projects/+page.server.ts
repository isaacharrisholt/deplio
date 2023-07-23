import { getGitHubReposForInstallation } from '$lib/github.server'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, team } }) => {
    const { data: githubInstallations, error: githubInstallationFetchError } =
        await supabase
            .from('github_installation')
            .select('installation_id')
            .eq('team_id', team.id)

    if (githubInstallationFetchError) {
        throw new Error(
            `Error fetching GitHub installations: ${githubInstallationFetchError.message}`,
        )
    }

    const repos = (
        await Promise.all(
            githubInstallations.map(async (installation) => {
                return await getGitHubReposForInstallation(installation.installation_id)
            }),
        )
    ).flatMap((result) => result.unwrapOr([]))

    console.log(repos)

    return { githubInstallations, repos }
}
