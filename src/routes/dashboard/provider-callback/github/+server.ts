import { redirect, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({
    url,
    locals: { getSession, supabase, team },
}) => {
    const session = await getSession()
    if (!session) {
        return new Response('no session', { status: 401 })
    }
    const setupAction = url.searchParams.get('setup_action')

    if (!setupAction) {
        throw error(400, 'No setup action provided')
    }

    if (setupAction === 'install') {
        const installationId = url.searchParams.get('installation_id')

        if (!installationId) {
            throw error(400, 'No installation id provided')
        }

        const { error: installationInsertError } = await supabase
            .from('github_installation')
            .insert({
                installation_id: +installationId,
                team_id: team.id,
            })

        if (installationInsertError) {
            throw error(
                400,
                `Error inserting installation: ${installationInsertError.message}`,
            )
        }
    }

    throw redirect(303, '/dashboard/projects')
}
