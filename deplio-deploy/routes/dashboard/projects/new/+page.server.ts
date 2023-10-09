import type { FormMessage } from '$lib/forms/client'
import { createNewProjectSchema } from '$lib/forms/projects'
import { getGitHubReposForInstallation } from '$lib/github.server'
import type { Database } from '$lib/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { error, fail, redirect } from '@sveltejs/kit'
import { message, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'

async function fetchProjectAndRepoData(
    supabase: SupabaseClient<Database>,
    teamId: string,
) {
    const { data: projects, error: projectFetchError } = await supabase
        .from('project')
        .select('name')
        .eq('team_id', teamId)

    if (projectFetchError) {
        throw error(500, `Error fetching projects: ${projectFetchError.message}`)
    }

    const { data: githubInstallations, error: githubInstallationFetchError } =
        await supabase
            .from('github_installation')
            .select('installation_id')
            .eq('team_id', teamId)

    if (githubInstallationFetchError) {
        throw error(
            500,
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

    return { projects, githubInstallations, repos }
}

export const load: PageServerLoad = async (event) => {
    const {
        locals: { supabase, team },
    } = event

    const { projects, githubInstallations, repos } = await fetchProjectAndRepoData(
        supabase,
        team.id,
    )

    const formSchema = createNewProjectSchema(
        projects.map((p) => p.name),
        repos.map((r) => r.full_name) as [string, ...string[]],
    )
    const form = await superValidate(event, formSchema)

    return { githubInstallations, repos, projects, form }
}

export const actions: Actions = {
    default: async (event) => {
        const {
            locals: { supabase, team, user },
        } = event
        const { projects, repos } = await fetchProjectAndRepoData(supabase, team.id)

        const formSchema = createNewProjectSchema(
            projects.map((p) => p.name),
            repos.map((r) => r.full_name) as [string, ...string[]],
        )

        const form = await superValidate<typeof formSchema, FormMessage>(
            event,
            formSchema,
        )

        if (!form.valid) {
            return fail(400, { form })
        }

        const { data: newProject, error: projectInsertError } = await supabase
            .from('project')
            .insert({
                created_by: user.id,
                team_id: team.id,
                name: form.data.name,
                description: form.data.description || null,
            })
            .select()
            .single()

        if (projectInsertError) {
            console.log(`Error inserting project: ${projectInsertError.message}`)
            return message(
                form,
                {
                    status: 'error',
                    message: 'An internal error occurred. Please try again later.',
                },
                { status: 500 },
            )
        }

        // Filter repos to only those selected in the form
        const repoInserts = repos
            .filter((repo) => repo.full_name === form.data.repo)
            .map((repo) => ({
                project_id: newProject.id,
                ...repo,
            }))

        const { error: projectRepoInsertError } = await supabase
            .from('repo')
            .insert(repoInserts)

        if (projectRepoInsertError) {
            console.log(
                `Error inserting project repos: ${projectRepoInsertError.message}`,
            )
            return message(
                form,
                {
                    status: 'error',
                    message: 'An internal error occurred. Please try again later.',
                },
                { status: 500 },
            )
        }

        throw redirect(303, `/dashboard/projects/${newProject.id}`)
    },
}
