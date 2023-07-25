import { GITHUB_APP_ID, GITHUB_PRIVATE_KEY } from '$env/static/private'
import { App } from 'octokit'
import { type Result, Err, Ok } from '$lib/types/result'
import type { RepoInsert } from '$lib/types/supabase'

const app = new App({
    appId: GITHUB_APP_ID,
    privateKey: GITHUB_PRIVATE_KEY,
})

export async function getGitHubReposForInstallation(
    installationId: number,
): Promise<Result<Omit<RepoInsert, 'project_id'>[]>> {
    const octokit = await app.getInstallationOctokit(installationId)
    const response = await octokit.request('GET /installation/repositories', {
        per_page: 100,
    })

    if (response.status !== 200) {
        return Err(new Error(`Error fetching GitHub repos: ${response.status}`))
    }

    const repos: Omit<RepoInsert, 'project_id'>[] = response.data.repositories.map(
        (repo) => ({
            name: repo.name,
            full_name: repo.full_name,
            git_provider: 'github',
            provider_repo_id: String(repo.id),
        }),
    )

    return Ok(repos)
}
