import { error, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { message, superValidate } from 'sveltekit-superforms/client'
import { newApiKeyFormSchema } from '$lib/forms/settings'
import { generateApiKey, hashApiKey } from '$lib/apiKeys'
import parseDuration from 'parse-duration'
import { addHours } from 'date-fns'
import type { FormMessage } from '$lib/forms/client'

type FormMessageWithApiKey = FormMessage & { apiKey?: string }

export const load: PageServerLoad = async ({ locals: { supabase, user }, request }) => {
    const { data: apiKeys, error: apiKeyFetchError } = await supabase
        .from('api_key')
        .select(
            `
            name,
            created_at,
            revoked_at,
            expires_at,
            created_by (first_name, last_name, user_id),
            revoked_by (first_name, last_name, user_id)
            `,
        )
        .eq('team_id', user.currentTeamId)
        .order('created_at', { ascending: false })

    if (apiKeyFetchError) {
        console.error('error fetching api keys', apiKeyFetchError)
        throw error(500, 'error fetching api keys')
    }

    const form = await superValidate<typeof newApiKeyFormSchema, FormMessageWithApiKey>(
        request,
        newApiKeyFormSchema,
    )

    return { apiKeys, form }
}

export const actions: Actions = {
    new: async ({ locals: { supabase, user }, request }) => {
        const form = await superValidate<
            typeof newApiKeyFormSchema,
            FormMessageWithApiKey
        >(request, newApiKeyFormSchema)

        if (!form.valid) {
            return fail(400, { form })
        }

        const key = generateApiKey()
        const hash = await hashApiKey(key)

        const expiresAt =
            form.data.expiry === 'never'
                ? null
                : addHours(
                      new Date(),
                      parseDuration(form.data.expiry, 'h') || 0,
                  ).toISOString()

        const { error: apiKeyInsertError } = await supabase.from('api_key').insert({
            created_by: user.id,
            team_id: user.currentTeamId,
            key_hash: hash,
            name: form.data.name,
            expires_at: expiresAt,
            key_prefix: key.slice(0, 6),
        })

        if (apiKeyInsertError) {
            console.error('error inserting api key', apiKeyInsertError)
            return message(form, { status: 'error', message: 'Error creating API key' })
        }

        return message(form, {
            status: 'success',
            message: 'API key created',
            apiKey: key,
        })
    },
}
