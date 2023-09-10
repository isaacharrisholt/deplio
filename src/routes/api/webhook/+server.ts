import { getSupabaseAdminClient } from '$lib/utils.server'
import { error, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request }) => {
    const requestJson = await request.json()

    const supabase = getSupabaseAdminClient()

    // Check if this repo is registered to any projects
    const { data: repo, error: repoFetchError } = await supabase
        .from('repo')
        .select('id, project (*)')
        .eq('full_name', requestJson.repository.full_name)
        .maybeSingle()

    if (repoFetchError) {
        console.log(`Error fetching repo: ${repoFetchError.message}`)
        throw error(500, `Error fetching repo: ${repoFetchError.message}`)
    }

    if (!repo || !repo.project) {
        return new Response(null, { status: 200 })
    }

    console.log('repo', repo)

    const { data: deployment, error: deploymentInsertError } = await supabase
        .from('deployment')
        .insert({
            repo_id: repo.id,
            ref: requestJson.check_suite.head_branch,
            sha: requestJson.check_suite.head_sha,
            status: 'okay',
            environment: 'dev',
            url: 'something',
        })
        .select()
        .single()

    if (deploymentInsertError) {
        console.log(`Error inserting deployment: ${deploymentInsertError.message}`)
        throw error(500, `Error inserting deployment: ${deploymentInsertError.message}`)
    }

    console.log('deployment', deployment)

    return new Response('ok', { status: 200 })
}
