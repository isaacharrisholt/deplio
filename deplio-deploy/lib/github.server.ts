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

export async function downloadRepoZip(
    installationId: number,
    repoFullName: string,
    ref: string,
): Promise<Result<ArrayBuffer>> {
    const octokit = await app.getInstallationOctokit(installationId)
    console.log(`downloading ${repoFullName} at ${ref}`)
    const response = await octokit.request('GET /repos/{owner}/{repo}/zipball/{ref}', {
        owner: repoFullName.split('/')[0],
        repo: repoFullName.split('/')[1],
        ref,
    })

    // Thanks for the typing, GitHub...
    if (response.status !== (200 as 302)) {
        console.log('Error', response.data)
        return Err(new Error(`Error fetching GitHub repo zip: ${response.status}`))
    }

    return Ok(response.data as ArrayBuffer)
}
